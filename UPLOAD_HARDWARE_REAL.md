# 🔥 Upload Hardware Real - Step by Step

Website sudah jalan dengan TEST MODE. Sekarang hubungkan hardware asli!

---

## 📋 **Persiapan**

### **Yang Anda Butuhkan:**
- ✅ 4x ESP32 Dev Board
- ✅ Sensor & Aktuator (Gas, Rain, RFID, Servo, Relay, dll)
- ✅ Kabel jumper untuk UART
- ✅ Arduino IDE sudah install
- ✅ Backend & Frontend sudah running

### **WiFi Configuration:**
ESP32 #1, #2, #3 akan otomatis menerima WiFi dari ESP32-4 via UART.
Jadi **hanya perlu edit WiFi di ESP32-4 saja** (sudah dilakukan).

---

## 🔵 **STEP 1: Upload ESP32 #1 - Lamp & Gas**

### **Hardware Setup:**
```
ESP32 #1 Pin Connections:
- GPIO 16 (RX) ← TX dari ESP32-4 (GPIO 17)
- GPIO 17 (TX) → RX ke ESP32-4 (GPIO 16)
- GND → GND ESP32-4 (PENTING!)
- GPIO 18 → Servo Fish Feeder
- GPIO 23 → Relay Lamp
- GPIO 34 → Gas Sensor MQ-2 (Analog)
```

### **Upload Code:**
1. Hubungkan ESP32 #1 ke USB komputer
2. Buka Arduino IDE
3. Open file: `code iot/esp32-1.ino`
4. **TIDAK PERLU EDIT WIFI** (akan dapat dari ESP32-4)
5. Tools → Board → **ESP32 Dev Module**
6. Tools → Port → **Pilih COM port baru** (bukan COM8)
7. Click **Upload** (→)
8. Tunggu "Done uploading"

### **Test:**
1. Buka Serial Monitor (Ctrl+Shift+M)
2. Baud rate: **115200**
3. Tekan RESET di ESP32-1
4. Akan muncul:
   ```
   ESP32-1 Starting...
   [READY] ESP32-1 is ready
   Waiting for WiFi config from ESP32-4...
   ```

5. **Setelah ESP32-4 kirim WiFi config**, akan muncul:
   ```
   [WIFI] Connecting to YourSSID...
   [WIFI] Connected! IP: 192.168.x.x
   ```

6. **ESP32-1 akan mulai kirim data ke ESP32-4:**
   ```
   Kirim -> ESP1:STATUS:OK,GAS=1234,LAMP=OFF,WIFI=OK
   Kirim -> ESP1:GAS:1234
   ```

✅ **Jika muncul log ini, ESP32-1 SUKSES!**

---

## 🟢 **STEP 2: Upload ESP32 #2 - Clothesline & Rain**

### **Hardware Setup:**
```
ESP32 #2 Pin Connections:
- TX → RX ke ESP32-4 (GPIO 4)
- RX ← TX dari ESP32-4 (GPIO 5)
- GND → GND ESP32-4 (PENTING!)
- GPIO 18 → Servo Clothesline
- GPIO 34 → Rain Sensor (Analog)
```

### **Upload Code:**
1. **Cabut ESP32 #1** dari USB
2. Hubungkan **ESP32 #2** ke USB
3. Open: `code iot/esp32-2.ino`
4. **TIDAK PERLU EDIT WIFI**
5. Tools → Port → **Pilih COM port**
6. **Upload** (→)

### **Test Serial Monitor:**
```
ESP32-2 Starting...
[READY] ESP32-2 is ready
Waiting for WiFi config...
[WIFI] Connected!
Kirim -> ESP2:STATUS:OK,RAIN=567,CLOTHESLINE=OUT,WIFI=OK
```

✅ **Sukses!**

---

## 🔴 **STEP 3: Upload ESP32 #3 - Door & Gate & RFID**

### **Hardware Setup:**
```
ESP32 #3 Pin Connections:
- TX → RX ke ESP32-4 (GPIO 2)
- RX ← TX dari ESP32-4 (GPIO 18)
- GND → GND ESP32-4 (PENTING!)
- RFID RC522 → SPI (pins 18, 19, 23, 5, SS=15, RST=22)
- GPIO 13 → IR Sensor Door
- GPIO 12 → IR Sensor Gate
- GPIO 14 → Servo Door
- GPIO 27 → Servo Gate
```

