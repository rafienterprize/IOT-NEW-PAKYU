# ✅ Checklist Testing Koneksi IoT

## 📋 Pre-Test Checklist

### Hardware
- [ ] ESP32 #1, #2, #3, #4 sudah diupload dengan kode terbaru
- [ ] Semua ESP32 terhubung dengan power supply yang stabil (5V)
- [ ] Wiring UART antar ESP32 sudah benar (TX-RX, RX-TX, GND-GND)
- [ ] ESP32 #4 terhubung ke komputer via USB
- [ ] LCD I2C sudah terhubung ke ESP32 #4 (SDA=GPIO27, SCL=GPIO33)

### Software
- [ ] Node.js terinstall (cek: `node --version`)
- [ ] npm terinstall (cek: `npm --version`)
- [ ] Backend dependencies terinstall (`cd backend && npm install`)
- [ ] Frontend dependencies terinstall (`cd frontend && npm install`)
- [ ] File `.env` sudah dibuat di folder `backend/`
- [ ] Port COM ESP32-4 sudah dicek dan diset di `.env`

---

## 🧪 Step-by-Step Testing

### Test 1: ESP32-4 Hardware ✅
**Goal:** Pastikan ESP32-4 menerima data dari ESP32 lainnya

1. Upload kode baru ke ESP32-4
2. Buka Serial Monitor Arduino IDE
3. Set baudrate: **115200**
4. Lihat di LCD ESP32-4, harusnya muncul:
   ```
   ESP1: STATUS...
   ESP2: STATUS...
   ESP3: STATUS...
   System Ready
   ```

**Expected Output di Serial Monitor:**
```
ESP32-4 Controller READY
Kirim WiFi ke ESP1 -> WIFI:NAMA_WIFI_KAMU,PASSWORD_WIFI_KAMU
Kirim WiFi ke ESP2 -> WIFI:NAMA_WIFI_KAMU,PASSWORD_WIFI_KAMU
Kirim WiFi ke ESP3 -> WIFI:NAMA_WIFI_KAMU,PASSWORD_WIFI_KAMU
ESP1:STATUS:OK,GAS=1200,LAMP=OFF,WIFI=NO
ESP2:STATUS:OK,RAIN=800,CLOTHESLINE=OUT,WIFI=NO
ESP3:STATUS:OK,DOOR=CLOSE,GATE=CLOSE,WIFI=NO
```

✅ **Pass jika:** Data dari ESP1/2/3 muncul di Serial Monitor
❌ **Fail jika:** Tidak ada data → Cek wiring UART

---

### Test 2: Serial Port Detection ✅
**Goal:** Pastikan komputer mendeteksi ESP32-4

**Windows:**
```cmd
# Buka Device Manager
# Cari "Ports (COM & LPT)"
# Harusnya ada: Silicon Labs CP210x USB to UART Bridge (COMx)
```

**Linux/Mac:**
```bash
ls /dev/tty.*
# atau
ls /dev/ttyUSB*
```

✅ **Pass jika:** Port muncul (misal COM3, /dev/ttyUSB0)
❌ **Fail jika:** Port tidak muncul → Install driver CH340/CP210x

---

### Test 3: Backend Serial Connection ✅
**Goal:** Test koneksi serial dari backend

1. Pastikan Serial Monitor Arduino IDE **DITUTUP** (port conflict!)
2. Jalankan test script:
```bash
cd backend
node test-serial-connection.js
```

**Expected Output:**
```
🔍 Testing Serial Connection to ESP32-4...
📍 Port: COM3
⚡ Baudrate: 115200

📋 Available Serial Ports:
   1. COM3
      Manufacturer: Silicon Labs

🔌 Attempting to connect to COM3...
✅ Serial port opened successfully!
📡 Listening for data from ESP32-4...

Expected format: ESPx:TYPE:MESSAGE
Example: ESP1:STATUS:OK,GAS=1200,LAMP=OFF

Press Ctrl+C to exit
─────────────────────────────────────────

[14:30:25] #1 ESP1:STATUS:OK,GAS=1200,LAMP=OFF,WIFI=NO
   ├─ Device: ESP1
   ├─ Type: STATUS
   └─ Message: OK,GAS=1200,LAMP=OFF,WIFI=NO
```

✅ **Pass jika:** Data ESP1/2/3 muncul setiap 3 detik
❌ **Fail jika:** Error "Cannot open COM3" → Tutup Serial Monitor

---

### Test 4: Backend Startup ✅
**Goal:** Jalankan backend dengan koneksi serial

1. Tutup test script (Ctrl+C)
2. Cek file `.env`:
```bash
cd backend
cat .env  # Linux/Mac
type .env  # Windows
```

Pastikan:
```env
SERIAL_PORT=COM3  # ← Port yang benar
SERIAL_BAUDRATE=115200
USE_MOCK_SERIAL=false  # ← Harus false!
```

3. Jalankan backend:
```bash
npm run dev
```

**Expected Output:**
```
🚀 Starting IoT Smart Home Backend...
✓ Database connected (atau warning jika skip DB)
✓ Serial port opened: COM3 @ 115200 baud
✓ Server running on http://localhost:3001
✓ Socket.IO ready
✓ CORS enabled for http://localhost:5173
```

✅ **Pass jika:** Semua ✓ muncul tanpa error
❌ **Fail jika:** Error serial port → Cek `.env`

---

### Test 5: Backend Health Check ✅
**Goal:** Verifikasi backend API berjalan

