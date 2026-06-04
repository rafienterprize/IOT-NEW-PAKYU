---
inclusion: always
---

# IoT Smart Home — Konteks Project untuk Kiro

## Gambaran Besar

Project ini adalah sistem **monitoring dan kontrol rumah pintar berbasis ESP32**.
User membuka website di browser, melihat status sensor, dan mengontrol perangkat fisik secara real-time.

Tidak ada backend server Node.js. Tidak ada database. Sistem berjalan murni:
- **Frontend** (React static) — dihosting langsung di ESP32 #4
- **ESP32 #4** — web server + gateway
- **ESP32 #1/2/3** — controller hardware

---

## Arsitektur Sistem

```
Browser
  │
  │  HTTP fetch (polling setiap 3 detik)
  ▼
ESP32 #4  ← Web Server (port 80) + Gateway
  │  IP: lihat Serial Monitor setelah boot
  │
  │  UART 9600 baud (kabel fisik, cross TX↔RX)
  ├── GPIO16/17 ←→ ESP32 #1  (Lampu + Gas Sensor + Fish Feeder)
  ├── GPIO4/5   ←→ ESP32 #2  (Jemuran + Rain Sensor)
  └── GPIO13/15 ←→ ESP32 #3  (Pintu + Gerbang + RFID)
```

**Aturan komunikasi yang tidak boleh dilanggar:**
- Frontend HANYA boleh kirim request ke ESP4
- Frontend TIDAK BOLEH langsung ke ESP1, ESP2, atau ESP3
- ESP1/2/3 TIDAK PUNYA web server — mereka hanya punya UART

---

## Struktur Folder

```
project/
├── frontend/                    ← React + Vite + TypeScript
│   └── src/
│       ├── config/esp4.ts       ← SATU-SATUNYA tempat ubah IP ESP4
│       ├── services/esp4Api.ts  ← SEMUA HTTP request ke ESP4 ada di sini
│       ├── hooks/               ← useDeviceStatus, useSensorData, useCommand
│       ├── pages/               ← Dashboard, ESP1, ESP2, ESP3, Settings
│       └── components/          ← UI komponen (JANGAN diubah tampilannya)
│
├── code iot/
│   ├── esp32-1.ino              ← Firmware ESP1
│   ├── esp32-2.ino              ← Firmware ESP2
│   ├── esp32-3.ino              ← Firmware ESP3
│   └── esp32-4.ino              ← Firmware ESP4 (web server + gateway)
│
├── README.md                    ← Panduan deploy lengkap
└── CARA_DEPLOY_FRONTEND_KE_ESP4.md  ← Detail teknis deploy
```

---

## Frontend — Penjelasan Detail

### Tech Stack
- React 19 + TypeScript + Vite
- Tailwind CSS (dark theme, gray-900 background)
- Recharts (grafik sensor)
- react-router-dom (routing SPA)
- Lucide React (icons)
- **Tidak ada** axios, socket.io, Redux, atau state management eksternal

### Halaman
| Route | File | Fungsi |
|---|---|---|
| `/` | `pages/Dashboard.tsx` | Overview semua device, chart sensor gas & hujan, WiFi config, log sistem |
| `/esp1` | `pages/ESP1.tsx` | Kontrol lampu, dispense feeder, gauge + chart gas sensor |
| `/esp2` | `pages/ESP2.tsx` | Kontrol jemuran IN/OUT, toggle auto mode, gauge + chart rain sensor |
| `/esp3` | `pages/ESP3.tsx` | Kontrol pintu & gerbang, manajemen RFID whitelist, log scan RFID |
| `/settings` | `pages/Settings.tsx` | Info konfigurasi ESP4, kirim WiFi config |

### Layer Data (urutan dari UI ke hardware)
```
Komponen/Page
  → Hook (useDeviceStatus / useSensorData / useCommand)
    → esp4Api.ts (service layer, semua fetch di sini)
      → config/esp4.ts (ESP4_BASE_URL + endpoint list)
        → HTTP request ke ESP4
```

### Cara kerja polling
- `useDeviceStatus` — GET `/status` setiap 3 detik
- `useSensorData` — GET `/sensor/gas` atau `/sensor/rain` setiap 3 detik
- Dashboard/ESP pages — GET `/logs` setiap 3 detik

