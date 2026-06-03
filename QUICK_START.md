# 🚀 Quick Start Guide - IoT Smart Home

Panduan cepat untuk menjalankan sistem IoT Smart Home dari awal sampai jalan.

---

## ⏱️ Estimasi Waktu: 15-30 menit

---

## 📋 Yang Anda Butuhkan

### Hardware
- ✅ 4x ESP32 Dev Board
- ✅ 1x LCD I2C 20x4
- ✅ Sensor: Gas (MQ-2), Rain, IR
- ✅ Actuator: Relay, Servo motor
- ✅ 4x Kabel USB (untuk programming)
- ✅ Kabel jumper untuk wiring UART
- ✅ Power supply 5V (untuk semua ESP32)

### Software
- ✅ Arduino IDE (sudah install ESP32 board)
- ✅ Node.js v18+ (https://nodejs.org/)
- ✅ Git (optional, untuk clone repo)
- ✅ Chrome/Firefox (untuk web interface)

---

## 🎯 Step 1: Upload Kode ke ESP32 (10 menit)

### 1.1 Persiapan Arduino IDE
```
Tools > Board > ESP32 Arduino > ESP32 Dev Module
Tools > Upload Speed > 115200
Tools > Flash Frequency > 80MHz
```

### 1.2 Install Library yang Diperlukan
```
Sketch > Include Library > Manage Libraries

Install:
- ESP32Servo (by Kevin Harrington)
- MFRC522 (by GithubCommunity) - untuk RFID ESP32 #3
- LiquidCrystal I2C (by Frank de Brabander) - untuk LCD ESP32 #4
```

### 1.3 Upload ESP32 #1
```
1. Buka: code iot/esp32-1.ino
2. Edit WiFi credentials (opsional):
   String wifiSSID = "NAMA_WIFI_KAMU";
   String wifiPASS = "PASSWORD_WIFI_KAMU";
3. Colok ESP32 #1 ke USB
4. Tools > Port > COMx (pilih port yang benar)
5. Click Upload (➜)
6. Tunggu "Done uploading"
```

### 1.4 Upload ESP32 #2
```
1. Buka: code iot/esp32-2.ino
2. Colok ESP32 #2 ke USB
3. Tools > Port > COMx (pilih port yang benar)
4. Click Upload (➜)
```

### 1.5 Upload ESP32 #3
```
1. Buka: code iot/esp32-3.ino
2. Colok ESP32 #3 ke USB
3. Tools > Port > COMx (pilih port yang benar)
4. Click Upload (➜)
```

### 1.6 Upload ESP32 #4 (GATEWAY - PENTING!)
```
1. Buka: code iot/esp32-4.ino
2. Edit WiFi credentials:
   String wifiSSID = "NAMA_WIFI_KAMU";
   String wifiPASS = "PASSWORD_WIFI_KAMU";
3. Colok ESP32 #4 ke USB
4. Tools > Port > COMx (CATAT PORT INI! Nanti dipakai backend)
5. Click Upload (➜)
```

✅ **Checkpoint 1:**
- Buka Serial Monitor (Tools > Serial Monitor)
- Set baudrate: 115200
- Harusnya muncul: "ESP32-4 Controller READY"

---

## 🔌 Step 2: Wiring UART (5 menit)

Hubungkan ESP32 lainnya ke ESP32 #4 dengan kabel jumper:

### ESP32 #1 → ESP32 #4
```
ESP1 GPIO 17 (TX) → ESP4 GPIO 16 (RX)
ESP1 GPIO 16 (RX) → ESP4 GPIO 17 (TX)
ESP1 GND → ESP4 GND
```

### ESP32 #2 → ESP32 #4
```
ESP2 GPIO 17 (TX) → ESP4 GPIO 4 (RX)
ESP2 GPIO 16 (RX) → ESP4 GPIO 5 (TX)
ESP2 GND → ESP4 GND
```

### ESP32 #3 → ESP32 #4
```
ESP3 GPIO 17 (TX) → ESP4 GPIO 2 (RX)
ESP3 GPIO 16 (RX) → ESP4 GPIO 18 (TX)
ESP3 GND → ESP4 GND
```

✅ **Checkpoint 2:**
- Nyalakan semua ESP32 (colok power atau USB)
- Lihat Serial Monitor ESP32 #4
- Harusnya muncul data: `ESP1:STATUS:...`, `ESP2:STATUS:...`, `ESP3:STATUS:...`

---

## 💻 Step 3: Setup Backend (5 menit)

### 3.1 Install Dependencies
```bash
cd backend
npm install
```

### 3.2 Cek Port COM ESP32-4

**Windows:**
```
Device Manager > Ports (COM & LPT)
Lihat: Silicon Labs CP210x ... (COM3)
Catat nomor COM nya!
```

**Linux/Mac:**
```bash
ls /dev/tty.*
# Output: /dev/tty.usbserial-0001
```

### 3.3 Buat File .env
```bash
# File .env sudah dibuat otomatis
# Edit dengan text editor (Notepad++, VSCode, dll)

# Ganti COM3 dengan port ESP32-4 Anda:
SERIAL_PORT=COM3
SERIAL_BAUDRATE=115200
USE_MOCK_SERIAL=false
```

### 3.4 (Opsional) Setup Database
Jika ingin pakai database real (bukan mock):

```bash
# Edit .env, ganti DATABASE_URL:
DATABASE_URL=postgresql://user:pass@localhost:5432/smarthome

# Jalankan migration:
npx prisma migrate dev
npx prisma generate
```

Atau skip database untuk testing cepat (data disimpan di memory).

### 3.5 Test Koneksi Serial
```bash
node test-serial-connection.js
```

Expected output:
```
✅ Serial port opened successfully!
📡 Listening for data from ESP32-4...

[14:30:25] #1 ESP1:STATUS:OK,GAS=1200...
```

Jika OK, press **Ctrl+C** untuk stop.

### 3.6 Jalankan Backend
```bash
npm run dev
```

Expected output:
```
✓ Serial port opened: COM3 @ 115200 baud
✓ Server running on http://localhost:3001
✓ Socket.IO ready
```

✅ **Checkpoint 3:**
```bash
# Terminal baru, test health check:
curl http://localhost:3001/health

# Harusnya return:
# {"status":"ok", "services":{"serial":{"isConnected":true}}}
```

---

## 🌐 Step 4: Jalankan Frontend (3 menit)

### 4.1 Install Dependencies
```bash
# Terminal baru
cd frontend
npm install
```

### 4.2 Jalankan Development Server
```bash
npm run dev
```

Expected output:
```
VITE v5.x ready in 500 ms
➜ Local:   http://localhost:5173/
```

### 4.3 Buka Browser
```
http://localhost:5173
```

✅ **Checkpoint 4:**
- Dashboard muncul
- Device cards menampilkan status ESP1/2/3
- Data sensor update real-time
- Tidak ada error di Browser Console (F12)

---

## 🎉 Step 5: Test Fitur (5 menit)

### Test 1: Kontrol Lampu
```
1. Di website, cari "Smart Lamp (ESP1)"
2. Click toggle switch "Lamp"
3. Lihat relay di ESP32 #1 harusnya nyala/mati
4. Status update di website
```

### Test 2: Sensor Gas
```
1. Dekatkan gas/alkohol ke sensor MQ-2
2. Nilai gas naik di website chart
3. Jika > 1800, alert muncul
```

### Test 3: Sensor Rain
```
1. Siram air ke sensor rain
2. Nilai rain naik di website
3. Jemuran otomatis tarik masuk (auto mode)
4. Buzzer berbunyi di ESP32 #2
```

### Test 4: RFID Door
```
1. Tap kartu RFID ke reader
2. Door servo bergerak (buka)
3. Buzzer beep 1x
4. Log muncul di website
5. Door auto close setelah 3 detik
```

### Test 5: Manual Control
```
1. Click "Open Gate" di website
2. Gate servo bergerak
3. Auto close setelah 4 detik
```

---

## ✅ Troubleshooting Cepat

### Backend tidak connect ke serial:
```bash
# 1. TUTUP Serial Monitor Arduino IDE!
# 2. Cek port di .env sesuai Device Manager
# 3. Cabut-colok ESP32-4
# 4. Restart backend
```

### Data tidak muncul:
```bash
# 1. Cek wiring UART (TX-RX, RX-TX, GND-GND)
# 2. Cek semua ESP32 sudah upload kode terbaru
# 3. Buka Serial Monitor ESP32-4, lihat data masuk?
# 4. Restart semua ESP32
```

### Command tidak jalan:
```bash
# 1. ESP32-4 sudah upload kode baru? (ada handleUSBCommands)
# 2. Backend log ada "Command sent"?
# 3. Test manual via Serial Monitor: ESP1:LAMP:ON
```

### Website tidak connect:
```bash
# 1. Backend jalan di port 3001?
# 2. Frontend jalan di port 5173?
# 3. Clear browser cache (Ctrl+Shift+Del)
# 4. Cek Browser Console (F12) untuk error
```

---

## 📚 Dokumentasi Lengkap

Setelah sistem jalan, baca dokumen ini untuk info lebih detail:

- 📖 **CARA_SETUP_IOT.md** - Setup detail dan penjelasan
- 🏗️ **ARSITEKTUR_SISTEM.md** - Diagram dan alur komunikasi
- ✅ **TEST_CHECKLIST.md** - Checklist testing lengkap
- 📋 **backend/README.md** - API documentation
- 🎨 **frontend/README.md** - Frontend documentation

---

## 🎯 Next Steps

Setelah sistem jalan:

1. ✅ Test semua fitur secara menyeluruh
2. ✅ Setup database permanent (Supabase/PostgreSQL)
3. ✅ Tambahkan RFID whitelist (via website)
4. ✅ Atur threshold sensor (gas & rain)
5. ✅ Enable auto mode untuk automation
6. ✅ Monitor system stability 24 jam
7. ✅ Deploy ke production (optional)

---

## 🆘 Butuh Bantuan?

Kalau ada masalah:

1. Cek log backend console
2. Cek Serial Monitor ESP32-4
3. Cek Browser Console (F12)
4. Baca TEST_CHECKLIST.md untuk troubleshooting detail
5. Pastikan semua kabel terhubung dengan baik
6. Pastikan power supply stabil (5V/2A minimum)

---

## 🎊 Selamat!

Sistem IoT Smart Home Anda sudah jalan! 🎉

Sekarang Anda bisa:
- ✅ Monitor sensor real-time dari browser
- ✅ Kontrol device dari anywhere (local network)
- ✅ Terima alert otomatis
- ✅ Lihat history data sensor
- ✅ Manage RFID access control
- ✅ Automation dengan auto mode

**Have fun building!** 🚀

---

**Version:** 1.0  
**Last Updated:** 2024  
**Created by:** Kiro AI Assistant