### **Upload Code:**
1. **Cabut ESP32 #2**
2. Hubungkan **ESP32 #3** ke USB
3. Open: `code iot/esp32-3.ino`
4. **TIDAK PERLU EDIT WIFI**
5. Upload

### **Test:**
```
ESP32-3 Starting...
[READY] ESP32-3 is ready
[WIFI] Connected!
Kirim -> ESP3:STATUS:OK,DOOR=CLOSE,GATE=CLOSE,WIFI=OK
```

✅ **Sukses!**

---

## 🟡 **STEP 4: Ubah ESP32-4 ke Mode Real (TEST_MODE = false)**

Sekarang semua ESP32 sudah di-upload, saatnya matikan TEST MODE:

### **Edit esp32-4.ino:**
1. File sudah terbuka di editor
2. Cari baris 77:
   ```cpp
   #define ENABLE_TEST_MODE true  // ← Ubah jadi false
   ```
3. Ubah jadi:
   ```cpp
   #define ENABLE_TEST_MODE false  // Set false untuk disable simulasi
   ```
4. **Save** (Ctrl+S)

### **Upload Ulang ESP32-4:**
1. ESP32-4 masih terhubung di **COM8**
2. Tools → Port → **COM8**
3. **Upload** (→)

---

## 🔌 **STEP 5: Power & Wiring Final Check**

### **Power Supply:**

**Opsi A - USB Power (Simple):**
```
ESP32 #1 → USB charger / Power bank
ESP32 #2 → USB charger / Power bank
ESP32 #3 → USB charger / Power bank
ESP32 #4 → USB komputer (COM8) - JANGAN CABUT!
```

**Opsi B - External Power (Recommended):**
```
Gunakan power supply 5V 2A dengan terminal block:
- 5V → Vin semua ESP32
- GND → GND semua ESP32
- ESP32-4 tetap terhubung USB ke komputer untuk serial
```

### **Wiring UART Check:**

```
┌──────────┐         ┌──────────┐
│ ESP32 #1 │         │ ESP32 #4 │
├──────────┤         ├──────────┤
│ TX (17)  ├────────>│ RX (16)  │
│ RX (16)  │<────────┤ TX (17)  │
│ GND      ├─────┐   │ GND      │
└──────────┘     │   └──────────┘
                 │
┌──────────┐     │   ┌──────────┐
│ ESP32 #2 │     │   │ ESP32 #4 │
├──────────┤     │   ├──────────┤
│ TX       ├─────┼──>│ RX (4)   │
│ RX       │<────┼───┤ TX (5)   │
│ GND      ├─────┤   │ GND      │
└──────────┘     │   └──────────┘
                 │
┌──────────┐     │   ┌──────────┐
│ ESP32 #3 │     │   │ ESP32 #4 │
├──────────┤     │   ├──────────┤
│ TX       ├─────┼──>│ RX (2)   │
│ RX       │<────┼───┤ TX (18)  │
│ GND      ├─────┘   │ GND      │
└──────────┘         └──────────┘

⚠️ CRITICAL: Semua GND ESP32 harus terhubung ke GND yang sama!
```

### **Verifikasi Wiring:**
- [ ] ESP1 TX(17) → ESP4 RX(16)
- [ ] ESP1 RX(16) → ESP4 TX(17)
- [ ] ESP2 TX → ESP4 RX(4)
- [ ] ESP2 RX → ESP4 TX(5)
- [ ] ESP3 TX → ESP4 RX(2)
- [ ] ESP3 RX → ESP4 TX(18)
- [ ] **Semua GND terhubung**

---

## 🔥 **STEP 6: Power On & Test**

### **Power On Sequence:**
1. Nyalakan ESP32 #1, #2, #3 (dari USB charger)
2. ESP32 #4 sudah menyala (dari USB komputer)
3. Tunggu 10 detik (WiFi connecting)

### **Test Serial Monitor ESP32-4:**
1. Arduino IDE → Tools → Serial Monitor (COM8)
2. Baud rate: **115200**
3. Tekan RESET di ESP32-4

