# 📘 PANDUAN UPLOAD ESP32-4 - Step by Step

## ✅ PERSIAPAN SUDAH SELESAI!

Files sudah siap di: `C:\Users\NITRO V\Downloads\iot web\IOT-NEW-PAKYU\code iot\esp32-4\`

```
esp32-4/
├── esp32-4.ino         ✅ Firmware
└── data/               ✅ Frontend files untuk LittleFS
    ├── index.html
    ├── assets/
    ├── favicon.svg
    └── icons.svg
```

---

## 🔧 LANGKAH 1: Install Library yang Diperlukan

### A. Buka Arduino IDE

### B. Install Libraries
1. Klik menu **Sketch** → **Include Library** → **Manage Libraries...**
2. Search dan install library berikut:

| Library | Author | Versi | Action |
|---------|--------|-------|--------|
| **ArduinoJson** | Benoit Blanchon | 6.21.5 (atau v6.x) | Install |
| **AsyncTCP** | me-no-dev | 1.1.1 | Install |

### C. Install ESPAsyncWebServer (Manual)

⚠️ Library ini tidak ada di Library Manager, harus install manual!

**Cara Install Manual:**

1. Download ZIP dari GitHub:
   - **ESPAsyncWebServer**: https://github.com/me-no-dev/ESPAsyncWebServer/archive/refs/heads/master.zip
   
2. Extract ZIP file

3. Rename folder dari `ESPAsyncWebServer-master` menjadi `ESPAsyncWebServer`

4. Copy folder tersebut ke:
   ```
   C:\Users\NITRO V\Documents\Arduino\libraries\ESPAsyncWebServer
   ```

5. Restart Arduino IDE

---

## 🔌 LANGKAH 2: Buka Sketch ESP32-4

1. **File** → **Open**
2. Navigate ke: `C:\Users\NITRO V\Downloads\iot web\IOT-NEW-PAKYU\code iot\esp32-4\esp32-4.ino`
3. Klik **Open**

Arduino IDE akan membuka sketch dalam folder `esp32-4/` yang berisi:
- `esp32-4.ino` (firmware)
- `data/` (folder untuk LittleFS)

---

## ⚙️ LANGKAH 3: Konfigurasi Board & Port

1. **Tools** → **Board** → **ESP32 Arduino** → **ESP32 Dev Module**

2. **Tools** → **Port** → **COM8** (atau port USB ESP32-4 Anda)
   - Jika tidak muncul, cabut-colok USB ESP32-4

3. **Settings Board lainnya** (gunakan default):
   ```
   CPU Frequency: 240MHz
   Flash Frequency: 80MHz
   Flash Mode: QIO
   Flash Size: 4MB (32Mb)
   Partition Scheme: Default 4MB with spiffs
   Upload Speed: 921600
   ```

---

## 🔍 LANGKAH 4: Verify/Compile (Cek Error)

1. Klik tombol **✓ Verify** (atau Ctrl+R)

2. Tunggu proses compile (~30 detik)

3. **Expected Output di Console:**
   ```
   Sketch uses XXXX bytes (X%) of program storage space.
   Global variables use XXXX bytes (X%) of dynamic memory.
   ```

4. **Jika ADA ERROR:**
   
   **ERROR: ESPAsyncWebServer.h: No such file or directory**
   → Library ESPAsyncWebServer belum terinstall (ulangi Langkah 1C)
   
   **ERROR: AsyncTCP.h: No such file or directory**
   → Library AsyncTCP belum terinstall (ulangi Langkah 1B)
   
   **ERROR: ArduinoJson.h: No such file or directory**
   → Library ArduinoJson belum terinstall (ulangi Langkah 1B)

---

## 📤 LANGKAH 5: Upload Filesystem (LittleFS)

### A. Install Plugin Upload Filesystem


**Untuk Arduino IDE 1.x (Legacy):**

1. Download plugin: https://github.com/lorol/arduino-esp32fs-plugin/releases
   - File: **ESP32FS-1.1.zip**

2. Extract ke folder:
   ```
   C:\Users\NITRO V\Documents\Arduino\tools\ESP32FS\tool\esp32fs.jar
   ```
   
   Struktur folder harus seperti ini:
   ```
   Arduino/
   └── tools/
       └── ESP32FS/
           └── tool/
               └── esp32fs.jar
   ```

3. **Restart Arduino IDE**

4. Check menu: **Tools** → harus ada menu **ESP32 Sketch Data Upload**

---

**Untuk Arduino IDE 2.x (Recommended):**

1. Download plugin: https://github.com/earlephilhower/arduino-littlefs-upload/releases
   - File: **arduino-littlefs-upload-X.X.X.vsix**

2. Install via Arduino IDE 2.x:
   - Atau manual extract `.vsix` ke folder extensions

3. **Restart Arduino IDE**

4. Check menu: **Tools** → harus ada menu **Upload LittleFS to Pico/ESP8266/ESP32**

---

### B. Upload Filesystem ke ESP32-4

⚠️ **PENTING: Tutup Serial Monitor jika sedang terbuka!**

1. Pastikan ESP32-4 terhubung di **COM8**

2. Klik menu **Tools** → **ESP32 Sketch Data Upload** (IDE 1.x)
   atau **Tools** → **Upload LittleFS to Pico/ESP8266/ESP32** (IDE 2.x)

3. **Tunggu proses upload** (~1-3 menit):
   ```
   LittleFS Creating image...
   LittleFS Adding file: /index.html
   LittleFS Adding file: /assets/index-xxx.js
   LittleFS Adding file: /assets/index-xxx.css
   LittleFS Adding file: /favicon.svg
   LittleFS Adding file: /icons.svg
   LittleFS Image created successfully!
   LittleFS Uploading...
   Hash of data verified.
   LittleFS Upload complete!
   ```

4. **Expected Output:**
   ```
   Leaving...
   Hard resetting via RTS pin...
   ```

✅ **Filesystem berhasil di-upload!**

---

## 🚀 LANGKAH 6: Upload Firmware ESP32-4

1. Klik tombol **→ Upload** (atau Ctrl+U)

2. **Tunggu proses upload** (~30-60 detik):
   ```
   Connecting........_
   Chip is ESP32-D0WDQ6 (revision 1)
   Features: WiFi, BT, Dual Core, 240MHz, VRef calibration in efuse, Coding Scheme None
   Crystal is 40MHz
   MAC: xx:xx:xx:xx:xx:xx
   Uploading stub...
   Running stub...
   Stub running...
   Changing baud rate to 921600
   Changed.
   Writing at 0x00010000... (X %)
   ...
   Leaving...
   Hard resetting via RTS pin...
   ```

3. **Expected Output:**
   ```
   Done uploading.
   ```

✅ **Firmware berhasil di-upload!**

---

## 📡 LANGKAH 7: Cek IP Address ESP32-4

### A. Buka Serial Monitor

1. Klik menu **Tools** → **Serial Monitor**
2. Set **Baud Rate: 115200**
3. Tekan tombol **RESET** di ESP32-4

### B. Lihat Output di Serial Monitor

**Expected Output:**

```
========================================
ESP32-4 Gateway Controller
IoT Smart Home System
========================================

