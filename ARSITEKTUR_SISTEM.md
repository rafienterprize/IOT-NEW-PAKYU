# 🏗️ Arsitektur Sistem IoT Smart Home

## 📡 Diagram Komunikasi

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ARSITEKTUR LENGKAP                              │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐                 ┌──────────────┐
│   ESP32 #1   │                 │   ESP32 #2   │
│              │                 │              │
│ - Lamp       │                 │ - Clothesline│
│ - Gas Sensor │                 │ - Rain Sensor│
│ - Feeder     │                 │ - Buzzer     │
└──────┬───────┘                 └──────┬───────┘
       │                                │
       │ UART (GPIO 16/17)             │ UART (GPIO 4/5)
       │ Baudrate: 9600                │ Baudrate: 9600
       │                                │
       └────────────┬───────────────────┘
                    │
                    ↓
         ┌──────────────────────┐
         │     ESP32 #4         │ ←── USB Serial (GPIO 3/1)
         │   (GATEWAY)          │     Baudrate: 115200
         │                      │         │
         │ - LCD 20x4           │         │
         │ - Status LED x4      │         │
         │ - Buzzer             │         │
         │ - Config Button      │         │
         └──────────────────────┘         │
                    ↑                     │
                    │                     │
       ┌────────────┴───────────────┐    │
       │                            │    │
       │ UART (GPIO 2/18)           │    │
       │ Baudrate: 9600             │    │
       │                            │    │
┌──────┴───────┐                    │    │
│   ESP32 #3   │                    │    │
│              │                    │    │
│ - Door Servo │                    │    │
│ - Gate Servo │                    │    │
│ - RFID       │                    │    │
│ - IR Sensor  │                    │    │
└──────────────┘                    │    │
                                    │    │
                                    ↓    ↓
                            ┌─────────────────┐
                            │   KOMPUTER      │
                            │                 │
                            │  ┌───────────┐  │
                            │  │  BACKEND  │  │
                            │  │ (Node.js) │  │
                            │  │           │  │
                            │  │ Port 3001 │  │
                            │  └─────┬─────┘  │
                            │        │        │
                            │        │ HTTP + │
                            │        │ WebSocket
                            │        │        │
                            │  ┌─────▼─────┐  │
                            │  │  FRONTEND │  │
                            │  │ (React)   │  │
                            │  │           │  │
                            │  │ Port 5173 │  │
                            │  └───────────┘  │
                            │                 │
                            └─────────────────┘
                                    │
                                    │ Browser
                                    ↓
                            ┌─────────────────┐
                            │   WEB UI        │
                            │                 │
                            │ Dashboard       │
                            │ Device Control  │
                            │ Real-time Data  │
                            │ Alerts          │
                            └─────────────────┘
```

---

## 🔄 Alur Data

### 📥 ESP → Website (Data Flow)

```
1. Sensor membaca data (Gas, Rain, Door, dll)
   │
   ↓
2. ESP1/2/3 kirim via UART → ESP32-4
   Format: "ESP1:GAS:1200"
   │
   ↓
3. ESP32-4 terima & forward ke USB Serial
   Serial.println("ESP1:GAS:1200")
   │
   ↓
4. Backend terima via SerialPort
   serialService.on('data', ...)
   │
   ↓
5. Backend parse & simpan ke database
   prisma.deviceLog.create(...)
   │
   ↓
6. Backend broadcast via Socket.IO
   io.emit('device:log', data)
   │
   ↓
7. Frontend terima & update UI
   socket.on('device:log', updateDashboard)
```

### 📤 Website → ESP (Command Flow)

```
1. User click button di website
   │
   ↓
2. Frontend kirim HTTP POST ke backend
   fetch('/api/command', {espNumber: 1, command: 'LAMP:ON'})
   │
   ↓
3. Backend terima & format command
   "ESP1:LAMP:ON"
   │
   ↓
4. Backend kirim via Serial
   serialPort.write("ESP1:LAMP:ON\n")
   │
   ↓
