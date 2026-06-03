# ✅ Checklist Upload Kode ke ESP32

## 📌 PENTING: Upload URUT dari ESP32-1 sampai ESP32-4

---

## 🔵 ESP32 #1 - Lamp & Gas Sensor

**File:** `code iot/esp32-1.ino`

**Sebelum Upload - Edit WiFi:**
```cpp
// Baris sekitar 20-30, cari:
String ssid = "YourWiFiSSID";      // ← GANTI dengan WiFi Anda
String password = "YourPassword";  // ← GANTI dengan password WiFi
```

**Langkah Upload:**
1. [ ] Hubungkan ESP32 #1 ke komputer via USB
2. [ ] Buka Arduino IDE → Open `esp32-1.ino`
3. [ ] Edit WiFi SSID dan Password
4. [ ] Tools → Board → ESP32 Dev Module
5. [ ] Tools → Port → (pilih COM port ESP32-1)
6. [ ] Click Upload (→)
7. [ ] Tunggu "Done uploading"
8. [ ] **PENTING:** Cabut USB, biarkan ESP32-1 standby

**Hardware yang Terhubung:**
- Gas Sensor MQ-2 → Pin A0
- Relay Lamp → Pin (cek di kode)
- Servo Feeder → Pin (cek di kode)
- TX/RX ke ESP32-4

---

## 🟢 ESP32 #2 - Clothesline & Rain Sensor

**File:** `code iot/esp32-2.ino`

**Sebelum Upload - Edit WiFi:**
```cpp
String ssid = "YourWiFiSSID";      // ← GANTI
String password = "YourPassword";  // ← GANTI
```

**Langkah Upload:**
1. [ ] Hubungkan ESP32 #2 ke komputer via USB
2. [ ] Buka Arduino IDE → Open `esp32-2.ino`
3. [ ] Edit WiFi SSID dan Password
4. [ ] Tools → Board → ESP32 Dev Module
5. [ ] Tools → Port → (pilih COM port ESP32-2)
6. [ ] Click Upload (→)
7. [ ] Tunggu "Done uploading"
8. [ ] **PENTING:** Cabut USB, biarkan ESP32-2 standby

**Hardware yang Terhubung:**
- Rain Sensor → Pin A0
- Servo Clothesline → Pin (cek di kode)
- TX/RX ke ESP32-4

---

## 🔴 ESP32 #3 - Door & Gate & RFID

**File:** `code iot/esp32-3.ino`

**Sebelum Upload - Edit WiFi:**
```cpp
String ssid = "YourWiFiSSID";      // ← GANTI
String password = "YourPassword";  // ← GANTI
```

**Langkah Upload:**
1. [ ] Hubungkan ESP32 #3 ke komputer via USB
2. [ ] Buka Arduino IDE → Open `esp32-3.ino`
3. [ ] Edit WiFi SSID dan Password
4. [ ] Tools → Board → ESP32 Dev Module
5. [ ] Tools → Port → (pilih COM port ESP32-3)
6. [ ] Click Upload (→)
7. [ ] Tunggu "Done uploading"
8. [ ] **PENTING:** Cabut USB, biarkan ESP32-3 standby

**Hardware yang Terhubung:**
- RFID RC522 → SPI pins
- IR Sensor Door → Pin (cek di kode)
- IR Sensor Gate → Pin (cek di kode)
- Servo Door → Pin (cek di kode)
- Servo Gate → Pin (cek di kode)
- TX/RX ke ESP32-4

---

## 🟡 ESP32 #4 - GATEWAY (MASTER)

**File:** `code iot/esp32-4.ino` ⚠️ **YANG SUDAH DIUBAH** (TEST_MODE = false)

**Sebelum Upload - Edit WiFi:**
```cpp
// Baris 60-61:
String wifiSSID = "Buahahay";      // ← GANTI dengan WiFi Anda
String wifiPASS = "namahotspot";   // ← GANTI dengan password WiFi
```

**⚠️ PASTIKAN:**
```cpp
// Baris 77:
#define ENABLE_TEST_MODE false  // ← HARUS false untuk data real!
```

**Langkah Upload:**
1. [ ] Hubungkan ESP32 #4 ke komputer via USB (COM8)
2. [ ] Buka Arduino IDE → File yang sudah terbuka (`esp32-4.ino`)
3. [ ] **PASTIKAN** TEST_MODE sudah false (sudah diubah tadi)
4. [ ] Edit WiFi SSID dan Password (baris 60-61)
5. [ ] Tools → Board → ESP32 Dev Module
6. [ ] Tools → Port → COM8
7. [ ] Click Upload (→)
8. [ ] Tunggu "Done uploading"
9. [ ] **JANGAN CABUT USB** - ESP32-4 tetap terhubung ke komputer!

