# ⚡ Upload Checklist - Langsung Upload!

Kode sudah SIAP, langsung upload saja!

---

## 📤 **ESP32 #1 - Lamp & Gas**

```
1. Hubungkan ESP32 #1 ke USB
2. Arduino IDE → File → Open → esp32-1.ino
3. Tools → Board → ESP32 Dev Module
4. Tools → Port → (pilih COM yang baru muncul)
5. Upload (→)
6. Tunggu "Done uploading"
```

**Serial Monitor Output:**
```
========================================
ESP32 #1 - Lamp & Gas Sensor
========================================
[READY] Waiting for WiFi config from ESP32-4...
Kirim -> ESP1:SYSTEM:READY
Kirim -> ESP1:STATUS:OK,GAS=1200,LAMP=OFF,WIFI=NO
```

✅ **Cabut USB, power dengan USB charger**

---

## 📤 **ESP32 #2 - Clothesline & Rain**

```
1. Hubungkan ESP32 #2 ke USB
2. Arduino IDE → File → Open → esp32-2.ino
3. Tools → Port → (pilih COM yang baru)
4. Upload (→)
```

**Serial Monitor Output:**
```
========================================
ESP32 #2 - Clothesline & Rain Sensor
========================================
[READY] Waiting for WiFi config from ESP32-4...
Kirim -> ESP2:SYSTEM:READY
Kirim -> ESP2:STATUS:OK,RAIN=567,CLOTHESLINE=OUT,WIFI=NO
```

✅ **Cabut USB, power dengan USB charger**

---

## 📤 **ESP32 #3 - Door & Gate & RFID**

```
1. Hubungkan ESP32 #3 ke USB
2. Arduino IDE → File → Open → esp32-3.ino
3. Tools → Port → (pilih COM yang baru)
4. Upload (→)
```

**Serial Monitor Output:**
```
========================================
ESP32 #3 - Door, Gate & RFID
========================================
[READY] Waiting for WiFi config from ESP32-4...
[INFO] RFID Ready - Scan card to open door
Kirim -> ESP3:SYSTEM:READY
Kirim -> ESP3:STATUS:OK,DOOR=CLOSE,GATE=CLOSE,WIFI=NO
```

✅ **Cabut USB, power dengan USB charger**

---

## 📤 **ESP32 #4 - Gateway (COM8)**

ESP32-4 **SUDAH SIAP** (TEST_MODE=false)!

```
1. ESP32-4 masih di COM8
2. Arduino IDE → esp32-4.ino (sudah terbuka)
3. Upload (→)
```

**Serial Monitor Output:**
```
========================================
ESP32-4 Gateway Controller
========================================
[READY] Gateway is ready!
[GATEWAY] Sending WiFi config to all ESP devices...
[GATEWAY] WiFi sent to ESP1
[GATEWAY] WiFi sent to ESP2

// Tunggu 5-10 detik...

ESP1:SYSTEM:READY
ESP2:SYSTEM:READY
ESP3:SYSTEM:READY
ESP1:STATUS:OK,GAS=1234,LAMP=OFF,WIFI=OK
ESP2:STATUS:OK,RAIN=567,CLOTHESLINE=OUT,WIFI=OK
ESP3:STATUS:OK,DOOR=CLOSE,GATE=CLOSE,WIFI=OK
```

✅ **DATA MASUK = SUKSES!**

---

## 🔌 **Wiring UART (Jangan Lupa!)** 

```
ESP1 TX(17) ──> ESP4 RX(16)
ESP1 RX(16) <── ESP4 TX(17)
ESP1 GND   ──> ESP4 GND

ESP2 TX ──────> ESP4 RX(4)
ESP2 RX <────── ESP4 TX(5)
ESP2 GND  ────> ESP4 GND

ESP3 TX ──────> ESP4 RX(2)
ESP3 RX <────── ESP4 TX(18)
ESP3 GND  ────> ESP4 GND

🔥 SEMUA GND HARUS TERHUBUNG!
```

---

## 🌐 **Website**

**Restart Backend:**
```cmd
taskkill /F /IM node.exe
cd backend
npm start
```

**Buka Browser:**
```
http://localhost:5173
```

✅ **SEMUA ESP32 CONNECTED (HIJAU)!** 🎉

---

**Kode sudah benar, tinggal upload!** 🚀
