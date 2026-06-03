# 🚀 Cara Menghubungkan ESP32 dengan Backend

## 📋 Arsitektur Sistem

```
ESP32 #1 (Lamp, Gas, Feeder)
    |
    | UART (GPIO 16/17)
    ↓
ESP32 #2 (Clothesline, Rain) -----> ESP32 #4 (Gateway) -----> Backend (Node.js)
    |                                      |                        ↓
    | UART (GPIO 4/5)                     | USB Serial         Website
    ↓                                      | (COM3/ttyUSB0)
ESP32 #3 (Door, Gate, RFID)
    |
    | UART (GPIO 2/18)
    ↓
```

## ✅ Perubahan yang Sudah Dilakukan

### 1. **ESP32-4 (Gateway)** - File: `code iot/esp32-4.ino`
- ✅ Menambahkan fungsi `handleUSBCommands()` untuk menerima command dari backend
- ✅ Mengubah `readFromESP()` untuk **meneruskan semua data ke USB Serial**
- ✅ Format data yang dikirim: `ESP1:STATUS:OK,GAS=1200,LAMP=OFF`

### 2. **Backend** - File: `backend/.env`
- ✅ Membuat file `.env` dengan konfigurasi yang benar
- ✅ Baudrate diubah ke **115200** (sesuai ESP32-4)
- ✅ Serial port default: **COM3** (sesuaikan dengan komputer Anda)

## 🔧 Langkah-Langkah Setup

### **Step 1: Upload Kode ke ESP32**

1. **Upload esp32-1.ino** ke ESP32 #1
2. **Upload esp32-2.ino** ke ESP32 #2
3. **Upload esp32-3.ino** ke ESP32 #3
4. **Upload esp32-4.ino** ke ESP32 #4 ⚠️ **PENTING!**

### **Step 2: Wiring UART antar ESP32**

Hubungkan ESP32 lainnya ke ESP32 #4:

```
ESP32 #1          →    ESP32 #4
   TX (GPIO 17)   →    RX (GPIO 16)
   RX (GPIO 16)   ←    TX (GPIO 17)
   GND            →    GND

ESP32 #2          →    ESP32 #4
   TX (GPIO 17)   →    RX (GPIO 4)
   RX (GPIO 16)   ←    TX (GPIO 5)
   GND            →    GND

ESP32 #3          →    ESP32 #4
   TX (GPIO 17)   →    RX (GPIO 2)
   RX (GPIO 16)   ←    TX (GPIO 18)
   GND            →    GND
```

### **Step 3: Cek Port COM ESP32-4**

#### Windows:
1. Colokkan ESP32-4 ke USB komputer
2. Buka **Device Manager**
3. Cari di **Ports (COM & LPT)**
4. Lihat nama seperti `Silicon Labs CP210x USB to UART Bridge (COM3)`
5. Catat nomor **COM** nya (misal COM3, COM4, COM5)

#### Linux/Mac:
```bash
ls /dev/tty.*
# atau
ls /dev/ttyUSB*
```

### **Step 4: Setup Backend**

1. Masuk ke folder backend:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Edit file `.env` dan ganti `SERIAL_PORT`:
```env
SERIAL_PORT=COM3  # ← Ganti dengan port ESP32-4 Anda
SERIAL_BAUDRATE=115200
USE_MOCK_SERIAL=false
```

4. (Opsional) Setup database Supabase:
   - Buat project di https://supabase.com
   - Copy **Connection String** dari Settings > Database
   - Paste ke `DATABASE_URL` di file `.env`
   - Jalankan migrations:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. Jalankan backend:
```bash
npm run dev
```

### **Step 5: Test Koneksi**

Buka browser dan akses:
```
http://localhost:3001/health
```

Harusnya muncul response JSON:
```json
{
  "status": "ok",
  "services": {
    "serial": {
      "isConnected": true,
      "port": "COM3"
    }
  }
}
```

### **Step 6: Jalankan Frontend**

1. Buka terminal baru
2. Masuk ke folder frontend:
```bash
cd frontend
npm install
npm run dev
```

3. Buka browser: `http://localhost:5173`

## 📡 Format Komunikasi

### **ESP → Backend (via ESP32-4 USB Serial)**
```
ESP1:STATUS:OK,GAS=1200,LAMP=OFF,WIFI=OK
ESP1:GAS:1200
ESP1:LAMP:ON
ESP2:RAIN:1800
ESP2:CLOTHESLINE:IN
ESP3:DOOR:OPEN
ESP3:RFID:A1B2C3D4
```

### **Backend → ESP (via ESP32-4 USB Serial)**
```
ESP1:LAMP:ON          # Nyalakan lampu
ESP1:LAMP:OFF         # Matikan lampu
ESP1:FEED             # Beri makan ikan
ESP2:CLOTHESLINE:IN   # Tarik jemuran
ESP2:CLOTHESLINE:OUT  # Keluarkan jemuran
ESP3:DOOR:OPEN        # Buka pintu
ESP3:DOOR:CLOSE       # Tutup pintu
ESP3:GATE:OPEN        # Buka gerbang
ESP3:GATE:CLOSE       # Tutup gerbang
WIFI:SSID,PASSWORD    # Update WiFi config semua ESP
```

## 🐛 Troubleshooting

### Problem: Backend tidak bisa connect ke serial port

**Solusi:**
1. Pastikan ESP32-4 sudah dicolok ke USB
2. Cek port COM yang benar di Device Manager
3. Tutup Arduino IDE / Serial Monitor (port hanya bisa dipakai 1 aplikasi)
4. Restart backend

### Problem: Data tidak muncul di website

**Solusi:**
1. Buka Serial Monitor Arduino IDE di ESP32-4 (baudrate 115200)
2. Cek apakah data dari ESP1/2/3 muncul
3. Kalau tidak ada, cek wiring UART
4. Kalau ada tapi backend tidak terima, cek file `.env`

### Problem: Command dari website tidak sampai ke ESP

**Solusi:**
1. Pastikan ESP32-4 sudah di-upload dengan kode baru (ada `handleUSBCommands()`)
2. Cek backend console, harusnya ada log `📤 Command sent: ...`
3. Cek Serial Monitor ESP32-4, harusnya ada log command

### Problem: ESP32 tidak kirim data

**Solusi:**
1. Cek power supply ESP32 (harus stabil 5V)
2. Reset ESP32
3. Re-upload kode
4. Pastikan baudrate 9600 untuk UART antar ESP32

## 📝 Catatan Penting

1. **ESP32-4 harus selalu aktif** - Dia jadi gateway komunikasi
2. **Baudrate USB Serial = 115200** (Serial.begin)
3. **Baudrate UART antar ESP32 = 9600** (HardwareSerial)
4. **Jangan buka Serial Monitor saat backend running** - Port akan conflict
5. **Format data harus ketat**: `ESPx:TYPE:MESSAGE`

## 🎯 Next Steps

Setelah semua jalan:
1. Test setiap command dari website
2. Monitor data sensor real-time
3. Test alert system (gas & rain)
4. Test RFID door access
5. Setup auto mode (rain detection → clothesline in)

## 💡 Tips

- Gunakan **Serial Monitor Arduino IDE** untuk debugging ESP32
- Gunakan **Postman** untuk test backend API
- Lihat **Browser Console** untuk debugging frontend
- Check log backend dengan `npm run dev`

---

✅ **Kode ESP32-4 sudah diupdate**
✅ **Backend sudah dikonfigurasi**
✅ **Tinggal upload & test!**