**Hardware yang Terhubung:**
- LCD I2C 20x4 (opsional)
- 4x LED indicator
- Buzzer
- RX/TX dari ESP32 #1, #2, #3
- **USB ke komputer** (COM8)

---

## 📡 Wiring UART - PASTIKAN SUDAH BENAR!

```
┌──────────┐         ┌──────────┐
│ ESP32 #1 │         │ ESP32 #4 │
│          │         │ (Gateway)│
│ TX (17)  ├────────>│ RX (16)  │
│ RX (16)  │<────────┤ TX (17)  │
│ GND      ├────────>│ GND      │
└──────────┘         └──────────┘

┌──────────┐         ┌──────────┐
│ ESP32 #2 │         │ ESP32 #4 │
│          │         │          │
│ TX       ├────────>│ RX (4)   │
│ RX       │<────────┤ TX (5)   │
│ GND      ├────────>│ GND      │
└──────────┘         └──────────┘

┌──────────┐         ┌──────────┐
│ ESP32 #3 │         │ ESP32 #4 │
│          │         │          │
│ TX       ├────────>│ RX (2)   │
│ RX       │<────────┤ TX (18)  │
│ GND      ├────────>│ GND      │
└──────────┘         └──────────┘

⚠️ CRITICAL: Semua GND HARUS terhubung!
```

---

## 🔌 Power Supply

**Opsi 1: Power dari USB (untuk testing)**
- [ ] ESP32 #1, #2, #3 → Power bank atau USB charger
- [ ] ESP32 #4 → USB komputer (COM8)

**Opsi 2: Power dari adaptor (recommended untuk production)**
- [ ] Gunakan power supply 5V 2A
- [ ] Hubungkan ke 5V dan GND semua ESP32
- [ ] ESP32 #4 tetap USB ke komputer untuk komunikasi serial

---

## 🎯 Verifikasi Upload Berhasil

### **Test ESP32 #4 (Gateway)**

1. [ ] Buka Serial Monitor Arduino IDE
2. [ ] Set baud rate: **115200**
3. [ ] Tekan tombol RESET di ESP32-4
4. [ ] Anda akan melihat:

```
========================================
ESP32-4 Gateway Controller
IoT Smart Home System
========================================
[INFO] USB Serial: 115200 baud (to Backend)
[UART] Serial: 9600 baud (to ESP1/2/3)
[READY] Gateway is ready!
Waiting for data from ESP devices...
```

**Setelah 5-10 detik, akan muncul data dari ESP1/2/3:**
```
ESP1:STATUS:OK,GAS=1234,LAMP=OFF,WIFI=OK
ESP2:STATUS:OK,RAIN=567,CLOTHESLINE=OUT,WIFI=OK
ESP3:STATUS:OK,DOOR=CLOSE,GATE=CLOSE,WIFI=OK
ESP1:GAS:1234
ESP2:RAIN:567
...
```

✅ **Jika data ini muncul = SUKSES!**
❌ **Jika tidak ada data = Cek wiring UART atau upload ESP1/2/3**

---

## 🚨 Troubleshooting Upload

### Error: "A fatal error occurred: Failed to connect"

**Solusi:**
1. Tekan dan tahan tombol **BOOT** di ESP32
2. Click **Upload**
3. Tunggu "Connecting..."
4. Lepas tombol BOOT

### Error: "Port already in use"

**Solusi:**
1. Tutup Serial Monitor
2. Disconnect USB, tunggu 5 detik
3. Reconnect dan coba lagi

### Upload sukses tapi tidak ada output Serial

**Solusi:**
1. Tekan tombol **RESET** di ESP32
2. Cek baud rate Serial Monitor (115200)
3. Cek USB cable (pastikan data cable, bukan charging only)

---

## 📝 Catatan Penting

- [ ] **WiFi SSID/Password** di SEMUA ESP32 harus SAMA
- [ ] **Baud rate UART** antar ESP32 = 9600 baud
- [ ] **Baud rate USB Serial** ESP32-4 = 115200 baud
- [ ] **GND semua ESP32 terhubung** (CRITICAL!)
- [ ] **ESP32-4 tetap terhubung USB** ke komputer (COM8)
- [ ] **ESP32 #1, #2, #3** bisa pakai power terpisah (USB charger)

---

**Setelah semua di-upload, lanjut ke Step 2: Restart Backend**

