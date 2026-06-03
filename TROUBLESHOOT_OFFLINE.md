# 🔴 Troubleshooting: Semua ESP32 Offline

## 🔍 Diagnosis Masalah

Jika semua ESP32 menunjukkan status **"OFFLINE"** di website padahal backend sudah berjalan, ini berarti **ESP32 tidak mengirim data ke backend**.

---

## ✅ Langkah Cepat (5 Menit)

### **1. Cek Apakah ESP32-4 Terhubung**

```cmd
cd backend
node test-serial-connection.js
```

**Expected output:**
```
✅ Serial port opened successfully!
📡 Listening for data from ESP32-4...
```

**Jika muncul error "File not found":**
- ESP32-4 tidak terhubung ke komputer
- Port COM salah

---

### **2. Cek Port COM yang Tersedia**

**Windows:**
```powershell
Get-WmiObject Win32_SerialPort | Select-Object DeviceID, Description
```

**Atau buka Device Manager:**
- Tekan `Win + X`
- Pilih "Device Manager"
- Expand "Ports (COM & LPT)"
- Cari "USB-SERIAL CH340" atau "CP210x"
- Catat nomor COM (misal: COM8)

**Update .env:**
```env
SERIAL_PORT=COM8
```

---

### **3. Upload Kode ke ESP32-4**

**Penyebab paling umum: Kode belum di-upload!**

1. Buka Arduino IDE
2. Buka file: `code iot/esp32-4.ino`
3. Pilih board: **ESP32 Dev Module**
4. Pilih port: **COM8** (sesuaikan)
5. Klik **Upload** (tombol →)
6. Tunggu sampai selesai

**Setelah upload:**
- Buka Serial Monitor (Ctrl+Shift+M)
- Set baud rate: **115200**
- Anda akan melihat:
  ```
  ========================================
  ESP32-4 Gateway Controller
  ========================================
  [READY] Gateway is ready!
  ```

**Data test otomatis setiap 3 detik:**
```
ESP1:STATUS:OK,GAS=1200,LAMP=OFF,WIFI=OK
ESP2:STATUS:OK,RAIN=850,CLOTHESLINE=OUT,WIFI=OK
ESP3:STATUS:OK,DOOR=CLOSE,GATE=CLOSE,WIFI=OK
ESP4:STATUS:OK
```

Jika data ini muncul, berarti ESP32 bekerja dengan baik!

---

### **4. Restart Backend**

```cmd
cd backend

# Stop backend yang sedang berjalan (Ctrl+C)
# Lalu start lagi:
npm start
```

**Atau gunakan script:**
```cmd
cd backend
restart-backend.bat
```

---

### **5. Cek Health Endpoint**

Buka browser:
```
http://localhost:3001/health
```

**Expected:**
```json
{
  "status": "ok",
  "services": {
    "database": "connected",
    "serial": {
      "isConnected": true,
      "port": "COM8"
    }
  }
}
```

**Jika `"isConnected": false`:**
- ESP32 belum terhubung
- Kembali ke langkah 1

---

### **6. Cek Device Status API**

```
http://localhost:3001/api/status
```

**Expected: Semua device `isOnline: true`**
```json
{
  "success": true,
  "data": [
    {
      "espNumber": 1,
      "isOnline": true,
      "lastSeenAt": "2026-06-03T10:30:00.000Z",
      ...
    }
  ]
}
```

---

### **7. Refresh Website**

Buka:
```
http://localhost:5173
```

**Semua ESP32 seharusnya menunjukkan:**
- ✅ Status: **Connected** (hijau)
- ✅ Tidak ada alert offline
- ✅ Data sensor update real-time

---

## 🔧 Troubleshooting Lanjutan

### ❌ Error: "Access Denied" atau "Port in Use"

**Penyebab:**
- Arduino Serial Monitor masih terbuka
- Backend lama masih running

**Solusi:**
```cmd
# 1. Tutup Arduino Serial Monitor

# 2. Kill semua proses node
taskkill /F /IM node.exe

# 3. Restart backend
cd backend
npm start
```

---

### ❌ ESP32 Upload Gagal

**Error: "Failed to connect to ESP32"**

**Solusi:**
1. Tekan dan tahan tombol **BOOT** di ESP32
2. Klik **Upload** di Arduino IDE
3. Tunggu sampai muncul "Connecting..."
4. Lepas tombol **BOOT**

**Atau:**
- Coba kabel USB lain (pastikan kabel data, bukan charging only)
- Coba port USB lain di komputer
- Install driver CH340: http://www.wch-ic.com/downloads/CH341SER_EXE.html

---

### ❌ Data Muncul di Serial Monitor tapi Tidak di Website

**Penyebab:**
- Backend tidak menerima data
- Socket.IO tidak terhubung

**Solusi:**

**1. Cek Backend Console**
```
Backend harusnya menampilkan:
ESP1:GAS:1200
ESP2:RAIN:850
```

Jika tidak ada, restart backend.

**2. Cek Browser Console (F12)**
```javascript
// Expected:
Socket connected
device:status {espNumber: 1, isOnline: true}
```

Jika "Socket disconnected", cek:
- Backend running?
- Port 3001 terbuka?
- CORS issue? (cek backend console)

**3. Hard Refresh Frontend**
- Chrome: Ctrl+Shift+R
- Firefox: Ctrl+F5

---

### ❌ Hanya Beberapa ESP Offline

**ESP1/2/3 offline, tapi ESP4 online:**

**Penyebab:**
- ESP1/2/3 belum terhubung ke ESP4 via UART
- Wiring UART salah

