# 🔌 Cara Menghubungkan ESP32 ke Website

## ✅ Status Saat Ini

- ✅ Backend server berjalan di port 3001
- ✅ Frontend berjalan di port 5173
- ✅ Database terhubung
- ✅ Socket.IO berfungsi
- ✅ ESP32-4 terdeteksi di **COM8** (USB-SERIAL CH340)
- ❌ ESP32 belum mengirim data (kode belum di-upload)

---

## 📋 Langkah-Langkah Menghubungkan ESP32

### **Langkah 1: Upload Kode ke ESP32-4 (Master Controller)**

1. **Buka Arduino IDE**
   - Jika belum install, download dari: https://www.arduino.cc/en/software

2. **Install Board ESP32** (jika belum)
   - Buka `File` → `Preferences`
   - Di "Additional Board Manager URLs", tambahkan:
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Buka `Tools` → `Board` → `Boards Manager`
   - Cari "ESP32" dan install **"ESP32 by Espressif Systems"**

3. **Install Driver CH340** (jika belum terdeteksi)
   - Download dari: http://www.wch-ic.com/downloads/CH341SER_EXE.html
   - Install dan restart komputer

4. **Upload Kode ESP32-4**
   - Buka file: `c:\Users\NITRO V\Downloads\iot web\IOT-NEW-PAKYU\code iot\esp32-4.ino`
   - Pilih board: `Tools` → `Board` → `ESP32 Dev Module`
   - Pilih port: `Tools` → `Port` → `COM8`
   - Klik tombol **Upload** (→)
   - Tunggu sampai selesai (akan ada tulisan "Leaving... Hard resetting via RTS pin...")

5. **Buka Serial Monitor** (opsional, untuk debugging)
   - Klik `Tools` → `Serial Monitor`
   - Set baud rate ke **115200**
   - Anda akan melihat output dari ESP32:
     ```
     ========================================
     ESP32-4 Gateway Controller
     IoT Smart Home System
     ========================================
     [READY] Gateway is ready!
     Waiting for data from ESP devices...
     ```

---

### **Langkah 2: Restart Backend Server**

Setelah ESP32 mulai mengirim data, restart backend server:

**Opsi A: Menggunakan Script**
```cmd
cd backend
restart-backend.bat
```

**Opsi B: Manual**
1. Stop backend yang sedang berjalan (Ctrl+C di terminal backend)
2. Start lagi:
   ```cmd
   cd backend
   npm start
   ```

---

### **Langkah 3: Verifikasi Koneksi**

1. **Cek Health Endpoint**
   - Buka browser: http://localhost:3001/health
   - Pastikan `"serial": { "isConnected": true }`

2. **Cek Device Status**
   - Buka browser: http://localhost:3001/api/status
   - Pastikan semua device menunjukkan `"isOnline": true`

3. **Cek Frontend**
   - Buka: http://localhost:5173
   - Semua ESP32 seharusnya menunjukkan status **"Connected"** (hijau)
   - Tidak ada alert "OFFLINE"

---

## 🧪 Test Mode (Tanpa Hardware ESP1/2/3)

ESP32-4 memiliki **TEST MODE** yang akan otomatis mensimulasikan data dari ESP1, ESP2, ESP3 setiap 3 detik.

**Mode ini sudah AKTIF secara default!**

Data yang dikirim:
- **ESP1**: Gas sensor (1000-1500), Lamp status
- **ESP2**: Rain sensor (500-1000), Clothesline status
- **ESP3**: Door & Gate status
- **ESP4**: System status

Jadi Anda **tidak perlu ESP32 #1, #2, #3** untuk testing. Cukup upload kode ke ESP32-4 saja.

---

## 🔧 Troubleshooting

### ❌ "Serial port COM8 not found"

**Penyebab:**
- ESP32 tidak terhubung
- Driver CH340 belum terinstall

**Solusi:**
1. Cek Device Manager: `Win+X` → `Device Manager`
2. Lihat di "Ports (COM & LPT)"
3. Jika ada tanda seru kuning, install driver CH340
4. Coba cabut dan colok ulang USB
5. Coba port USB lain

---

### ❌ "Access denied" atau "Port already in use"

**Penyebab:**
- Arduino Serial Monitor masih terbuka
- Backend masih running di background
- Aplikasi lain menggunakan COM8

**Solusi:**
1. Tutup Arduino Serial Monitor
2. Stop backend server (Ctrl+C)
3. Kill proses node yang stuck:
   ```cmd
   taskkill /F /IM node.exe
   ```
4. Restart backend

---

### ❌ ESP32 upload gagal "Failed to connect"

**Penyebab:**
- ESP32 dalam mode yang salah
- Kabel USB hanya charging (tidak data)

**Solusi:**
1. Tekan dan tahan tombol **BOOT** di ESP32
2. Klik **Upload** di Arduino IDE
3. Lepas tombol **BOOT** setelah upload dimulai
4. Atau coba kabel USB lain

---

### ❌ Device masih offline di website

**Penyebab:**
- Backend belum di-restart setelah upload
- ESP32 tidak mengirim data
- Port COM salah

**Solusi:**
1. Buka Serial Monitor Arduino (115200 baud)
2. Cek apakah ESP32 mengirim data:
   ```
   ESP1:STATUS:OK,GAS=1200,LAMP=OFF,WIFI=OK
   ESP2:STATUS:OK,RAIN=800,CLOTHESLINE=OUT,WIFI=OK
   ```
3. Jika tidak ada data, restart ESP32 (tekan tombol RESET)
4. Restart backend server
5. Refresh halaman web

---

### ❌ Data tidak muncul di frontend

**Penyebab:**
- Socket.IO tidak terhubung
- CORS issue
- Backend tidak broadcasting

**Solusi:**
1. Buka browser console (F12)
2. Cek error di console
3. Pastikan ada log "Socket connected"
4. Cek backend log apakah ada data masuk
5. Restart frontend: `npm run dev`

---

## 📊 Monitoring Real-time

### **Backend Logs**
Terminal backend akan menampilkan:
```
[08:30:15] ESP1:GAS:1200
[08:30:16] ESP2:RAIN:850
[08:30:17] ESP3:DOOR:CLOSE
```

### **Frontend Console**
Browser console (F12) akan menampilkan:
```
Socket connected
device:status {espNumber: 1, isOnline: true, ...}
sensor:data {espNumber: 1, sensorType: "GAS", value: 1200}
```

---

## 🎯 Checklist Koneksi Berhasil

- [ ] ESP32-4 terhubung ke COM8
- [ ] Kode ESP32-4 berhasil di-upload
- [ ] Serial Monitor menampilkan data ESP1/2/3
- [ ] Backend running tanpa error
- [ ] Health endpoint menunjukkan serial connected
- [ ] Device status API menunjukkan isOnline: true
- [ ] Frontend terhubung (hijau di dashboard)
- [ ] Tidak ada alert offline
- [ ] Data sensor update real-time

---

## 📞 Kontak & Bantuan

Jika masih ada masalah:
1. Cek file log di `backend/logs/`
2. Screenshot error message
3. Kirim informasi:
   - Output Serial Monitor
   - Output backend console
   - Screenshot frontend
   - Error message lengkap

---

**Dibuat:** 2026-06-03  
**Versi:** 1.0  
**Status:** Testing dengan ESP32-4 TEST MODE
