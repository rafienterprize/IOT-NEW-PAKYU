# 🏗️ ARSITEKTUR & FLOW UPLOAD ESP32-4

## 📊 DIAGRAM SISTEM LENGKAP

```
┌────────────────────────────────────────────────────────────────┐
│                    SISTEM IOT SMART HOME                        │
└────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   BROWSER   │  User akses http://192.168.1.100
│  (Chrome/   │
│  Firefox)   │
└──────┬──────┘
       │ HTTP Request/Response (port 80)
       │ WebSocket (real-time)
       ↓
┌────────────────────────────────────────────────────────────────┐
│ ESP32 #4 - WEB SERVER & GATEWAY                                │
│                                                                  │
│ ┌────────────────────┐  ┌─────────────────────┐                │
│ │   ESPAsyncWeb      │  │   LittleFS          │                │
│ │   Server           │←─│   Filesystem        │                │
│ │   (Port 80)        │  │   (/data/)          │                │
│ │                    │  │                     │                │
│ │ - Serve HTML/JS/CSS│  │ - index.html        │                │
│ │ - REST API         │  │ - assets/*.js       │                │
│ │ - WebSocket        │  │ - assets/*.css      │                │
│ └────────────────────┘  │ - icons.svg         │                │
│                         └─────────────────────┘                │
│                                                                  │
│ WiFi: 192.168.1.100                                             │
│ SSID: "Wi-Fi"                                                   │
└────┬──────────────┬──────────────┬─────────────────────────────┘
     │              │              │
     │ UART 9600    │ UART 9600    │ UART 9600
     │ GPIO16/17    │ GPIO4/5      │ GPIO13/15
     ↓              ↓              ↓
┌─────────┐    ┌─────────┐    ┌─────────┐
│ ESP32#1 │    │ ESP32#2 │    │ ESP32#3 │
│  Lamp   │    │Clothesln│    │  Door   │
│  Gas    │    │  Rain   │    │  Gate   │
│ Feeder  │    │         │    │  RFID   │
└─────────┘    └─────────┘    └─────────┘
```

---

## 📤 FLOW UPLOAD FILESYSTEM & FIRMWARE

```
┌──────────────────────────────────────────────────────────────┐
│ STEP 1-4: PERSIAPAN (OTOMATIS - SUDAH SELESAI ✅)           │
└──────────────────────────────────────────────────────────────┘

Frontend Source          Build Process         Output
    (React)         →   npm run build    →   dist/
      │                                         │
      │                                         │
      ├─ src/App.tsx                           ├─ index.html
      ├─ src/components/                       ├─ assets/
      ├─ src/hooks/                            │   ├─ index-xxx.js
      └─ src/styles/                           │   └─ index-xxx.css
                                                ├─ favicon.svg
                                                └─ icons.svg
                         ↓
                    COPY FILES
                         ↓
                code iot/esp32-4/data/
                      │
                      ├─ index.html
                      ├─ assets/
                      ├─ favicon.svg
                      └─ icons.svg

┌──────────────────────────────────────────────────────────────┐
│ STEP 5-7: UPLOAD (MANUAL - ARDUINO IDE)                      │
└──────────────────────────────────────────────────────────────┘

Arduino IDE
    │
    ├─ 1. Open Sketch: esp32-4/esp32-4.ino
    │     │
    │     ├─ Include Libraries:
    │     │   ├─ ESPAsyncWebServer.h
    │     │   ├─ AsyncTCP.h
    │     │   └─ ArduinoJson.h
    │     │
    │     └─ Verify/Compile
    │           ↓ Success
    │
    ├─ 2. Upload Filesystem (LittleFS)
    │     │
    │     Tools → ESP32 Sketch Data Upload
    │           ↓
    │     Read: data/ folder
    │           ↓
    │     Create LittleFS image
    │           ↓
    │     Upload via USB → ESP32-4 Flash Memory
    │           ↓
    │     [Flash Memory Partition]
    │     ├─ Firmware (1.2MB)
    │     └─ LittleFS (1.5MB) ← Frontend files disimpan di sini
    │
    └─ 3. Upload Firmware
          │
          Click Upload (→)
                ↓
          Compile .ino
                ↓
          Upload via USB → ESP32-4 Flash Memory
                ↓
          ESP32-4 Restart
                ↓
          WiFi Connect
                ↓
          Mount LittleFS
                ↓
          Start Web Server (port 80)
                ↓
          Serial Monitor: "IP Address: 192.168.1.xxx"
```

