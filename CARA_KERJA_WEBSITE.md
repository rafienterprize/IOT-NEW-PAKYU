# 🌐 CARA KERJA WEBSITE - IoT Smart Home

**Tanggal:** 3 Juni 2026  
**Mode:** Production (ESP32-4 Standalone)

---

## 🎯 OVERVIEW

Website IoT Anda **hosted langsung di ESP32-4**, tidak perlu server terpisah!

ESP32-4 bekerja sebagai:
1. **Web Server** → Menyajikan website (HTML, CSS, JavaScript)
2. **API Server** → Menyediakan REST API untuk kontrol device
3. **Gateway** → Menghubungkan ESP1/2/3 via UART

---

## 📂 DIMANA WEBSITE DISIMPAN?

### **Filesystem: LittleFS**

ESP32-4 punya filesystem bernama **LittleFS** (Little File System) yang menyimpan files seperti micro SD card.

```
ESP32-4 Flash Memory (4MB)
├── Program Memory (1.1 MB) → Firmware (esp32-4.ino)
└── LittleFS (2.9 MB)       → Frontend files
    ├── /index.html         (528 bytes)
    ├── /assets/
    │   ├── index-CBUBX1dm.js  (1.2 KB)
    │   ├── index-ChCr6obk.js  (197 KB)
    │   └── index-D0lTJJK1.css (15 KB)
    ├── /favicon.svg        (1.5 KB)
    └── /icons.svg          (5.2 KB)
```

**Total frontend size:** ~220 KB (masih banyak ruang kosong!)

---

## 🔄 ALUR KERJA LENGKAP

### **1. User Akses Website**

```
┌──────────────┐
│   Browser    │  User ketik: http://192.168.1.105
│ (Chrome/FF)  │
└───────┬──────┘
        │ HTTP GET /
        ↓
┌───────────────────────────┐
│      ESP32-4 Web Server   │
│  ESPAsyncWebServer (C++)  │
│  Port: 80                 │
└───────┬───────────────────┘
        │ Read dari LittleFS
        ↓
┌───────────────────────────┐
│  LittleFS Filesystem      │
│  File: /index.html        │
└───────┬───────────────────┘
        │ Return HTML
        ↓
┌───────────────────────────┐
│      Browser              │
│  HTML loaded! ✅          │
└───────────────────────────┘
```

**Yang terjadi:**
1. Browser kirim request: `GET http://192.168.1.105/`
2. ESP32-4 baca file `/index.html` dari LittleFS
3. ESP32-4 kirim HTML ke browser
4. Browser render HTML → website muncul!

---

### **2. Browser Load JavaScript & CSS**

```
┌──────────────┐
│   Browser    │  Parse HTML → butuh JS & CSS
└───────┬──────┘
        │ HTTP GET /assets/index-ChCr6obk.js
        │ HTTP GET /assets/index-D0lTJJK1.css
        ↓
┌───────────────────────────┐
│      ESP32-4 Web Server   │
│  Cari files di LittleFS   │
└───────┬───────────────────┘
        │ Baca files
        ↓
┌───────────────────────────┐
│  LittleFS                 │
│  /assets/index-*.js       │
│  /assets/index-*.css      │
└───────┬───────────────────┘
        │ Return files
        ↓
┌───────────────────────────┐
│      Browser              │
│  JavaScript execute! ✅   │
│  React app running! ✅    │
└───────────────────────────┘
```

**Yang terjadi:**
1. HTML punya tag `<script src="/assets/index-ChCr6obk.js">`
2. Browser request JavaScript file
3. ESP32-4 kirim JavaScript dari LittleFS
4. Browser execute → React app jalan!

---

### **3. React App Request Device Status**

