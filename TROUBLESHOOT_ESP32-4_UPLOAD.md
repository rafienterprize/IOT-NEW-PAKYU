# 🔧 TROUBLESHOOT ESP32-4 Upload - Solusi Error

## ❌ ERROR 1: "Library not found"

### Error Message:
```
fatal error: ESPAsyncWebServer.h: No such file or directory
fatal error: AsyncTCP.h: No such file or directory
fatal error: ArduinoJson.h: No such file or directory
```

### Solusi:

**A. Install ArduinoJson & AsyncTCP:**
1. Arduino IDE → Sketch → Include Library → Manage Libraries
2. Search "ArduinoJson" → Install (v6.x, NOT v7!)
3. Search "AsyncTCP" → Install
4. Restart Arduino IDE

**B. Install ESPAsyncWebServer (Manual):**
1. Download: https://github.com/me-no-dev/ESPAsyncWebServer/archive/refs/heads/master.zip
2. Extract ZIP
3. Rename folder: `ESPAsyncWebServer-master` → `ESPAsyncWebServer`
4. Copy ke: `C:\Users\NITRO V\Documents\Arduino\libraries\ESPAsyncWebServer`
5. Restart Arduino IDE
6. Verify: `Sketch → Include Library` → harus ada ESPAsyncWebServer

---

## ❌ ERROR 2: "Port not found" / "COM8 not available"

### Solusi:

**A. Cek Device Manager:**
1. Windows Key + X → Device Manager
2. Ports (COM & LPT) → Cari "USB-SERIAL CH340" atau "CP210x"
3. Catat nomor COM port (misalnya COM3, COM8, dll)
4. Arduino IDE → Tools → Port → Pilih port yang benar

**B. Install Driver:**
- CH340: https://github.com/nodemcu/nodemcu-devkit/tree/master/Drivers
- CP210x: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers

**C. Cabut-Colok USB:**
1. Cabut kabel USB ESP32-4
2. Tunggu 5 detik
3. Colok lagi
4. Refresh port di Arduino IDE

---

## ❌ ERROR 3: "A fatal error occurred: Failed to connect"

### Error Message:
```
Connecting........_____....._____
A fatal error occurred: Failed to connect to ESP32: Timed out waiting for packet header
```

### Solusi:

**A. Tekan BOOT saat Upload:**
1. Click Upload button
2. Tunggu muncul "Connecting........"
3. **Tekan dan TAHAN tombol BOOT** di ESP32-4
4. Lepas setelah muncul "Writing at 0x00010000"

**B. Cek Kabel USB:**
- Gunakan kabel USB **data**, bukan kabel charge-only
- Coba kabel USB lain

**C. Ganti Upload Speed:**
- Tools → Upload Speed → 115200 (coba speed lebih rendah)

---

## ❌ ERROR 4: "Sketch Data Upload" menu tidak ada

### Solusi:

**Untuk Arduino IDE 1.x:**
1. Download: https://github.com/lorol/arduino-esp32fs-plugin/releases
2. Extract `ESP32FS-1.1.zip`
3. Copy folder `ESP32FS` ke:
   ```
   C:\Users\NITRO V\Documents\Arduino\tools\ESP32FS\
   ```
4. Struktur harus:
   ```
   Arduino\
   └── tools\
       └── ESP32FS\
           └── tool\
               └── esp32fs.jar
   ```
5. **Restart Arduino IDE**
6. Check: Tools → ESP32 Sketch Data Upload (harus muncul)

**Untuk Arduino IDE 2.x:**
1. Download: https://github.com/earlephilhower/arduino-littlefs-upload/releases
2. File: `arduino-littlefs-upload-X.X.X.vsix`
3. Install via IDE atau manual

---

## ❌ ERROR 5: "Failed to mount LittleFS"

### Serial Monitor Output:
```
[ERROR] Failed to mount LittleFS!
[HTTP] Starting web server...
```

### Solusi:

**A. Upload Filesystem Lagi:**
1. Tutup Serial Monitor
2. Tools → ESP32 Sketch Data Upload
3. Tunggu sampai selesai
4. Open Serial Monitor → Press RESET

