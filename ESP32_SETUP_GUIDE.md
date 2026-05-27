# 🔌 Panduan Setup ESP32 Real-Time

## ✅ Mock Mode Sudah Dimatikan

Backend sekarang dikonfigurasi untuk **REAL MODE** - siap menerima data dari ESP32!

---

## 📋 Persiapan Hardware

### Yang Dibutuhkan:
1. **ESP32 Board** x4 (atau minimal 1 untuk testing)
2. **Kabel USB** untuk programming & serial communication
3. **Sensor & Actuator:**
   - ESP32 #1: Gas sensor (MQ-2/MQ-135), Relay lamp, Servo feeder
   - ESP32 #2: Rain sensor, Servo clothesline
   - ESP32 #3: Servo door, Servo gate, RFID reader (RC522)
   - ESP32 #4: Master controller (USB ke komputer)

---

## 🔧 Langkah Setup

### 1️⃣ Cek Serial Port ESP32

#### Windows:
1. Colok ESP32 ke USB
2. Buka **Device Manager**
3. Expand **Ports (COM & LPT)**
4. Lihat port ESP32 (contoh: **COM3**, **COM4**, dll)

#### Update Port di .env:

Edit `backend/.env`:
```env
SERIAL_PORT=COM3  # ← Ganti dengan port ESP32 Anda
```

### 2️⃣ Upload Code ke ESP32

#### Install Arduino IDE:
1. Download: https://www.arduino.cc/en/software
2. Install ESP32 board support:
   - File → Preferences
   - Additional Board Manager URLs:
     ```
     https://dl.espressif.com/dl/package_esp32_index.json
     ```
   - Tools → Board → Boards Manager
   - Search "ESP32" → Install

#### Upload Code:

**ESP32 #1 (Lamp, Gas, Feeder):**
```
File: code iot/esp32-1.ino
Board: ESP32 Dev Module
Port: COM3 (sesuai device manager)
```

**ESP32 #2 (Clothesline, Rain):**
```
File: code iot/esp32-2.ino
```

**ESP32 #3 (Door, Gate, RFID):**
```
File: code iot/esp32-3.ino
```

**ESP32 #4 (Master Controller):**
```
File: code iot/esp32-4.ino
```

### 3️⃣ Konfigurasi Serial Communication

#### Format Pesan dari ESP32 ke Backend:

**Status Update:**
```
ESP1:STATUS:GAS=1234,LAMP=ON,WIFI=OK
ESP2:STATUS:RAIN=567,CLOTHESLINE=OUT
ESP3:STATUS:DOOR=OPEN,GATE=CLOSE
```

**Sensor Data:**
```
ESP1:GAS:1234
ESP2:RAIN:567
```

**Event:**
```
ESP1:LAMP:ON
ESP2:CLOTHESLINE:IN
ESP3:DOOR:OPEN
ESP3:RFID:ABC123DEF
```

#### Format Command dari Backend ke ESP32:

```
LAMP:ON
LAMP:OFF
FEED
CLOTHESLINE:IN
CLOTHESLINE:OUT
DOOR:OPEN
DOOR:CLOSE
GATE:OPEN
GATE:CLOSE
WIFI:SSID,PASSWORD
```

### 4️⃣ Test Koneksi

#### Start Backend:
```bash
cd backend
npm run dev
```

**Output yang diharapkan:**
```
📡 Serial Service: Connecting to COM3...
✓ Serial port connected: COM3
✓ Waiting for data from ESP32...
```

**Jika ESP32 kirim data:**
```
📥 Received: ESP1:GAS:1234
✓ Parsed: { espNumber: 1, type: 'GAS', message: '1234' }
✓ Saved to database
✓ Broadcasted to clients
```

#### Start Frontend:
```bash
cd frontend
npm run dev
```

Buka: http://localhost:5173

**Cek:**
- ✅ Device cards show "Online" (hijau)
- ✅ Sensor values update real-time
- ✅ Charts bergerak sesuai data sensor
- ✅ Commands berfungsi (lamp, door, gate, dll)

---

## 🧪 Testing Step-by-Step

### Test 1: Serial Connection
```bash
# Di backend terminal, lihat log:
✓ Serial port connected: COM3
```

### Test 2: Receive Data
```bash
# ESP32 kirim data, backend log:
📥 Received: ESP1:GAS:1234
✓ Parsed and saved
```