```
┌──────────────────────────┐
│   Browser - React App    │
│  useEffect(() => {       │
│    fetchStatus();        │
│  }, []);                 │
└───────┬──────────────────┘
        │ HTTP GET /status
        │ (relative URL: sama origin)
        ↓
┌───────────────────────────┐
│  ESP32-4 API Handler      │
│  server.on("/status", ...)│
└───────┬───────────────────┘
        │ Kirim command via UART
        ↓
┌───────────────────────────┐
│  ESP1 / ESP2 / ESP3       │
│  Respond dengan status    │
└───────┬───────────────────┘
        │ Status data
        ↓
┌───────────────────────────┐
│  ESP32-4                  │
│  Build JSON response      │
│  { devices: [...] }       │
└───────┬───────────────────┘
        │ HTTP 200 OK + JSON
        ↓
┌───────────────────────────┐
│  Browser - React App      │
│  setState(devices) ✅     │
│  UI update! ✅            │
└───────────────────────────┘
```

**Yang terjadi:**
1. React app mount → `useEffect` run
2. Fetch API call: `GET /status` (relative URL)
3. ESP32-4 query ESP1/2/3 via UART
4. ESP32-4 build JSON response
5. Browser terima JSON → update UI

---

### **4. User Click Button (Control Device)**

```
┌──────────────────────────┐
│   Browser - React App    │
│  User click "Lamp ON"    │
└───────┬──────────────────┘
        │ HTTP POST /command
        │ Body: { target: 1, command: "LAMP:ON" }
        ↓
┌───────────────────────────┐
│  ESP32-4 API Handler      │
│  server.on("/command", ...)│
│  Parse JSON body          │
└───────┬───────────────────┘
        │ UART TX
        │ "ESP1:LAMP:ON\n"
        ↓
┌───────────────────────────┐
│  ESP32-1 (Living Room)    │
│  Serial.available()       │
│  Parse command            │
│  digitalWrite(LAMP, HIGH) │
└───────┬───────────────────┘
        │ UART RX
        │ "ESP1:LAMP:ON:OK\n"
        ↓
┌───────────────────────────┐
│  ESP32-4                  │
│  Response: { success: true }│
└───────┬───────────────────┘
        │ HTTP 200 OK
        ↓
┌───────────────────────────┐
│  Browser - React App      │
│  Show notification ✅     │
│  Update lamp icon ✅      │
└───────────────────────────┘
```

**Yang terjadi:**
1. User click button → `onClick` handler
2. Frontend POST `/command` dengan JSON body
3. ESP32-4 parse JSON → kirim via UART ke ESP1
4. ESP1 eksekusi command → nyalakan lampu
5. ESP1 kirim konfirmasi balik
6. ESP32-4 response ke browser → UI update

---

## 🔑 KEY CONCEPTS

### **1. Same Origin Policy**

**Frontend config:**
```typescript
export const ESP4_BASE_URL = ''; // Empty string = relative URL
```

**Kenapa pakai empty string?**
- Browser akses: `http://192.168.1.105/`
- API call: `GET /status`
- Browser otomatis gunakan: `http://192.168.1.105/status`
- Same origin → **no CORS issues!** ✅

**Alternative (SALAH - hardcode):**
```typescript
export const ESP4_BASE_URL = 'http://192.168.1.100'; // ❌ JANGAN!
```
- Browser akses: `http://192.168.1.105/`
- API call ke: `http://192.168.1.100/status`
- Different origin → **CORS error!** ❌
- IP beda → **connection failed!** ❌

---

### **2. Single Page Application (SPA)**

Website adalah **React SPA** → semua routing di client-side:

```
http://192.168.1.105/           → index.html
http://192.168.1.105/dashboard  → index.html (React Router)
http://192.168.1.105/logs       → index.html (React Router)
```

ESP32-4 firmware handle ini dengan **catch-all route:**

```cpp
// Serve static files
server.serveStatic("/", LittleFS, "/");

// Catch-all for React Router
server.onNotFound([](AsyncWebServerRequest *request) {
  if (request->method() == HTTP_GET) {
    request->send(LittleFS, "/index.html", "text/html");
  }
});
```

**Yang terjadi:**
- User akses `/dashboard` → ESP32-4 serve `index.html`
- React Router baca URL → render `<Dashboard />` component
- Semua navigation di client-side (tidak reload page)