1. Backend tetap jalan
2. Buka browser atau gunakan curl:
```bash
# Browser:
http://localhost:3001/health

# Atau curl:
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "services": {
    "database": "connected",
    "serial": {
      "isConnected": true,
      "port": "COM3",
      "baudRate": 115200,
      "useMock": false,
      "reconnectAttempts": 0
    },
    "socket": {
      "connected": 0
    }
  }
}
```

✅ **Pass jika:** `"isConnected": true`
❌ **Fail jika:** `"isConnected": false`

---

### Test 6: Backend Logs Real-time ✅
**Goal:** Pastikan backend menerima data dari ESP32

Lihat console backend, harusnya muncul log seperti:
```
POST /api/status
📡 Serial data received: ESP1:STATUS:OK,GAS=1200,LAMP=OFF
📡 Serial data received: ESP2:STATUS:OK,RAIN=800,CLOTHESLINE=OUT
📡 Serial data received: ESP3:STATUS:OK,DOOR=CLOSE,GATE=CLOSE
```

✅ **Pass jika:** Log muncul setiap 3 detik
❌ **Fail jika:** Tidak ada log → ESP32-4 belum kirim data

---

### Test 7: Send Command dari Backend ✅
**Goal:** Test kirim command dari backend ke ESP32

1. Gunakan curl atau Postman:
```bash
# Nyalakan lampu ESP1
curl -X POST http://localhost:3001/api/command \
  -H "Content-Type: application/json" \
  -d '{"espNumber": 1, "command": "LAMP:ON"}'
```

2. Lihat:
   - **Backend console:** Harusnya ada log `📤 Command sent: ESP1:LAMP:ON`
   - **ESP32-4 LCD:** Harusnya ada `CMD->ESP1: LAMP:ON`
   - **ESP32 #1:** Lampu harusnya nyala (relay ON)

✅ **Pass jika:** Lampu nyala dan LCD update
❌ **Fail jika:** Command tidak sampai → ESP32-4 belum di-upload kode baru

---

### Test 8: Frontend Connection ✅
**Goal:** Website bisa connect ke backend

1. Jalankan frontend (terminal baru):
```bash
cd frontend
npm run dev
```

2. Buka browser: `http://localhost:5173`

3. Buka **Browser Console** (F12):
```
WebSocket connected
Received device status: {espNumber: 1, isOnline: true, ...}
```

✅ **Pass jika:** Data device muncul di dashboard
❌ **Fail jika:** WebSocket error → Cek backend

---

### Test 9: Full Integration ✅
**Goal:** Test semua fitur end-to-end

| Test | Action | Expected Result |
|------|--------|----------------|
| **Lampu** | Click toggle lampu di website | Lampu ESP1 nyala/mati |
| **Sensor Gas** | Dekatkan gas ke sensor | Alert muncul di website |
| **Rain Sensor** | Siram air ke sensor | Jemuran otomatis masuk |
| **RFID** | Tap kartu RFID | Pintu terbuka, log muncul |
| **Door Manual** | Click buka pintu | Servo door bergerak |
| **Gate Manual** | Click buka gerbang | Servo gate bergerak |
| **Fish Feeder** | Click beri makan | Servo feeder berputar |

✅ **Pass jika:** Semua device respond
❌ **Fail jika:** Ada yang tidak jalan → Debug per device

---

## 🐛 Common Issues & Solutions

### Issue 1: "Error: Cannot open COM3"
**Solusi:**
- Tutup Arduino IDE Serial Monitor
- Cek Device Manager, pastikan port benar
- Coba cabut-colok ESP32-4
- Ganti USB cable atau port

### Issue 2: Data tidak muncul di backend
**Solusi:**
- Buka Serial Monitor Arduino IDE di ESP32-4
- Cek apakah data ESP1/2/3 muncul
- Jika ya → Problem di backend (cek baudrate)
- Jika tidak → Problem di wiring UART

### Issue 3: Command tidak sampai ke ESP
**Solusi:**
- Pastikan ESP32-4 sudah upload kode terbaru
- Cek ada fungsi `handleUSBCommands()` di kode
- Test manual via Serial Monitor: ketik `ESP1:LAMP:ON`
- Cek baudrate 115200 di Serial Monitor

### Issue 4: Website tidak connect
**Solusi:**
- Cek backend running di port 3001
- Cek CORS setting di backend `.env`
- Clear browser cache
- Coba browser lain (Chrome/Firefox)

### Issue 5: ESP32 sering restart/offline
**Solusi:**
- Cek power supply (harus stabil 5V/2A minimum)
- Jangan pakai USB hub murahan
- Gunakan adapter power terpisah untuk ESP32
- Tambahkan kapasitor 100uF di power line

---

## 📊 Success Criteria

✅ **System OK jika:**
1. ESP32-4 menerima data dari ESP1/2/3
2. Backend menerima data via serial
3. Website menampilkan data real-time
4. Command dari website sampai ke device
5. Alert muncul saat threshold terlewati
6. Semua device respond <1 detik

---

## 📝 Notes

- Baudrate USB Serial ESP32-4: **115200**
- Baudrate UART antar ESP32: **9600**
- Format data: `ESPx:TYPE:MESSAGE` (strict!)
- Jangan buka Serial Monitor saat backend running
- Gunakan USB cable berkualitas (data + power)

---

**Last Updated:** 2024
**Created by:** Kiro AI Assistant