5. ESP32-4 terima & parse
   handleUSBCommands() → target = "ESP1", payload = "LAMP:ON"
   │
   ↓
6. ESP32-4 forward ke ESP yang dituju
   ESP1Serial.println("LAMP:ON")
   │
   ↓
7. ESP1 terima & eksekusi
   handleCommand() → digitalWrite(LAMP_RELAY_PIN, HIGH)
   │
   ↓
8. ESP1 kirim konfirmasi
   sendLog("LAMP", "ON") → "ESP1:LAMP:ON"
   │
   ↓
9. Balik ke flow 📥 (Data flow ke website)
```

---

## 🔌 Detail Koneksi Hardware

### ESP32 #1 → ESP32 #4
```
ESP32 #1          ESP32 #4
────────          ────────
GPIO 17 (TX) ───→ GPIO 16 (RX)
GPIO 16 (RX) ←─── GPIO 17 (TX)
GND ──────────── GND
```

### ESP32 #2 → ESP32 #4
```
ESP32 #2          ESP32 #4
────────          ────────
GPIO 17 (TX) ───→ GPIO 4 (RX)
GPIO 16 (RX) ←─── GPIO 5 (TX)
GND ──────────── GND
```

### ESP32 #3 → ESP32 #4
```
ESP32 #3          ESP32 #4
────────          ────────
GPIO 17 (TX) ───→ GPIO 2 (RX)
GPIO 16 (RX) ←─── GPIO 18 (TX)
GND ──────────── GND
```

### ESP32 #4 → Komputer
```
ESP32 #4          Komputer
────────          ────────
USB Port ────────→ USB Port (COM3)
GPIO 3 (RX0)      
GPIO 1 (TX0)      
```

---

## 📊 Format Protokol Komunikasi

### Message Format: `ESPx:TYPE:MESSAGE`

#### Status Messages (setiap 3 detik)
```
ESP1:STATUS:OK,GAS=1200,LAMP=OFF,WIFI=NO
ESP2:STATUS:OK,RAIN=800,CLOTHESLINE=OUT,WIFI=OK
ESP3:STATUS:OK,DOOR=CLOSE,GATE=CLOSE,WIFI=OK
```

#### Sensor Data
```
ESP1:GAS:1200
ESP1:GAS:1850          # > threshold, trigger alert
ESP2:RAIN:1800         # > threshold, trigger auto clothesline
```

#### Device State Changes
```
ESP1:LAMP:ON
ESP1:LAMP:OFF
ESP1:FEEDER:DONE
ESP2:CLOTHESLINE:IN
ESP2:CLOTHESLINE:OUT
ESP3:DOOR:OPEN
ESP3:DOOR:CLOSE
ESP3:GATE:OPEN
ESP3:GATE:CLOSE
```

#### RFID Scans
```
ESP3:RFID:A1B2C3D4     # UID dari kartu RFID
```

#### Alerts
```
ESP1:GAS:ALERT         # Gas threshold exceeded
ESP2:RAIN:ALERT_CLOTHESLINE_IN
ESP2:RAIN:CLEAR_CLOTHESLINE_OUT
```

#### WiFi Status
```
ESP1:WIFI:CONNECTING
ESP1:WIFI:CONNECTED
ESP1:WIFI:FAILED
```

### Command Format (Backend → ESP)

#### Device Control
```
ESP1:LAMP:ON
ESP1:LAMP:OFF
ESP1:FEED
ESP2:CLOTHESLINE:IN
ESP2:CLOTHESLINE:OUT
ESP3:DOOR:OPEN
ESP3:DOOR:CLOSE
ESP3:GATE:OPEN
ESP3:GATE:CLOSE
```

#### WiFi Configuration
```
WIFI:SSID,PASSWORD     # Update WiFi untuk semua ESP
```

---

## 🎯 Responsibility per Component

### ESP32 #1 (Smart Lamp & Gas)
- ✅ Baca sensor gas (analog)
- ✅ Kontrol relay lampu (digital)
- ✅ Kontrol servo fish feeder
- ✅ Kirim status setiap 3 detik
- ✅ Kirim alert jika gas > threshold
- ✅ Terima command LAMP:ON/OFF, FEED

### ESP32 #2 (Clothesline & Rain)
- ✅ Baca sensor rain (analog)
- ✅ Kontrol servo clothesline
- ✅ Auto tarik jemuran jika hujan
- ✅ Buzzer alert saat hujan
- ✅ Kirim status setiap 3 detik
- ✅ Terima command CLOTHESLINE:IN/OUT

### ESP32 #3 (Door, Gate, RFID)
- ✅ Scan kartu RFID
- ✅ Kontrol servo door (auto close 3 detik)
- ✅ Kontrol servo gate (auto close 4 detik)
- ✅ Baca IR sensor untuk auto open
- ✅ Buzzer beep saat door open
- ✅ Kirim RFID UID ke backend
- ✅ Terima command DOOR/GATE:OPEN/CLOSE

### ESP32 #4 (Gateway & LCD)
- ✅ Terima data dari ESP1/2/3 via UART
- ✅ Forward data ke backend via USB Serial
- ✅ Terima command dari backend
- ✅ Forward command ke ESP yang dituju
- ✅ Tampilkan status di LCD 20x4
- ✅ LED indicator per ESP (online/offline)
- ✅ System LED berkedip
- ✅ Buzzer untuk startup & alert
- ✅ Button untuk resend WiFi config

### Backend (Node.js + Express)
- ✅ Terima data dari ESP32-4 via serial
- ✅ Parse format `ESPx:TYPE:MESSAGE`
- ✅ Simpan log ke database (Prisma + PostgreSQL)
- ✅ Update device state (online/offline)
- ✅ Simpan sensor history untuk chart
- ✅ Check threshold untuk alert
- ✅ Broadcast real-time via Socket.IO
- ✅ Handle RFID whitelist & authorization
- ✅ Auto mode (rain → clothesline in)
- ✅ REST API untuk command & query
- ✅ Error handling & reconnection logic

### Frontend (React + TypeScript)
- ✅ Connect ke backend via Socket.IO
- ✅ Real-time dashboard dengan chart
- ✅ Device control buttons
- ✅ Alert notifications
- ✅ RFID management
- ✅ Sensor history visualization
- ✅ Device online/offline indicator
- ✅ Auto mode toggle
- ✅ WiFi configuration
- ✅ Log viewer

---

## ⚡ Performance & Timing

| Metric | Value |
|--------|-------|
| Status update interval | 3 seconds |
| Sensor read interval | Real-time (loop) |
| Device offline timeout | 7 seconds |
| Socket.IO reconnect | Auto |
| Serial reconnect attempts | 10 |
| Serial reconnect delay | 5 seconds |
| Door auto-close | 3 seconds |
| Gate auto-close | 4 seconds |
| Database query timeout | 5 seconds |

---

## 🔒 Security Considerations

1. **RFID Authorization**
   - Whitelist stored in database
   - Unauthorized scans logged
   - Real-time alert for unauthorized access

2. **WiFi Credentials**
   - Stored in ESP32 #4 code (hardcoded for now)
   - Can be updated via Serial command
   - Future: Store in EEPROM or config file

3. **Backend API**
   - CORS restricted to frontend origin
   - No authentication yet (local network only)
   - Future: Add JWT auth for production

4. **Database**
   - PostgreSQL with Prisma ORM
   - Prepared statements (SQL injection safe)
   - Backup recommended

---

## 📈 Future Enhancements

- [ ] Add authentication (JWT)
- [ ] Mobile app (React Native)
- [ ] Cloud deployment (AWS/Azure)
- [ ] Machine learning untuk prediksi
- [ ] Email/SMS notifications
- [ ] Voice control (Alexa/Google Home)
- [ ] Energy monitoring
- [ ] Multi-user dengan roles
- [ ] Scheduling & automation rules
- [ ] Historical data analytics

---

**Architecture Version:** 1.0  
**Last Updated:** 2024  
**Created by:** Kiro AI Assistant