**Expected Output:**
```
========================================
ESP32-4 Gateway Controller
========================================
[INFO] USB Serial: 115200 baud
[INFO] UART Serial: 9600 baud
[READY] Gateway is ready!
[GATEWAY] Sending WiFi config to all ESP devices...
[GATEWAY] WiFi sent to ESP1
[GATEWAY] WiFi sent to ESP2
[GATEWAY] WiFi config sent to ESP1 & ESP2

Waiting for data from ESP devices...
```

**Setelah 5-10 detik, data akan masuk:**
```
ESP1:STATUS:OK,GAS=1234,LAMP=OFF,WIFI=OK
ESP2:STATUS:OK,RAIN=567,CLOTHESLINE=OUT,WIFI=OK
ESP3:STATUS:OK,DOOR=CLOSE,GATE=CLOSE,WIFI=OK
ESP1:GAS:1234
ESP2:RAIN:567
```

✅ **SUKSES! Data real dari hardware masuk!**

---

## 🌐 **STEP 7: Restart Backend & Test Website**

### **Restart Backend:**
```cmd
# Kill process lama
taskkill /F /IM node.exe

# Start backend
cd backend
npm start
```

**Backend console akan menampilkan:**
```
✓ Serial port opened: COM8
ESP1:STATUS:OK,GAS=1234...
ESP2:STATUS:OK,RAIN=567...
ESP3:STATUS:OK,DOOR=CLOSE...
```

### **Refresh Website:**
```
http://localhost:5173
```

**Cek:**
- [ ] Semua ESP32 status **Connected** (hijau)
- [ ] Gas value dari sensor asli (berubah-ubah sesuai udara)
- [ ] Rain value dari sensor asli
- [ ] Tidak ada alert offline

### **Test Command:**
- [ ] Click **Lamp ON** → Relay ESP32-1 nyala
- [ ] Click **Lamp OFF** → Relay mati
- [ ] Click **Feed Fish** → Servo putar
- [ ] Click **Clothesline IN** → Servo ESP32-2 gerak
- [ ] Scan kartu RFID → Door/Gate buka

---

## 🎉 **SUKSES!**

Kalau semua step di atas berhasil:
- ✅ Hardware terhubung ke website
- ✅ Data real-time dari sensor
- ✅ Command dari website ke hardware bekerja
- ✅ Sistem IoT Smart Home siap digunakan!

---

## 🐛 **Troubleshooting**

### ❌ ESP32-4 tidak terima data dari ESP1/2/3

**Cek:**
1. **GND semua ESP32 terhubung?** (paling sering ini!)
2. Wiring UART benar? TX → RX, RX → TX
3. ESP1/2/3 sudah menyala?
4. WiFi sudah connect? (cek Serial Monitor ESP1/2/3)

**Test Manual:**
- Serial Monitor ESP32-1 → ketik: `ESP1:TEST:HELLO`
- Cek Serial Monitor ESP32-4 → ada data?
- Kalau tidak ada → wiring salah atau GND tidak terhubung

### ❌ ESP1/2/3 tidak dapat WiFi config

**Cek:**
1. ESP32-4 sudah kirim WiFi? (lihat Serial Monitor ESP4)
2. UART RX/TX terbalik?
3. Baud rate UART = 9600 (sudah default di kode)

**Manual test:**
- Serial Monitor ESP32-4 → ketik: `WIFI:YourSSID,YourPassword`
- Kirim ke ESP1/2/3, cek apakah mereka connect WiFi

### ❌ Backend tidak terima data

**Cek:**
1. ESP32-4 Serial Monitor ada data ESP1/2/3?
2. Backend console ada log data?
3. COM8 masih terhubung? (cek .env)
4. Restart backend setelah upload ESP32-4

### ❌ Website masih offline

**Cek:**
1. Backend log ada data ESP?
2. Socket.IO connected? (browser console F12)
3. Hard refresh (Ctrl+Shift+R)
4. Cek API: http://localhost:3001/api/status

---

## 📊 **Monitoring**

### **Backend Console:**
```
ESP1:GAS:1234
ESP2:RAIN:567
ESP3:DOOR:CLOSE
```

### **Serial Monitor ESP32-4:**
```
ESP1:STATUS:OK,GAS=1234,LAMP=OFF,WIFI=OK
ESP2:STATUS:OK,RAIN=567,CLOTHESLINE=OUT,WIFI=OK
```

### **Website Dashboard:**
- Gas value update real-time
- Rain value update real-time
- Device status: Connected
- Command response: Instant

---

**Good luck! 🚀**