[INFO] USB Serial: 115200 baud (to Backend)
[INFO] UART Serial: 9600 baud (to ESP1/2/3)

[WIFI] Connecting to Wi-Fi...
[WIFI] .......
[WIFI] Connected!
[WIFI] SSID: Wi-Fi
[WIFI] IP Address: 192.168.1.100        ← CATAT IP INI!
[WIFI] Subnet Mask: 255.255.255.0
[WIFI] Gateway: 192.168.1.1

[HTTP] Starting web server...
[HTTP] Web server started on port 80
[HTTP] Access at: http://192.168.1.100  ← AKSES VIA URL INI!

[READY] Gateway is ready!
[INFO] Press BOOT button (GPIO0) to resend WiFi config

Waiting for data from ESP devices...
========================================
```

### C. Catat IP Address

**IP Address ESP32-4: `192.168.1.100`** (contoh, IP Anda mungkin berbeda)

---

## 🌐 LANGKAH 8: Test Akses Website

1. Buka **Browser** (Chrome, Firefox, Edge)

2. Akses URL:
   ```
   http://192.168.1.100
   ```
   (ganti dengan IP yang Anda dapat dari Serial Monitor)

3. **Website IoT Smart Home akan muncul!** 🎉

### Troubleshooting:

**❌ Website tidak muncul / "This site can't be reached"**

**Solusi A: Cek koneksi WiFi**
- Pastikan komputer dan ESP32-4 di **jaringan WiFi yang sama**
- SSID ESP32-4: **"Wi-Fi"** (lihat di firmware line 52)
- Password: **"123456789"**

**Solusi B: Cek filesystem upload**
- Ulangi LANGKAH 5 (Upload Filesystem)
- Pastikan folder `data/` berisi `index.html`

**Solusi C: Cek Serial Monitor**
- Apakah ada error "Failed to mount LittleFS"?
- Upload filesystem ulang

**Solusi D: Ping test**
```cmd
ping 192.168.1.100
```
- Jika "Request timed out" → ESP32-4 tidak terhubung ke WiFi
- Cek SSID dan password WiFi di firmware

---

## 🔄 LANGKAH 9: Update Config Frontend (Opsional)

Jika Anda ingin frontend terhubung langsung ke ESP32-4 (tanpa backend Node.js):

### A. Update Config

Edit file: `frontend/src/config/api.ts` atau sejenisnya

Ganti backend URL dari:
```typescript
export const API_BASE_URL = 'http://localhost:3001';
```

Menjadi:
```typescript
export const API_BASE_URL = 'http://192.168.1.100';  // IP ESP32-4
```

### B. Build Ulang

```bash
cd frontend
npm run build
```

### C. Copy ke data/

```bash
xcopy /E /I /Y "frontend\dist\*" "code iot\esp32-4\data\"
```

### D. Upload Filesystem Lagi

Ulangi **LANGKAH 5** (Upload LittleFS)

---

## ✅ CHECKLIST FINAL

- [ ] Library terinstall (ArduinoJson, AsyncTCP, ESPAsyncWebServer)
- [ ] Sketch ter-compile tanpa error
- [ ] Plugin upload filesystem terinstall
- [ ] Filesystem ter-upload (data/ folder)
- [ ] Firmware ter-upload (esp32-4.ino)
- [ ] Serial Monitor menampilkan IP address
- [ ] Website bisa diakses via browser
- [ ] ESP32 #1, #2, #3 terhubung via UART (status online di website)

---

## 📊 ARSITEKTUR SISTEM (Reminder)

```
Browser
  ↓ HTTP (port 80)
ESP32-4 (192.168.1.100)
  ↓ UART 9600 baud
  ├── GPIO16/17 → ESP32 #1 (Lamp, Gas, Feeder)
  ├── GPIO4/5   → ESP32 #2 (Clothesline, Rain)
  └── GPIO13/15 → ESP32 #3 (Door, Gate, RFID)
```

---

## 🆘 BANTUAN TAMBAHAN

Jika ada masalah, screenshot error dan tanyakan!

**File Penting:**
- Firmware: `code iot/esp32-4/esp32-4.ino`
- Frontend: `code iot/esp32-4/data/`
- Panduan: `PANDUAN_UPLOAD_ESP32-4.md` (file ini)

**Dokumentasi:**
- ESPAsyncWebServer: https://github.com/me-no-dev/ESPAsyncWebServer
- Arduino ESP32: https://docs.espressif.com/projects/arduino-esp32/

---

🚀 **SELAMAT! Anda siap upload ESP32-4!**