---

### **3. REST API Endpoints**

ESP32-4 menyediakan API untuk frontend:

| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `/status` | GET | Get semua device status |
| `/sensor/gas` | GET | Get gas sensor value |
| `/sensor/rain` | GET | Get rain sensor value |
| `/command` | POST | Send command ke device |
| `/wifi` | POST | Update WiFi config |
| `/logs` | GET | Get system logs |
| `/automode` | GET/POST | Get/set auto mode |
| `/rfid/whitelist` | GET/POST/DELETE | RFID whitelist management |

**Contoh request:**
```javascript
// Frontend code
const response = await fetch('/status');
const data = await response.json();
// { devices: [ { espNumber: 1, isOnline: true, ... } ] }
```

**ESP32-4 handler:**
```cpp
server.on("/status", HTTP_GET, [](AsyncWebServerRequest *request) {
  String json = buildStatusJson(); // Query ESP1/2/3 via UART
  request->send(200, "application/json", json);
});
```

---

## 🚀 KENAPA PAKAI ESP32-4 SEBAGAI WEB SERVER?

### **Keuntungan:**

✅ **Standalone** → Tidak perlu laptop/PC running 24/7  
✅ **Simple** → No backend server needed  
✅ **Low power** → ESP32 konsumsi daya rendah (~240mA)  
✅ **Fast** → Akses lokal via WiFi (low latency)  
✅ **Reliable** → Tidak bergantung internet  
✅ **Cost effective** → No hosting fees  

### **Limitasi:**

⚠️ **Local only** → Hanya bisa diakses dalam WiFi yang sama  
⚠️ **No database** → Data tidak persistent (restart = hilang)  
⚠️ **Limited memory** → Max ~200 KB frontend (cukup!)  
⚠️ **Single threaded** → Concurrent requests limited  
⚠️ **No authentication** → Siapa saja bisa akses (sementara)  

---

## 🔧 CARA KERJA UART COMMUNICATION

ESP32-4 sebagai **gateway** menghubungkan ESP1/2/3:

```
┌─────────────┐
│   ESP32-1   │  Living Room (Lamp, Gas, Feeder)
│  RX TX  GND │
└──┬──┬───┬───┘
   │  │   │
   │  │   └─────────┐
   │  └───────────┐ │
   │              │ │
┌──┴──┴───────────┴─┴───┐
│  ESP32-4 Gateway      │
│  Pin 16 (RX) ← ESP1 TX│
│  Pin 17 (TX) → ESP1 RX│
│  Pin  4 (RX) ← ESP2 TX│
│  Pin  5 (TX) → ESP2 RX│
│  Pin 26 (RX) ← ESP3 TX│
│  Pin 27 (TX) → ESP3 RX│
└───────────────────────┘
```

**Protocol:**

**ESP32-4 → ESP1:**
```
TX: "ESP1:LAMP:ON\n"
```

**ESP1 → ESP32-4:**
```
RX: "ESP1:LAMP:ON:OK\n"
RX: "ESP1:STATUS:LAMP=ON,GAS=1200\n"
```

**Baudrate:** 9600 (UART antar ESP32)

---

## 📊 DATA FLOW DIAGRAM

### **Complete Flow:**

```
┌──────────────────────────────────────────────────────────────┐
│                         USER                                  │
│                    (Browser/Phone)                            │
└───────────────────────────┬──────────────────────────────────┘
                            │ WiFi (192.168.1.x)
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                      ESP32-4 Gateway                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Web Server (ESPAsyncWebServer)                      │    │
│  │ - Serve HTML/JS/CSS from LittleFS                   │    │
│  │ - Handle API requests                               │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ API Handlers                                        │    │
│  │ - /status, /command, /sensor, /wifi, /logs, etc.  │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ UART Communication Manager                          │    │
│  │ - Query ESP1/2/3 via Serial                        │    │
│  │ - Parse responses                                   │    │
│  │ - Build JSON for frontend                           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────┬──────────────┬──────────────┬─────────────────────────┘
      │ UART         │ UART         │ UART
      │ (9600)       │ (9600)       │ (9600)
      ↓              ↓              ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│  ESP32-1 │  │  ESP32-2 │  │  ESP32-3 │
│  Living  │  │ Clothes  │  │ Entrance │
│   Room   │  │   line   │  │          │
├──────────┤  ├──────────┤  ├──────────┤
│ - Lamp   │  │ - Motor  │  │ - Door   │
│ - Gas    │  │ - Rain   │  │ - Gate   │
│ - Feeder │  │ - Auto   │  │ - RFID   │
└──────────┘  └──────────┘  └──────────┘
```