### Test 3: Frontend Update
- Buka Dashboard
- Lihat device card ESP32 #1 → Status: **Online** (hijau)
- Lihat gas sensor value update

### Test 4: Send Command
- Klik button "Turn ON" di ESP1 page
- Backend log:
  ```
  📤 Sending command: LAMP:ON
  ✓ Command sent to serial port
  ```
- ESP32 terima command dan execute
- ESP32 kirim response: `ESP1:LAMP:ON`
- Frontend update: Lamp status → **ON**

---

## 🔍 Troubleshooting

### Error: "Cannot open serial port"

**Penyebab:** Port salah atau sudah dipakai

**Solusi:**
1. Cek port di Device Manager
2. Update `SERIAL_PORT` di `.env`
3. Close aplikasi lain yang pakai serial (Arduino IDE Serial Monitor, dll)
4. Restart backend

### Error: "Serial port not found"

**Penyebab:** ESP32 tidak terdeteksi

**Solusi:**
1. Install driver CH340/CP2102 (tergantung ESP32 board)
2. Coba kabel USB lain
3. Coba port USB lain
4. Restart komputer

### Data tidak muncul di frontend

**Penyebab:** Format pesan salah

**Solusi:**
1. Cek format pesan dari ESP32 (lihat backend log)
2. Pastikan format: `ESPx:TYPE:MESSAGE`
3. Contoh benar: `ESP1:GAS:1234`
4. Contoh salah: `Gas:1234` atau `ESP1-GAS-1234`

### Command tidak sampai ke ESP32

**Penyebab:** ESP32 tidak listen serial

**Solusi:**
1. Cek code ESP32 ada `Serial.available()` dan `Serial.read()`
2. Cek baudrate sama (9600)
3. Test manual dengan Arduino IDE Serial Monitor

---

## 📊 Monitoring

### Backend Log:
```bash
# Lihat semua komunikasi serial
cd backend
npm run dev

# Log yang muncul:
📥 Received: ESP1:GAS:1234
📤 Sending: LAMP:ON
✓ Database saved
✓ Broadcasted to 3 clients
```

### Frontend:
- Dashboard → System Logs (real-time)
- Device pages → Device log history
- Charts → Real-time sensor data

### Neon Database:
- https://console.neon.tech
- Tables → DeviceLog, SensorHistory
- Lihat semua data tersimpan

---

## 🎯 Checklist Setup

- [ ] ESP32 tercolok ke USB
- [ ] Driver ESP32 terinstall
- [ ] Port ESP32 terdeteksi di Device Manager
- [ ] `SERIAL_PORT` di `.env` sudah benar
- [ ] Code Arduino sudah diupload ke ESP32
- [ ] Backend running tanpa error
- [ ] Frontend running
- [ ] Device status "Online" di dashboard
- [ ] Sensor data muncul real-time
- [ ] Commands berfungsi (lamp, door, gate)
- [ ] Data tersimpan di database Neon

---

## 🚀 Production Tips

### 1. Multiple ESP32:
- ESP32 #4 sebagai master (USB ke komputer)
- ESP32 #1, #2, #3 communicate via WiFi/Serial ke ESP32 #4
- ESP32 #4 forward semua data ke backend

### 2. WiFi Mode:
- Alternatif: ESP32 connect langsung ke WiFi
- Kirim data via HTTP/WebSocket ke backend
- Tidak perlu serial cable

### 3. Reliability:
- Add reconnection logic di ESP32
- Add heartbeat (ping setiap 5 detik)
- Backend detect offline jika tidak ada data > 7 detik

### 4. Error Handling:
- ESP32 validate command sebelum execute
- Send acknowledgment setelah execute
- Backend retry jika tidak ada ack

---

## 📞 Support

### Arduino ESP32 Docs:
- https://docs.espressif.com/projects/arduino-esp32/

### Serial Communication:
- https://www.arduino.cc/reference/en/language/functions/communication/serial/

### Troubleshooting:
- Lihat `SUPABASE_TROUBLESHOOTING.md` untuk network issues
- Lihat backend logs untuk serial issues

---

## ✅ Status Saat Ini

- ✅ Mock mode: **DISABLED**
- ✅ Real mode: **ENABLED**
- ✅ Serial port: **COM3** (configurable)
- ✅ Database: **Connected** (Neon)
- ✅ Backend: **Ready** untuk ESP32
- ✅ Frontend: **Ready** untuk real-time data

**Tinggal colok ESP32 dan upload code!** 🚀