---

## 🔄 DATA FLOW SAAT RUNNING

```
┌────────────────────────────────────────────────────────────┐
│ USER AKSES WEBSITE                                          │
└────────────────────────────────────────────────────────────┘

1. Browser Request
   │
   Browser → http://192.168.1.100/
   │
   ↓
2. ESP32-4 Web Server Terima Request
   │
   ESPAsyncWebServer::on("/", ...)
   │
   ↓
3. Baca File dari LittleFS
   │
   LittleFS.open("/index.html", "r")
   │
   ↓
4. Send Response ke Browser
   │
   response->addHeader("Content-Type", "text/html")
   response->send(200, "text/html", content)
   │
   ↓
5. Browser Render HTML
   │
   Load: assets/index-xxx.js
   Load: assets/index-xxx.css
   │
   ↓
6. JavaScript Request API
   │
   fetch("http://192.168.1.100/status")
   │
   ↓
7. ESP32-4 Process API Request
   │
   /status → buildStatusJson()
   → Read device state from RAM
   → Return JSON
   │
   ↓
8. Frontend Update UI
   │
   React setState → Re-render
   │
   ↓
   [User sees live dashboard]

┌────────────────────────────────────────────────────────────┐
│ USER KONTROL DEVICE (BUTTON CLICK)                         │
└────────────────────────────────────────────────────────────┘

1. User click "Lamp ON"
   │
   ↓
2. Frontend kirim API request
   │
   POST /command
   Body: {"target":1, "command":"LAMP:ON"}
   │
   ↓
3. ESP32-4 terima request
   │
   Parse JSON → target=1, command="LAMP:ON"
   │
   ↓
4. ESP32-4 kirim via UART
   │
   ESP1Serial.println("LAMP:ON")
   │ UART 9600 baud (TX GPIO17 → RX ESP1)
   ↓
5. ESP32 #1 terima command
   │
   handleCommand("LAMP:ON")
   digitalWrite(LAMP_PIN, HIGH)
   │
   ↓
6. ESP32 #1 kirim konfirmasi
   │
   Serial.println("ESP1:LAMP:ON")
   │ UART 9600 baud (TX ESP1 → RX GPIO16)
   ↓
7. ESP32-4 terima konfirmasi
   │
   parseAndUpdateState("ESP1:LAMP:ON")
   Update device state
   │
   ↓
8. Broadcast via HTTP/WebSocket
   │
   (Optional future: WebSocket push)
   │
   ↓
   [Frontend update status: Lamp ON ✅]
```

---

## 🗂️ MEMORY LAYOUT ESP32-4

```
┌─────────────────────────────────────────┐
│ ESP32 Flash Memory (4MB)                 │
├─────────────────────────────────────────┤
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ Bootloader (64KB)                   │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ Partition Table (4KB)               │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ Firmware - esp32-4.ino (1.2MB)     │ │
│ │ - ESPAsyncWebServer                │ │
│ │ - ArduinoJson                      │ │
│ │ - UART handlers                    │ │
│ │ - API endpoints                    │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ LittleFS Filesystem (1.5MB) ← KITA │ │
│ │ /index.html            (0.5KB)    │ │
│ │ /assets/index-xxx.js   (659KB)    │ │
│ │ /assets/index-xxx.css  (16KB)     │ │
│ │ /favicon.svg           (1KB)      │ │
│ │ /icons.svg             (5KB)      │ │
│ │ /rfid_whitelist.json   (dynamic)  │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ NVS (Non-Volatile Storage) (20KB)  │ │
│ │ - WiFi credentials                 │ │
│ │ - System settings                  │ │
│ └─────────────────────────────────────┘ │
│                                          │
└─────────────────────────────────────────┘
```