### Satu-satunya file yang perlu diubah untuk ganti IP
```typescript
// frontend/src/config/esp4.ts
export const ESP4_BASE_URL = 'http://192.168.1.100'; // ← ganti ini
```

---

## Firmware ESP1 — Penjelasan

**File:** `code iot/esp32-1.ino`

**Hardware yang dikontrol:**
- GPIO 23 → Relay Smart Lamp
- GPIO 18 → Servo Fish Feeder
- GPIO 34 → Gas Sensor (ADC, max 4095)

**UART ke ESP4:** RX=GPIO16, TX=GPIO17 @9600 baud

**Command diterima dari ESP4:**
```
LAMP:ON        → relay HIGH
LAMP:OFF       → relay LOW
FEED           → servo 90° selama 700ms lalu balik 0°
WIFI:ssid,pass → reconnect WiFi
```

**Data dikirim ke ESP4 (format `ESP1:TYPE:MESSAGE`):**
```
ESP1:STATUS:OK,GAS=1234,LAMP=ON,WIFI=OK   ← setiap 3 detik
ESP1:GAS:ALERT                            ← saat gas > 1800
ESP1:LAMP:ON / ESP1:LAMP:OFF
ESP1:FEEDER:DONE
ESP1:SYSTEM:READY
```

**WiFi:** hardcode `Wi-Fi` / `123456789`, auto-connect saat boot

---

## Firmware ESP2 — Penjelasan

**File:** `code iot/esp32-2.ino`

**Hardware yang dikontrol:**
- GPIO 35 → Rain Sensor (ADC)
- GPIO 4  → Clothesline Servo
- GPIO 2  → Rain Buzzer

**UART ke ESP4:** RX=GPIO16, TX=GPIO17 @9600 baud

**Logika otomatis (tidak perlu command dari ESP4):**
- Rain > 1600 AND jemuran OUT → servo 90°, kirim RAIN:ALERT_CLOTHESLINE_IN
- Rain ≤ 1600 AND jemuran IN  → servo 0°,  kirim RAIN:CLEAR_CLOTHESLINE_OUT
- Buzzer beep non-blocking setiap 800ms saat hujan

**Command diterima dari ESP4:**
```
CLOTHESLINE:IN    → servo 90°
CLOTHESLINE:OUT   → servo 0°
WIFI:ssid,pass    → reconnect WiFi
```

**Data dikirim ke ESP4:**
```
ESP2:STATUS:OK,RAIN=800,CLOTHESLINE=OUT,WIFI=OK  ← setiap 3 detik
ESP2:RAIN:ALERT_CLOTHESLINE_IN
ESP2:RAIN:CLEAR_CLOTHESLINE_OUT
```

---

## Firmware ESP3 — Penjelasan

**File:** `code iot/esp32-3.ino`

**Hardware yang dikontrol:**
- GPIO 13 → Door Servo
- GPIO 14 → Door IR Sensor
- GPIO 15 → Door Buzzer
- GPIO 25 → Gate Servo Left
- GPIO 26 → Gate Servo Right
- GPIO 32 → Gate IR Sensor
- GPIO 21/22/23/19/18 → RFID RC522 (SS/RST/MOSI/MISO/SCK)

**UART ke ESP4:** RX=GPIO16, TX=GPIO17 @9600 baud

**Logika otomatis:**
- IR Door LOW → buka pintu otomatis
- IR Gate LOW → buka gate otomatis
- Pintu terbuka > 3000ms → tutup otomatis
- Gate terbuka  > 4000ms → tutup otomatis
- Scan RFID → kirim UID ke ESP4, buka pintu (sementara semua kartu valid)

**Command diterima dari ESP4:**
```
DOOR:OPEN / DOOR:CLOSE
GATE:OPEN / GATE:CLOSE
WIFI:ssid,pass
```

**Data dikirim ke ESP4:**
```
ESP3:STATUS:OK,DOOR=CLOSE,GATE=CLOSE,WIFI=OK  ← setiap 3 detik
ESP3:RFID:A1B2C3D4                            ← saat kartu di-scan
ESP3:DOOR:OPEN / ESP3:DOOR:CLOSE
ESP3:GATE:OPEN / ESP3:GATE:CLOSE
```

---

## Firmware ESP4 — Penjelasan

**File:** `code iot/esp32-4.ino`

**Peran:** Web Server HTTP + Gateway UART + State Manager

