# ⚡ QUICK UPLOAD ESP32-4 - Cheatsheet

## 📂 FILES READY
```
✅ C:\Users\NITRO V\Downloads\iot web\IOT-NEW-PAKYU\code iot\esp32-4\
   ├── esp32-4.ino      (firmware)
   └── data/            (frontend files)
       ├── index.html
       ├── assets/
       ├── favicon.svg
       └── icons.svg
```

---

## 🔧 ARDUINO IDE - QUICK STEPS

### 1. Install Libraries
```
Sketch → Include Library → Manage Libraries
→ ArduinoJson (v6.x)
→ AsyncTCP
```

**ESPAsyncWebServer** (manual):
- Download: https://github.com/me-no-dev/ESPAsyncWebServer/archive/refs/heads/master.zip
- Extract → rename → copy ke `Documents\Arduino\libraries\ESPAsyncWebServer`
- Restart Arduino IDE

### 2. Open Sketch
```
File → Open → code iot\esp32-4\esp32-4.ino
```

### 3. Board Settings
```
Tools → Board → ESP32 Dev Module
Tools → Port → COM8
```

### 4. Verify (Cek Error)
```
Click ✓ Verify button
```

### 5. Install Upload Plugin

**Arduino IDE 1.x:**
- https://github.com/lorol/arduino-esp32fs-plugin/releases
- Extract ke: `Documents\Arduino\tools\ESP32FS\tool\esp32fs.jar`

**Arduino IDE 2.x:**
- https://github.com/earlephilhower/arduino-littlefs-upload/releases

### 6. Upload Filesystem
```
Tutup Serial Monitor!
Tools → ESP32 Sketch Data Upload (IDE 1.x)
atau
Tools → Upload LittleFS to ESP32 (IDE 2.x)
Tunggu ~1-3 menit
```

### 7. Upload Firmware
```
Click → Upload button
Tunggu ~30-60 detik
```

### 8. Cek IP
```
Tools → Serial Monitor (115200 baud)
Press RESET button
Lihat output: IP Address: 192.168.1.xxx
```

### 9. Akses Website
```
http://192.168.1.xxx  (IP dari step 8)
```

---

## 🐛 TROUBLESHOOTING CEPAT

| Error | Solusi |
|-------|--------|
| Library not found | Install library (step 1) |
| Port not found | Cabut-colok USB, ganti port |
| Upload failed | Tekan BOOT saat "Connecting..." |
| Website 404 | Upload filesystem lagi (step 6) |
| Can't reach site | Cek WiFi: SSID "Wi-Fi", pass "123456789" |
| All devices offline | Cek UART wiring ESP1/2/3 ke ESP4 |

---

## 📡 WIFI CONFIG

Default di firmware (line 52-53):
```cpp
#define WIFI_SSID     "Wi-Fi"
#define WIFI_PASSWORD "123456789"
```

Untuk ubah: Edit `esp32-4.ino` → upload ulang firmware

---

## 🔌 PIN REFERENCE

| Device | RX ESP4 | TX ESP4 | Baud |
|--------|---------|---------|------|
| ESP1 | GPIO 16 | GPIO 17 | 9600 |
| ESP2 | GPIO 4 | GPIO 5 | 9600 |
| ESP3 | GPIO 13 | GPIO 15 | 9600 |

**Wiring:** TX ESP1 → RX ESP4 (cross), GND → GND (WAJIB!)

---

## ✅ SUCCESS INDICATOR

Serial Monitor output:
```
[WIFI] IP Address: 192.168.1.xxx
[HTTP] Access at: http://192.168.1.xxx
[READY] Gateway is ready!
```

Browser:
```
✅ Dashboard IoT muncul
✅ Device status terlihat
✅ Bisa kontrol lamp, door, gate, dll
```

---

## 📖 FULL GUIDE
Baca: `PANDUAN_UPLOAD_ESP32-4.md`