---

## 🔌 PIN MAPPING ESP32-4

```
ESP32-4 (Gateway)
┌────────────────────────────────────────┐
│                                        │
│  UART ke ESP1:                         │
│  ├─ RX: GPIO 16 ← TX ESP1              │
│  └─ TX: GPIO 17 → RX ESP1              │
│                                        │
│  UART ke ESP2:                         │
│  ├─ RX: GPIO 4  ← TX ESP2              │
│  └─ TX: GPIO 5  → RX ESP2              │
│                                        │
│  UART ke ESP3:                         │
│  ├─ RX: GPIO 13 ← TX ESP3              │
│  └─ TX: GPIO 15 → RX ESP3              │
│                                        │
│  LED Status:                           │
│  ├─ LED ESP1: GPIO 21 (Blue)           │
│  ├─ LED ESP2: GPIO 22 (Green)          │
│  ├─ LED ESP3: GPIO 23 (Red)            │
│  └─ LED SYS:  GPIO 19 (Yellow, blink)  │
│                                        │
│  Control:                              │
│  ├─ BUZZER: GPIO 14                    │
│  └─ BUTTON: GPIO 0 (BOOT)              │
│                                        │
│  USB Serial (Upload & Debug):         │
│  ├─ TX: GPIO 1                         │
│  └─ RX: GPIO 3                         │
│                                        │
└────────────────────────────────────────┘
```

---

## 📡 NETWORK TOPOLOGY

```
┌─────────────────────────────────────────────────────────┐
│                    WiFi Router                           │
│               (192.168.1.1)                             │
│                SSID: "Wi-Fi"                            │
└────────┬────────────────────┬──────────────────────────┘
         │                    │
         │                    │
    ┌────▼─────┐        ┌────▼─────┐
    │ Computer │        │ ESP32-4  │
    │ (Browser)│        │ Gateway  │
    │192.168.1.│        │192.168.1.│
    │    .5    │        │   .100   │
    └──────────┘        └──────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
       ┌────▼────┐       ┌────▼────┐      ┌────▼────┐
       │ ESP32#1 │       │ ESP32#2 │      │ ESP32#3 │
       │  UART   │       │  UART   │      │  UART   │
       │ 9600bps │       │ 9600bps │      │ 9600bps │
       └─────────┘       └─────────┘      └─────────┘
```

---

## ✅ VERIFICATION CHECKLIST

After upload, verify each layer:

### Layer 1: Flash Memory
```
✓ Firmware uploaded (check: "Done uploading")
✓ Filesystem uploaded (check: LittleFS upload complete)
```

### Layer 2: Boot & WiFi
```
✓ ESP32-4 boot (Serial Monitor: "ESP32-4 Gateway Controller")
✓ WiFi connected (Serial Monitor: "IP Address: 192.168.1.xxx")
```

### Layer 3: Web Server
```
✓ LittleFS mounted (Serial Monitor: tidak ada error "Failed to mount")
✓ Web server started (Serial Monitor: "Access at: http://...")
```

### Layer 4: Browser Access
```
✓ Ping test: ping 192.168.1.xxx (Reply, bukan timeout)
✓ Browser: http://192.168.1.xxx (Dashboard muncul)
✓ API test: http://192.168.1.xxx/status (JSON response)
```

### Layer 5: UART Communication
```
✓ ESP1/2/3 online (Serial Monitor: "UART ESP1/2/3 data terima")
✓ Device status (Dashboard: Connected, bukan Offline)
✓ Command test (Click button → device respond)
```

---

**Selamat! Anda sekarang paham arsitektur lengkap sistem!** 🎓