**B. Partition Scheme:**
1. Tools → Partition Scheme → **Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)**
2. Upload firmware lagi
3. Upload filesystem lagi

---

## ❌ ERROR 6: Website tidak muncul (404 / blank)

### Browser Error:
```
This site can't be reached
ERR_CONNECTION_REFUSED
```

### Solusi:

**A. Cek IP Address:**
1. Serial Monitor → Lihat "IP Address: 192.168.1.xxx"
2. Browser → http://192.168.1.xxx (gunakan IP yang benar)

**B. Cek WiFi:**
- Komputer dan ESP32-4 harus di **WiFi yang sama**
- ESP32-4 connect ke SSID: "Wi-Fi" (password: "123456789")
- Jika SSID berbeda, edit firmware line 52-53

**C. Ping Test:**
```cmd
ping 192.168.1.xxx
```
- Jika "Reply" → ESP32-4 online, masalah di filesystem
- Jika "Request timed out" → ESP32-4 tidak terhubung WiFi

**D. Upload Filesystem Lagi:**
- Pastikan folder `data/` berisi `index.html`
- Tools → ESP32 Sketch Data Upload
- Upload ulang

---

## ❌ ERROR 7: All devices offline di website

### Solusi:

**A. Cek UART Wiring:**
```
ESP1 TX (GPIO ??) → ESP4 RX (GPIO 16)
ESP1 GND         → ESP4 GND  ⚠️ WAJIB!

ESP2 TX (GPIO ??) → ESP4 RX (GPIO 4)
ESP2 GND         → ESP4 GND  ⚠️ WAJIB!

ESP3 TX (GPIO ??) → ESP4 RX (GPIO 13)
ESP3 GND         → ESP4 GND  ⚠️ WAJIB!
```

**B. Upload Firmware ESP1/2/3:**
- Upload `esp32-1.ino` ke ESP32 #1
- Upload `esp32-2.ino` ke ESP32 #2
- Upload `esp32-3.ino` ke ESP32 #3

**C. Cek Serial Monitor ESP4:**
```
[UART ESP1] ESP1:STATUS:OK,GAS=1234,...  ← Harus ada
[UART ESP2] ESP2:STATUS:OK,RAIN=567,...  ← Harus ada
[UART ESP3] ESP3:STATUS:OK,DOOR=CLOSE,... ← Harus ada
```

Jika tidak ada → masalah UART wiring atau ESP1/2/3 tidak running

---

## ❌ ERROR 8: "Brownout detector was triggered"

### Serial Monitor Output:
```
Brownout detector was triggered
```

### Solusi:

**A. Power Supply:**
- Gunakan kabel USB berkualitas baik
- Coba port USB lain di komputer
- Atau gunakan power adapter 5V 2A

**B. Disable Brownout:**
Edit firmware, tambahkan di `setup()`:
```cpp
// Disable brownout detector (not recommended)
WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
```

---

## ❌ ERROR 9: Compile error setelah install library

### Error Message:
```
multiple definition of `xxx`
conflicting declaration 'xxx'
```

### Solusi:

**A. Versi Library:**
- ArduinoJson: Gunakan v6.x (NOT v7!)
- AsyncTCP: v1.1.1
- ESPAsyncWebServer: Latest dari GitHub

**B. Remove Duplicate:**
1. Check: `Documents\Arduino\libraries\`
2. Hapus library duplikat atau versi lama

**C. Clean Build:**
1. Arduino IDE → Sketch → Show Sketch Folder
2. Hapus folder `build\`
3. Verify/Compile ulang

---

## ✅ SUCCESS CHECKLIST

Jika semua berhasil, Serial Monitor harus menampilkan:

```
========================================
ESP32-4 Gateway Controller
========================================
[WIFI] Connected!
[WIFI] IP Address: 192.168.1.xxx
[HTTP] Access at: http://192.168.1.xxx
[READY] Gateway is ready!
========================================
```

Dan browser bisa akses: `http://192.168.1.xxx` ✅

---

## 📞 MASIH ADA MASALAH?

1. Screenshot error message
2. Copy Serial Monitor output
3. Catat step yang gagal
4. Tanyakan!

---

**Good luck! 🚀**