**Dependencies Arduino (install via Library Manager):**
- `ESPAsyncWebServer` (me-no-dev) — async HTTP server
- `AsyncTCP` (me-no-dev) — async TCP layer
- `ArduinoJson` v6.x (Benoit Blanchon) — JSON serialisasi
- LittleFS (built-in ESP32 Arduino core)

**PIN:**
```
UART ESP1:  RX=GPIO16, TX=GPIO17
UART ESP2:  RX=GPIO4,  TX=GPIO5
UART ESP3:  RX=GPIO13, TX=GPIO15
LED ESP1:   GPIO21
LED ESP2:   GPIO22
LED ESP3:   GPIO23
LED System: GPIO19 (blink tanda ESP4 running)
Buzzer:     GPIO14
Button:     GPIO0 (tekan → kirim ulang WiFi config ke semua ESP)
```

**Cara kerja state:**
ESP4 menyimpan state semua device di RAM (struct `DeviceState devices[4]`).
Setiap data UART masuk dari ESP1/2/3 di-parse dan state di-update.
Frontend polling GET `/status` → ESP4 return state RAM sebagai JSON.

**RFID Whitelist:**
Disimpan di LittleFS file `/rfid_whitelist.json`. Persistent saat restart.
Kelola lewat frontend halaman ESP3.

**Auto Mode:**
Saat `autoModeEnabled = true` dan `rainValue > 1600`, ESP4 kirim `CLOTHESLINE:IN` ke ESP2.

**Endpoint API yang disediakan ESP4:**
```
GET  /status              → status semua 4 device
GET  /sensor/gas          → { value: number } dari ESP1
GET  /sensor/rain         → { value: number } dari ESP2
GET  /logs?esp=1&limit=50 → log sistem per device
POST /command             → { target:1|2|3, command:"LAMP:ON" }
POST /wifi                → { ssid, password, target? }
GET  /automode            → { enabled: boolean }
POST /automode            → { enabled: true|false }
GET  /rfid/whitelist      → daftar UID yang diizinkan
POST /rfid/whitelist      → tambah UID
DELETE /rfid/whitelist/:uid → hapus UID
GET  /rfid/scans          → log scan RFID terbaru
GET  /*                   → serve index.html (SPA fallback)
```

**Frontend hosting:**
File frontend hasil `npm run build` (folder `dist/`) diletakkan di folder `data/` sketch ESP4.
Di-upload ke ESP4 menggunakan LittleFS filesystem upload.

---

## WiFi Configuration

Semua ESP menggunakan WiFi yang sama:
- **SSID:** `Wi-Fi`
- **Password:** `123456789`

Hardcode di setiap firmware. Bisa di-update runtime lewat frontend (Settings page → Send WiFi Config).

---

## Aturan untuk Kiro

### JANGAN lakukan ini:
- Ubah tampilan UI (layout, warna, spacing, typography, animasi)
- Tambah backend Node.js / Express / database
- Buat ESP1/2/3 jadi web server
- Hardcode IP di banyak tempat (selalu pakai `config/esp4.ts`)
- Import axios atau socket.io (sudah dihapus)
- Buat fetch langsung di komponen (selalu lewat `esp4Api.ts`)

### BOLEH lakukan ini:
- Ubah IP di `frontend/src/config/esp4.ts`
- Tambah endpoint baru di `esp4Api.ts` + `esp32-4.ino` secara bersamaan
- Tambah device baru dengan pola yang sama (ESP5, dst)
- Ubah threshold sensor di `config/esp4.ts`
- Ubah polling interval di `config/esp4.ts`
- Fix bug di logic layer tanpa mengubah UI

### Pola yang harus diikuti saat tambah fitur:
1. Tambah endpoint di `esp32-4.ino` (setupApiRoutes)
2. Tambah fungsi di `frontend/src/services/esp4Api.ts`
3. Tambah hook atau gunakan langsung di page
4. Jangan ubah komponen visual

---

## Deploy Checklist (urutan wajib)

1. `cd frontend && npm run build`
2. Copy `frontend/dist/*` → `code iot/esp32-4/data/`
3. Upload firmware ESP4 via Arduino IDE
4. Upload filesystem ESP4 via Tools → ESP32 Sketch Data Upload
5. Buka Serial Monitor → catat IP address
6. Edit `frontend/src/config/esp4.ts` → ganti IP
7. Ulangi step 1-4
8. Buka browser → `http://<IP_ESP4>`