**Solusi:**
1. **Gunakan TEST MODE di ESP32-4** (sudah aktif by default)
   - Test mode akan mensimulasikan data dari ESP1/2/3
   - Jadi Anda tidak perlu hardware ESP1/2/3 untuk testing

2. **Jika ingin pakai hardware asli:**
   - Cek wiring UART:
     ```
     ESP1 TX (GPIO 17) → ESP4 RX (GPIO 16)
     ESP1 RX (GPIO 16) → ESP4 TX (GPIO 17)
     
     ESP2 TX → ESP4 RX (GPIO 4)
     ESP2 RX → ESP4 TX (GPIO 5)
     
     ESP3 TX → ESP4 RX (GPIO 2)
     ESP3 RX → ESP4 TX (GPIO 18)
     ```
   - **PENTING:** GND semua ESP32 harus terhubung!

3. **Upload kode ke ESP1/2/3**
   - Buka `code iot/esp32-1.ino` dan upload ke ESP32 #1
   - Buka `code iot/esp32-2.ino` dan upload ke ESP32 #2
   - Buka `code iot/esp32-3.ino` dan upload ke ESP32 #3

---

## 📊 Diagram Alur Koneksi

```
┌─────────────────────────────────────────────┐
│  1. ESP32-4 Upload Code                     │
│     ✓ TEST MODE aktif (simulasi data)      │
│     ✓ Serial 115200 baud ke USB            │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│  2. Backend Baca Data dari COM8             │
│     ✓ Serial port connected                 │
│     ✓ Parse data format ESP:TYPE:MSG        │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│  3. Backend Save ke Database                │
│     ✓ Update device status (isOnline)       │
│     ✓ Save sensor history                   │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│  4. Backend Broadcast via Socket.IO         │
│     ✓ Emit device:status                    │
│     ✓ Emit sensor:data                      │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│  5. Frontend Terima Update                  │
│     ✓ Update UI real-time                   │
│     ✓ Device status: ONLINE                 │
│     ✓ Clear OFFLINE alerts                  │
└─────────────────────────────────────────────┘
```

---

## ✅ Checklist Debugging

Gunakan checklist ini untuk memastikan semuanya sudah benar:

- [ ] **Hardware**
  - [ ] ESP32-4 terhubung ke USB komputer
  - [ ] Kabel USB berfungsi (data, bukan charging only)
  - [ ] LED power ESP32 menyala

- [ ] **Driver & Port**
  - [ ] Driver CH340/CP2102 terinstall
  - [ ] Port COM terdeteksi di Device Manager
  - [ ] Port COM benar di .env (SERIAL_PORT=COM8)

- [ ] **Arduino Code**
  - [ ] Kode esp32-4.ino sudah di-upload
  - [ ] Upload sukses (tidak ada error)
  - [ ] Serial Monitor menampilkan data test
  - [ ] TEST_MODE = true (baris 62 di kode)

- [ ] **Backend**
  - [ ] npm install sudah dijalankan
  - [ ] .env file sudah dibuat dan dikonfigurasi
  - [ ] Backend running (npm start)
  - [ ] Tidak ada error di console
  - [ ] Health endpoint: serial connected
  - [ ] Backend console menampilkan data ESP

- [ ] **Frontend**
  - [ ] npm install sudah dijalankan
  - [ ] Frontend running (npm run dev)
  - [ ] Browser console: Socket connected
  - [ ] Tidak ada error di console

- [ ] **Connection**
  - [ ] http://localhost:3001/health → serial connected
  - [ ] http://localhost:3001/api/status → isOnline: true
  - [ ] http://localhost:5173 → devices green/online
  - [ ] Tidak ada alert offline

---

## 🆘 Masih Bermasalah?

Jika setelah mengikuti semua langkah di atas masih belum berhasil:

### **Collect Debug Information**

```cmd
# 1. Test serial
cd backend
node test-serial-connection.js > debug-serial.txt

# 2. Test health
curl http://localhost:3001/health > debug-health.txt

# 3. Test status
curl http://localhost:3001/api/status > debug-status.txt
```

### **Cek Log File**

1. **Arduino Serial Monitor output** (115200 baud)
2. **Backend console log**
3. **Browser console log** (F12)

### **Common Patterns**

| Symptom | Cause | Solution |
|---------|-------|----------|
| Serial port not found | ESP32 tidak terhubung | Colok USB, install driver |
| Access denied | Port digunakan aplikasi lain | Tutup Serial Monitor |
| Port opened but no data | Kode belum di-upload | Upload esp32-4.ino |
| Backend tidak log data | Serial baud salah | Cek 115200 di .env |
| Frontend offline | Socket.IO issue | Restart backend & frontend |
| Some devices offline | UART wiring | Gunakan TEST MODE |

---

## 📞 Bantuan Lebih Lanjut

**File yang perlu dibagikan untuk debugging:**
1. Screenshot error di Arduino IDE
2. Output Serial Monitor ESP32-4
3. Output backend console
4. Screenshot frontend (dashboard)
5. File .env (tanpa password database)

**Dokumentasi lengkap:**
- [CARA_HUBUNGKAN_ESP32.md](CARA_HUBUNGKAN_ESP32.md) - Panduan detail step-by-step
- [QUICK_START.md](QUICK_START.md) - Quick start guide
- [CARA_SETUP_IOT.md](CARA_SETUP_IOT.md) - Setup lengkap

---

**Last Updated:** 2026-06-03  
**Status:** Tested dengan ESP32-4 TEST MODE  
**Next Step:** Upload esp32-4.ino → Restart backend → Refresh website
