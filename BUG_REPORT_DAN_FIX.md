# 🐛 BUG REPORT & FIX - IoT Smart Home

## 🔴 MASALAH UTAMA DITEMUKAN

### **BUG #1: Frontend Hardcode IP Address (CRITICAL)**

**File:** `frontend/src/config/esp4.ts` line 20

**Before (SALAH):**
```typescript
export const ESP4_BASE_URL = 'http://192.168.1.100';  // ❌ HARDCODED
```

**Problem:**
- IP `192.168.1.100` di-hardcode di config
- Ketika frontend di-build, IP ini masuk ke JavaScript bundle
- Saat user akses ESP32-4 di IP **berbeda** (misal 192.168.1.105):
  - Website bisa kebuka (HTML loaded)
  - Tapi API calls ke `192.168.1.100` (IP salah!)
  - Device status tidak muncul
  - Semua fitur tidak bekerja

**After (FIXED ✅):**
```typescript
export const ESP4_BASE_URL = 
  typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? '' // Production: same origin (ESP32-4)
    : 'http://localhost:3001'; // Development: Node.js backend
```

**Cara Kerja Fix:**
- Jika akses via localhost → pakai `http://localhost:3001` (development mode)
- Jika akses via IP ESP32-4 → pakai empty string `` (relative URL)
- Relative URL otomatis gunakan IP yang sama dengan website

**Contoh:**
- User akses: `http://192.168.1.105/`
- API call ke: `http://192.168.1.105/status` ✅ (benar!)

---

## ✅ **SOLUSI YANG SUDAH DILAKUKAN**

### 1. ✅ Fix Frontend Config
```bash
# File sudah diperbaiki: frontend/src/config/esp4.ts
# IP hardcode dihapus, pakai relative URL
```

### 2. ✅ Rebuild Frontend
```bash
cd frontend
npm run build
# Output: dist/assets/index-ChCr6obk.js (NEW BUILD!)
```

### 3. ✅ Copy ke ESP32-4 Data Folder
```bash
# Files baru sudah di-copy ke: code iot/esp32-4/data/
```

---

## 📋 **FILE YANG SUDAH DIPERBAIKI**

| File | Status | Perubahan |
|------|--------|-----------|
| `frontend/src/config/esp4.ts` | ✅ FIXED | Hapus hardcode IP, pakai relative URL |
| `frontend/dist/assets/index-*.js` | ✅ REBUILT | Bundle baru dengan fix |
| `code iot/esp32-4/data/` | ✅ UPDATED | Files baru sudah di-copy |

---

## 🎯 **NEXT STEP - YANG HARUS ANDA LAKUKAN**

### **STEP 1: Upload Filesystem Lagi** ⚠️ PENTING!

**Karena frontend sudah di-rebuild, filesystem harus di-upload ulang!**

1. **Buka Arduino IDE**
2. **Open sketch:** `code iot/esp32-4/esp32-4.ino`
3. **Tutup Serial Monitor** (jika terbuka)
4. **Tools → ESP32 Sketch Data Upload** (atau Upload LittleFS)
5. **Tunggu** ~2-3 menit sampai selesai
6. **Expected output:**
   ```
   LittleFS Upload complete!
   Hard resetting via RTS pin...
   ```

---

### **STEP 2: Get IP Address ESP32-4**

1. **Open Serial Monitor** (115200 baud)
2. **Press RESET** button di ESP32-4
3. **Catat IP Address:**
   ```
   [WIFI] IP Address: 192.168.1.XXX  ← CATAT INI!
   ```

---

### **STEP 3: Test Website**

1. **Buka browser**
2. **Akses:** `http://192.168.1.XXX` (IP dari step 2)
3. **Website akan muncul!** 🎉

**Expected:**
- ✅ Dashboard muncul
- ✅ Device cards terlihat
- ✅ Tidak ada error di browser console (F12)
- ✅ API calls bekerja (device status muncul)

---

## 🔍 **CARA KERJA SISTEM (Setelah Fix)**

### **Mode Production (ESP32-4 Standalone)**

```
Browser
  ↓ http://192.168.1.105/
ESP32-4 Web Server (LittleFS)
  → Serve index.html, JS, CSS
  ↓
Browser Execute JavaScript
  → API call: GET /status (relative URL)
  ↓ http://192.168.1.105/status
ESP32-4 API Handler
  → Return JSON: { devices: [...] }
  ↓
Frontend Update UI
  → Dashboard shows device status ✅
```