---

## 🎨 FRONTEND ARCHITECTURE

**React Component Tree:**

```
App.tsx
├── Router
│   ├── Dashboard (/)
│   │   ├── DeviceCard (ESP1)
│   │   │   ├── StatusIndicator
│   │   │   ├── SensorChart (Gas)
│   │   │   └── ControlButtons (Lamp, Feed)
│   │   ├── DeviceCard (ESP2)
│   │   │   ├── StatusIndicator
│   │   │   ├── SensorChart (Rain)
│   │   │   └── ControlButtons (Clothesline, Auto)
│   │   ├── DeviceCard (ESP3)
│   │   │   ├── StatusIndicator
│   │   │   └── ControlButtons (Door, Gate)
│   │   └── DeviceCard (ESP4)
│   │       └── GatewayStatus
│   │
│   ├── Logs (/logs)
│   │   ├── LogFilter
│   │   └── LogTable
│   │
│   ├── WiFiConfig (/wifi)
│   │   └── WiFiForm
│   │
│   └── RFIDManager (/rfid)
│       ├── WhitelistTable
│       ├── AddCardForm
│       └── ScanHistory
│
└── Services
    ├── esp4Service.ts (API calls)
    ├── useDeviceStatus.ts (React hook)
    └── useSensorData.ts (React hook)
```

---

## ⚡ PERFORMANCE

### **Response Time:**

| Operation | Time |
|-----------|------|
| Load website | ~500ms (first load) |
| API call (/status) | ~100-200ms |
| Command execution | ~50-100ms |
| Sensor data update | Real-time (3s polling) |

### **Memory Usage:**

| Component | RAM |
|-----------|-----|
| ESP32-4 firmware | 54 KB (16%) |
| Frontend files | 220 KB (LittleFS) |
| Free RAM | 274 KB (84%) |

---

## 🔒 SECURITY NOTES

### **Current Implementation:**

⚠️ **No authentication** → Anyone on WiFi can access  
⚠️ **No encryption** → HTTP only (not HTTPS)  
⚠️ **No rate limiting** → Could be spammed  
⚠️ **CORS open** → Any origin accepted  

### **Untuk Production:**

✅ Add basic auth (username/password)  
✅ Add HTTPS with self-signed certificate  
✅ Add rate limiting on API  
✅ Add CORS whitelist  
✅ Add input validation  
✅ Add command authorization  

---

## 🎯 SUMMARY

**Cara kerja website IoT Anda:**

1. **Frontend files** disimpan di LittleFS ESP32-4
2. **User akses** via browser → ESP32-4 serve files
3. **React app** load → request data via API
4. **ESP32-4** query ESP1/2/3 via UART
5. **ESP1/2/3** respond → ESP32-4 build JSON
6. **Frontend** terima JSON → update UI
7. **User click button** → POST command
8. **ESP32-4** forward command via UART
9. **Device** eksekusi → respond balik
10. **Frontend** update UI → done! ✅

**Semua berjalan di local network, cepat, dan tidak perlu internet!**

---

## 📚 NEXT READING

- **QUICK_START.md** - Cara deploy website
- **ARSITEKTUR_SISTEM.md** - Diagram lengkap sistem
- **BUG_REPORT_DAN_FIX.md** - Penjelasan bugs & fixes

---

**Semoga membantu memahami cara kerja website Anda! 🚀**

**Made with ❤️ by Kiro AI**
