# 🏠 IoT Smart Home System

Sistem IoT Smart Home lengkap dengan ESP32, backend Node.js, dan frontend React untuk monitoring dan kontrol device smart home secara real-time.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![ESP32](https://img.shields.io/badge/ESP32-Arduino-blue)](https://www.espressif.com/en/products/socs/esp32)

---

## ✨ Features

### 🏠 Smart Devices
- 💡 **Smart Lamp** - Kontrol lampu dengan relay (ESP32 #1)
- 🚨 **Gas Detector** - Monitoring gas MQ-2 dengan auto alert (ESP32 #1)
- 🐟 **Fish Feeder** - Pemberi makan ikan otomatis (ESP32 #1)
- 🌧️ **Rain Sensor** - Deteksi hujan otomatis (ESP32 #2)
- 👕 **Smart Clothesline** - Jemuran otomatis masuk saat hujan (ESP32 #2)
- 🚪 **Smart Door** - Pintu otomatis dengan RFID & IR sensor (ESP32 #3)
- 🚗 **Smart Gate** - Gerbang otomatis dengan IR sensor (ESP32 #3)

### 📊 Monitoring & Control
- 📈 Real-time sensor data visualization
- 🔔 Push notifications & alerts
- 📱 Responsive web interface
- 📊 Historical data charts
- 🔐 RFID access control management
- 🤖 Auto mode untuk automation
- 📡 WiFi configuration via web
- 📝 Device activity logs

### 🛠️ Technical Features
- ⚡ WebSocket untuk real-time updates
- 💾 PostgreSQL database dengan Prisma ORM
- 🔄 Auto-reconnect serial & WebSocket
- 🧪 Mock mode untuk development tanpa hardware
- 📡 ESP32 #4 sebagai gateway (UART ↔ USB Serial)
- 🎨 Modern UI dengan React + TypeScript + Vite

---

## 🏗️ Arsitektur Sistem

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   ESP32 #1  │  │   ESP32 #2  │  │   ESP32 #3  │
│  Lamp, Gas  │  │ Clothesline │  │ Door, Gate  │
│   Feeder    │  │    Rain     │  │    RFID     │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │ UART (9600 baud)
                        ↓
                ┌───────────────┐
                │   ESP32 #4    │
                │   (Gateway)   │
                │  LCD + LED    │
                └───────┬───────┘
                        │ USB Serial (115200)
                        ↓
                ┌───────────────┐
                │   Backend     │
                │   Node.js     │
                │   Port 3001   │
                └───────┬───────┘
                        │ HTTP + WebSocket
                        ↓
                ┌───────────────┐
                │   Frontend    │
                │     React     │
                │   Port 5173   │
                └───────────────┘
```

---

## 🚀 Quick Start

### **MODE 1: Production (ESP32-4 Standalone)** ⭐ **RECOMMENDED**

Website langsung hosted di ESP32-4, tidak perlu Node.js!

#### 1️⃣ Upload ke ESP32-4
```bash
# Buka Arduino IDE
# File → Open: code iot/esp32-4/esp32-4.ino
# Tools → Board: ESP32 Dev Module
# Tools → Port: COM8 (sesuaikan)
# Tools → Partition: Default 4MB with spiffs

# Upload filesystem (frontend files)
Tools → ESP32 Sketch Data Upload
# Tunggu 2-3 menit

# Upload firmware
Ctrl + U
```

#### 2️⃣ Dapatkan IP Address
```bash
# Open Serial Monitor (115200 baud)
# Press RESET button on ESP32-4
# Catat IP address yang muncul:
# [WIFI] IP Address: 192.168.1.XXX
```

#### 3️⃣ Akses Website
```
http://192.168.1.XXX
```

🎉 **Done!** Dashboard langsung bisa diakses dari ESP32-4!

**📖 Panduan Lengkap:** Baca [**QUICK_START.md**](QUICK_START.md) untuk detail!

---

### **MODE 2: Development (Vite + Node.js)**

Untuk development frontend dengan hot-reload:

#### 1️⃣ Upload ESP32 Code
Buka Arduino IDE dan upload:
- `code iot/esp32-1.ino` → ESP32 #1
- `code iot/esp32-2.ino` → ESP32 #2
- `code iot/esp32-3.ino` → ESP32 #3
- `code iot/esp32-4.ino` → ESP32 #4

**Jangan lupa:** Edit WiFi credentials di semua ESP32

#### 2️⃣ Setup Backend
```bash
cd backend
npm install

# Edit .env - Ganti SERIAL_PORT dengan port ESP32-4 Anda
# Windows: COM3, COM4, COM8, dll
# Linux/Mac: /dev/ttyUSB0, /dev/tty.usbserial-0001, dll

npm run dev
```

#### 3️⃣ Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

#### 4️⃣ Open Browser
```
http://localhost:5173
```

🎉 **Done!** Dashboard harusnya sudah menampilkan data real-time dari ESP32!

---

## 📚 Dokumentasi Lengkap

| Dokumen | Deskripsi |
|---------|-----------|
| [**QUICK_START.md**](QUICK_START.md) | 🚀 **START HERE!** Panduan deploy ESP32-4 web server |
| [**PROJECT_STATUS_SUMMARY.md**](PROJECT_STATUS_SUMMARY.md) | 📊 Status proyek lengkap & bugs fixed |
| [**BUG_REPORT_DAN_FIX.md**](BUG_REPORT_DAN_FIX.md) | 🐛 Bug hardcoded IP & solusinya |
| [**PANDUAN_UPLOAD_ESP32-4.md**](PANDUAN_UPLOAD_ESP32-4.md) | 📖 Upload detail step-by-step |
| [**TROUBLESHOOT_ESP32-4_UPLOAD.md**](TROUBLESHOOT_ESP32-4_UPLOAD.md) | 🔧 Solusi error umum saat upload |
| [**CARA_SETUP_IOT.md**](CARA_SETUP_IOT.md) | 📖 Setup mode development (Node.js) |
| [**ARSITEKTUR_SISTEM.md**](ARSITEKTUR_SISTEM.md) | 🏗️ Diagram dan alur komunikasi sistem |
| [**backend/README.md**](backend/README.md) | 🔧 Backend API documentation |
| [**frontend/README.md**](frontend/README.md) | 🎨 Frontend documentation |

**Rekomendasi urutan baca:**
1. **QUICK_START.md** - 🚀 **BACA INI DULU!** Deploy ESP32-4 web server (MODE PRODUCTION)
2. **PROJECT_STATUS_SUMMARY.md** - Status lengkap & bugs yang sudah diperbaiki
3. **BUG_REPORT_DAN_FIX.md** - Penjelasan bug hardcoded IP & solusinya
4. **CARA_SETUP_IOT.md** - Untuk mode development (Vite + Node.js)
5. **ARSITEKTUR_SISTEM.md** - Untuk memahami cara kerja sistem

---

## 📋 Requirements

### Hardware
- 4x ESP32 Dev Board
- 1x LCD I2C 20x4
- 1x Gas Sensor (MQ-2)
- 1x Rain Sensor
- 2x IR Sensor (door & gate)
- 1x RFID RC522 Module
- 1x Relay Module (lamp)
- 4x Servo Motor (feeder, clothesline, door, gate)
- LED indicator & buzzer
- Jumper wires & breadboard
- Power supply 5V

### Software
- Arduino IDE dengan ESP32 board support
- Node.js v18 atau lebih tinggi
- npm atau yarn
- PostgreSQL (optional, bisa pakai Supabase)
- Chrome/Firefox browser

---

## 🎯 Cara Kerja

### 📥 Data Flow: ESP → Website
```
1. Sensor baca data (Gas, Rain, Door, dll)
2. ESP1/2/3 kirim ke ESP32-4 via UART
3. ESP32-4 forward ke Backend via USB Serial
4. Backend parse & save to database
5. Backend broadcast via WebSocket
6. Frontend update UI real-time
```

### 📤 Command Flow: Website → ESP
```
1. User click button di website
2. Frontend kirim HTTP POST ke backend
3. Backend kirim command via USB Serial
4. ESP32-4 terima & forward ke ESP target
5. ESP eksekusi command (nyalakan lampu, dll)
6. ESP kirim konfirmasi balik ke website
```

### 📡 Format Protokol

**Dari ESP:**
```
ESP1:STATUS:OK,GAS=1200,LAMP=OFF,WIFI=NO
ESP1:GAS:1200
ESP2:RAIN:1800
ESP3:RFID:A1B2C3D4
ESP3:DOOR:OPEN
```

**Ke ESP:**
```
ESP1:LAMP:ON
ESP1:LAMP:OFF
ESP1:FEED
ESP2:CLOTHESLINE:IN
ESP3:DOOR:OPEN
ESP3:GATE:CLOSE
WIFI:SSID,PASSWORD
```

---

## 🔧 Development

### Backend Development
```bash
cd backend

# Development mode dengan auto-reload
npm run dev

# Run tests
npm test

# Test serial connection
node test-serial-connection.js

# Mock mode (tanpa hardware)
# Edit .env: USE_MOCK_SERIAL=true
npm run dev
```

### Frontend Development
```bash
cd frontend

# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### ESP32 Development
```bash
# Buka Serial Monitor Arduino IDE
# Baudrate: 115200 untuk ESP32-4
# Baudrate: 9600 untuk UART antar ESP32

# Test command manual via Serial Monitor:
ESP1:LAMP:ON
ESP2:CLOTHESLINE:IN
ESP3:DOOR:OPEN
```

---

## 🧪 Testing

### Hardware Testing
```bash
# Test ESP32-4 menerima data dari ESP lain
# Buka Serial Monitor ESP32-4
# Expected: ESP1:STATUS:..., ESP2:STATUS:..., ESP3:STATUS:...

# Test LCD ESP32-4
# LCD harusnya tampil status semua ESP
```

### Backend Testing
```bash
cd backend

# Test serial connection
node test-serial-connection.js

# Test database connection
node test-db-connection.js

# Test API endpoints
npm test

# Test health check
curl http://localhost:3001/health
```

### Integration Testing
```bash
# Test command from backend to ESP
curl -X POST http://localhost:3001/api/command \
  -H "Content-Type: application/json" \
  -d '{"espNumber": 1, "command": "LAMP:ON"}'

# Test WebSocket connection
# Buka Browser Console di http://localhost:5173
# Expected: WebSocket connected, data streaming
```

---

## 🐛 Troubleshooting

### ❌ Backend tidak connect ke serial port
**Solusi:**
1. Tutup Arduino IDE Serial Monitor
2. Cek port COM di Device Manager (Windows)
3. Edit `.env` → `SERIAL_PORT=COM3` (sesuaikan)
4. Cabut-colok ESP32-4
5. Restart backend

### ❌ Data tidak muncul di website
**Solusi:**
1. Cek wiring UART ESP1/2/3 → ESP4
2. Buka Serial Monitor ESP32-4, lihat data?
3. Cek backend console, ada log data?
4. Cek browser console (F12), ada error?
5. Restart semua ESP32

### ❌ Command tidak sampai ke ESP
**Solusi:**
1. ESP32-4 sudah upload kode baru? (ada `handleUSBCommands()`)
2. Backend log ada "Command sent"?
3. Test manual: ketik `ESP1:LAMP:ON` di Serial Monitor
4. Cek baudrate 115200 di Serial Monitor

### ❌ ESP32 sering restart
**Solusi:**
1. Gunakan power supply yang stabil (5V/2A)
2. Jangan pakai USB hub murahan
3. Tambah kapasitor 100uF di power line
4. Cek wiring, pastikan GND semua ESP tersambung

Lihat [**TEST_CHECKLIST.md**](TEST_CHECKLIST.md) untuk troubleshooting lengkap.

---

## 📊 Tech Stack

### Hardware
- ESP32 (4 units)
- MQ-2 Gas Sensor
- Rain Sensor
- RFID RC522
- IR Sensors
- Servo Motors
- Relay Module
- LCD I2C 20x4

### Firmware
- Arduino C++
- ESP32 Arduino Core
- ESP32Servo Library
- MFRC522 Library
- LiquidCrystal I2C

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- Socket.IO
- SerialPort

### Frontend
- React 18
- TypeScript
- Vite
- Socket.IO Client
- Recharts
- TailwindCSS

---

## 🔐 Security

- ⚠️ **Local network only** - Tidak ada authentication
- ✅ CORS restricted to frontend origin
- ✅ SQL injection safe (Prisma ORM)
- ✅ RFID whitelist authorization
- ⚠️ WiFi credentials hardcoded (sementara)

**Production:** Tambahkan JWT authentication sebelum deploy ke internet!

---

## 📈 Future Enhancements

- [ ] Authentication & Authorization (JWT)
- [ ] Mobile app (React Native)
- [ ] Cloud deployment (AWS/Azure)
- [ ] Machine learning untuk prediksi
- [ ] Email/SMS notifications
- [ ] Voice control (Alexa/Google Home)
- [ ] Energy monitoring
- [ ] Multi-user dengan roles
- [ ] Scheduling & automation rules
- [ ] Historical data analytics & reports

---

## 👥 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 📞 Support

Jika ada pertanyaan atau butuh bantuan:
1. Baca dokumentasi lengkap di folder project
2. Check [Issues](../../issues) untuk masalah umum
3. Buat [New Issue](../../issues/new) jika menemukan bug

---

## 🙏 Acknowledgments

- ESP32 Community
- Node.js Community
- React Community
- Prisma Team
- Socket.IO Team

---

## 📸 Screenshots

> **Note:** Tambahkan screenshot website dan hardware setup Anda di sini

### Dashboard
![Dashboard](docs/images/dashboard.png)

### Device Control
![Device Control](docs/images/device-control.png)

### Sensor Chart
![Sensor Chart](docs/images/sensor-chart.png)

### Hardware Setup
![Hardware](docs/images/hardware-setup.jpg)

---

**⭐ Star this repo if you find it helpful!**

**Made with ❤️ by Kiro AI Assistant**

---

## 🗂️ Project Structure

```
IOT-NEW-PAKYU/
├── backend/                    # Node.js Backend
│   ├── src/
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   │   ├── serialService.js      # Serial communication
│   │   │   ├── socketService.js      # WebSocket
│   │   │   ├── commandService.js     # Command handler
│   │   │   └── autoModeService.js    # Automation
│   │   ├── app.js             # Main app
│   │   └── db.js              # Database connection
│   ├── prisma/                # Database schema
│   ├── tests/                 # Unit tests
│   ├── .env                   # Configuration (dibuat)
│   └── package.json
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API services
│   │   └── App.tsx            # Main app
│   └── package.json
│
├── code iot/                   # ESP32 Firmware
│   ├── esp32-1.ino            # Lamp, Gas, Feeder
│   ├── esp32-2.ino            # Clothesline, Rain
│   ├── esp32-3.ino            # Door, Gate, RFID
│   └── esp32-4.ino            # Gateway + LCD
│
├── QUICK_START.md             # 🚀 Quick setup guide
├── CARA_SETUP_IOT.md          # 📖 Detailed setup
├── ARSITEKTUR_SISTEM.md       # 🏗️ Architecture diagram
├── TEST_CHECKLIST.md          # ✅ Testing checklist
└── README.md                  # 📄 This file
```

---

**Last Updated:** 2024  
**Version:** 1.0.0