**Key Points:**
- Frontend dan API di server yang **sama** (ESP32-4)
- Tidak perlu hardcode IP
- Relative URL otomatis gunakan IP yang benar

---

### **Mode Development (Vite + Node.js)**

```
Browser
  ↓ http://localhost:5173/
Vite Dev Server
  → Serve HTML, Hot Reload
  ↓
Frontend API call
  ↓ http://localhost:3001/status
Node.js Backend
  ↓ Serial COM8
ESP32-4 → ESP1/2/3 (UART)
```

**Key Points:**
- Vite dev server di port 5173
- Node.js backend di port 3001
- ESP32-4 via USB serial

---

## 🐛 **BUG LAIN YANG DITEMUKAN (Minor)**

### **BUG #2: Duplicate esp32-4.ino**

**Location:**
- `code iot/esp32-4.ino` (old location)
- `code iot/esp32-4/esp32-4.ino` (correct location)

**Status:** ✅ NOT A PROBLEM
- Yang benar: `esp32-4/esp32-4.ino` (sudah dipakai)
- Yang lama bisa dihapus (optional)

---

### **BUG #3: Documentation Gap**

**File:** `CARA_DEPLOY_FRONTEND_KE_ESP4.md`

**Missing:**
- Tidak mention masalah hardcode IP
- Tidak explain perbedaan mode development vs production

**Status:** ⏳ COULD BE IMPROVED
- Masih bisa dipakai
- Tapi tidak lengkap

---

## ✅ **VERIFICATION CHECKLIST**

Setelah upload filesystem, cek:

### **1. Serial Monitor Output**

```
[LittleFS] OK                          ✅
[WIFI] Connected!                      ✅
[WIFI] IP Address: 192.168.1.XXX      ✅
[HTTP] Access at: http://...          ✅
[READY] Gateway is ready!              ✅
```

### **2. Browser Access**

```
✅ Website muncul (tidak blank)
✅ Dashboard layout lengkap
✅ Device cards terlihat
✅ No 404 errors di console
```

### **3. Browser Console (F12 → Console)**

```
✅ No CORS errors
✅ No "Failed to fetch" errors
✅ API calls return data
✅ Device status update
```

### **4. Functionality Test**

```
✅ Click "Lamp ON" → works
✅ Sensor chart shows data
✅ WiFi config works
✅ RFID whitelist works
```

---

## 🆘 **TROUBLESHOOTING**

### **Problem: Website masih blank setelah fix**

**Solusi:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Try incognito/private mode

---

### **Problem: API calls masih error**

**Cek di browser console (F12):**

**Error:** `Failed to fetch http://192.168.1.100/status`
- **Cause:** Filesystem belum di-upload ulang
- **Fix:** Upload filesystem lagi (Arduino IDE → Tools → ESP32 Sketch Data Upload)

**Error:** `CORS policy`
- **Cause:** ESP32-4 firmware issue (rare)
- **Fix:** Upload firmware ulang

---

### **Problem: IP Address tidak muncul di Serial Monitor**

**Check:**
1. WiFi credentials benar? (esp32-4.ino line 70-71)
2. WiFi router online?
3. ESP32-4 dalam jangkauan WiFi?

**Fix:**
```cpp
// Edit esp32-4.ino
#define WIFI_SSID     "NAMA_WIFI_ANDA"
#define WIFI_PASSWORD "PASSWORD_WIFI_ANDA"
```
Upload firmware ulang.

---

## 📊 **SUMMARY**

### **Root Cause:**
Frontend hardcode IP address → tidak bisa akses ESP32-4 dengan IP berbeda

### **Fix Applied:**
✅ Frontend config pakai relative URL  
✅ Frontend di-rebuild dengan fix  
✅ Files baru di-copy ke esp32-4/data/  

### **User Action Required:**
⏳ Upload filesystem lagi (Arduino IDE)  
⏳ Test website di browser  

---

## 🎉 **EXPECTED RESULT**

Setelah upload filesystem:

```
Browser → http://192.168.1.XXX
         → Website muncul! ✅
         → Device status muncul! ✅
         → Semua fitur bekerja! ✅
```

---

**SEKARANG UPLOAD FILESYSTEM VIA ARDUINO IDE!** 🚀

**Tools → ESP32 Sketch Data Upload**
