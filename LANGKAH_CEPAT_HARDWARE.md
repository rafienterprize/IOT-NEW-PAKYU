# ⚡ LANGKAH CEPAT - Hubungkan Hardware ke Website

## 🎯 Goal: Dari hardware lengkap → website menampilkan data real

**Estimasi waktu:** 20-30 menit

---

## 📋 Quick Checklist (Follow urut dari atas!)

### ✅ **1. Edit WiFi di Kode ESP32-4** (5 menit)

File sudah terbuka: `esp32-4.ino`

Cari baris 60-61, ganti:
```cpp
String wifiSSID = "NamaWiFiAnda";     // ← GANTI INI
String wifiPASS = "PasswordWiFi";     // ← GANTI INI
```

Pastikan baris 77:
```cpp
#define ENABLE_TEST_MODE false  // ← HARUS false! (sudah diubah)
```

**Save file!** (Ctrl+S)

---

### ✅ **2. Upload ke ESP32-4** (3 menit)

**Di Arduino IDE:**
1. Tools → Board → **ESP32 Dev Module**
2. Tools → Port → **COM8**
3. Click **Upload** (→)
4. Tunggu "Done uploading"

**Test Serial Monitor:**
1. Tools → Serial Monitor (Ctrl+Shift+M)
2. Baud rate → **115200**
3. Tekan tombol **RESET** di ESP32-4

**Expected output:**
```
========================================
ESP32-4 Gateway Controller
========================================
[READY] Gateway is ready!
Waiting for data from ESP devices...
```

**✅ Kalau sudah muncul ini, lanjut!**

---

### ✅ **3. Upload ke ESP32 #1, #2, #3** (15 menit)

**Untuk SETIAP ESP32:**

1. **Edit WiFi** di kode (`esp32-1.ino`, `esp32-2.ino`, `esp32-3.ino`)
   ```cpp
   String ssid = "NamaWiFiAnda";     // ← SAMA dengan ESP32-4!
   String password = "PasswordWiFi";  // ← SAMA dengan ESP32-4!
   ```

2. **Upload:**
   - Hubungkan ESP32 ke USB
   - Pilih Port COM yang baru muncul
   - Upload
   - **Cabut USB** setelah selesai

3. **Power dengan USB charger** atau power bank

**PENTING:** WiFi di semua ESP32 harus SAMA!

---

### ✅ **4. Wiring Check** (5 menit)

**Pastikan kabel UART tersambung:**

```
ESP1 → ESP4:  TX(17) → RX(16), RX(16) → TX(17), GND → GND
ESP2 → ESP4:  TX → RX(4), RX → TX(5), GND → GND  
ESP3 → ESP4:  TX → RX(2), RX → TX(18), GND → GND

🔥 CRITICAL: GND semua ESP32 HARUS terhubung!
```

**Power:**
- ESP32 #1, #2, #3 → USB charger / power bank
- ESP32 #4 → USB komputer (COM8) - JANGAN CABUT!

---

### ✅ **5. Verifikasi Data Masuk** (2 menit)

**Serial Monitor ESP32-4** akan menampilkan data dari ESP1/2/3:

```
ESP1:STATUS:OK,GAS=1234,LAMP=OFF,WIFI=OK
ESP2:STATUS:OK,RAIN=567,CLOTHESLINE=OUT,WIFI=OK  
ESP3:STATUS:OK,DOOR=CLOSE,GATE=CLOSE,WIFI=OK
ESP1:GAS:1234
ESP2:RAIN:567
...
```

**❌ Kalau tidak ada data:**
- Cek wiring UART (GND semua tersambung?)
- Cek semua ESP32 sudah di-upload dan menyala?
- Cek WiFi SSID/Password sama di semua ESP32?

**✅ Kalau data sudah muncul, lanjut ke backend!**

---

### ✅ **6. Restart Backend** (1 menit)

**Terminal/CMD:**
```cmd
cd backend
# Ctrl+C untuk stop backend
npm start
```

**Atau pakai script:**
```cmd
cd backend
restart-backend.bat
```

**Backend akan menampilkan:**
```
✓ Server running on http://localhost:3001
✓ Serial port COM8 connected
✓ Socket.IO ready
```

**Backend console akan log data dari ESP32:**
```
ESP1:GAS:1234
ESP2:RAIN:567
ESP3:DOOR:CLOSE
```

---

### ✅ **7. Test Website** (1 menit)

**Buka browser:**
```
http://localhost:5173
```

**Cek:**
- [ ] Semua ESP32 status **Connected** (hijau)
- [ ] Tidak ada alert offline
- [ ] Data sensor update setiap beberapa detik
- [ ] Gas value dan Rain value berubah-ubah (real-time)

**Test command:**
- [ ] Click tombol **Lamp ON/OFF** → Lampu nyala/mati
- [ ] Click **Clothesline IN** → Clothesline masuk
- [ ] Scan RFID → Door/Gate buka otomatis

---

## 🎉 SUKSES!

Kalau semua checklist ✅, hardware Anda sudah terhubung ke website!

---

## 🔥 Quick Troubleshooting

### ESP32-4 tidak terima data dari ESP1/2/3

**Cek:**
1. GND semua ESP32 terhubung?
2. Wiring UART benar? (TX → RX, RX → TX)
3. ESP1/2/3 sudah di-upload kode?
4. Serial Monitor ESP1/2/3 menunjukkan data?

**Test manual:**
- Buka Serial Monitor ESP32-1 (9600 baud)
- Kirim: `ESP1:TEST:HELLO`
- Cek Serial Monitor ESP32-4, ada data?

### Backend tidak menerima data

**Cek:**
1. Serial Monitor ESP32-4 menampilkan data?
2. Backend console ada log data?
3. Port COM8 benar di .env?
4. Backend sudah restart setelah ESP32 upload?

### Website masih offline

**Cek:**
1. Backend console log data ESP?
2. Browser console (F12) ada error?
3. Socket.IO connected? (lihat di console)
4. Hard refresh browser (Ctrl+Shift+R)

---

## 📞 Bantuan Lebih Lanjut

Baca file:
- **CHECKLIST_UPLOAD.md** - Detail upload setiap ESP32
- **TROUBLESHOOT_OFFLINE.md** - Troubleshooting lengkap
- **CARA_HUBUNGKAN_ESP32.md** - Panduan detail step-by-step

---

**NEXT:** Kalau semua sudah jalan, test semua fitur di website! 🚀

