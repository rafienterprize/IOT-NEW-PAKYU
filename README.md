# IoT Smart Home System

Sistem kontrol dan monitoring perangkat rumah berbasis ESP32.

```
Browser → HTTP → ESP4 (Web Server + Gateway) → UART → ESP1 / ESP2 / ESP3 → Hardware
```

---

## Struktur Project

```
project/
├── frontend/          ← React + Vite (website dashboard)
├── code iot/
│   ├── esp32-1.ino    ← Lampu + Gas Sensor + Fish Feeder
│   ├── esp32-2.ino    ← Jemuran + Rain Sensor
│   ├── esp32-3.ino    ← Pintu + Gerbang + RFID
│   └── esp32-4.ino    ← Web Server + Gateway utama
└── backend/           ← (tidak dipakai lagi, arsip)
```

---

## LANGKAH 1 — Install Library Arduino

Buka Arduino IDE → **Library Manager**, install:
- `ESPAsyncWebServer` (me-no-dev)
- `AsyncTCP` (me-no-dev)
- `ArduinoJson` (Benoit Blanchon) versi 6.x
- `ESP32Servo`
- `MFRC522` (untuk ESP3)

> ESPAsyncWebServer mungkin tidak ada di Library Manager.
> Download manual dari: https://github.com/me-no-dev/ESPAsyncWebServer

---

## LANGKAH 2 — Upload Firmware ESP1, ESP2, ESP3

Upload masing-masing file ke ESP yang sesuai:

| File | Upload ke |
|---|---|
| `code iot/esp32-1.ino` | ESP32 #1 |
| `code iot/esp32-2.ino` | ESP32 #2 |
| `code iot/esp32-3.ino` | ESP32 #3 |

Semua sudah terkonfigurasi WiFi `Wi-Fi` / `123456789` dan langsung connect saat boot.

---

## LANGKAH 3 — Build Frontend

```bash
cd frontend
npm install
npm run build
```

Hasil build ada di folder `frontend/dist/`.

---

## LANGKAH 4 — Siapkan Frontend untuk ESP4

1. Buat folder `data/` di dalam `code iot/esp32-4/`:
   ```
   code iot/
     esp32-4/
       esp32-4.ino
       data/          ← buat folder ini
   ```

2. Salin semua isi `frontend/dist/` ke folder `data/` tersebut:
   ```bash
   cp -r frontend/dist/* "code iot/esp32-4/data/"
   ```

---

## LANGKAH 5 — Upload Firmware + Filesystem ESP4

1. **Upload firmware** biasa seperti ESP lainnya.

2. **Upload filesystem** (file frontend ke LittleFS):
   - Arduino IDE: **Tools → ESP32 Sketch Data Upload**
   - Plugin dibutuhkan: https://github.com/lorol/arduino-esp32fs-plugin

---

## LANGKAH 6 — Cari IP ESP4

Buka **Serial Monitor** (baud 115200), reset ESP4, lihat output:
```
[WIFI] Connected!
[WIFI] IP Address: 192.168.1.XXX
[HTTP] Access at: http://192.168.1.XXX
```

---

## LANGKAH 7 — Update IP di Frontend

Edit `frontend/src/config/esp4.ts`:
```typescript
export const ESP4_BASE_URL = 'http://192.168.1.XXX'; // ← ganti dengan IP dari Serial Monitor
```

Ulangi **Langkah 3, 4, 5** (build ulang + upload ulang filesystem).

---

## LANGKAH 8 — Akses Website

Buka browser → `http://192.168.1.XXX`

Website tampil. Semua data sensor dan kontrol device sudah live dari ESP32.

---

## Koneksi Kabel UART ESP4

| ESP4 Pin | Hubungkan ke | Keterangan |
|---|---|---|
| GPIO 16 (RX) | TX ESP1 GPIO 17 | Data dari ESP1 |
| GPIO 17 (TX) | RX ESP1 GPIO 16 | Perintah ke ESP1 |
| GPIO 4  (RX) | TX ESP2 GPIO 17 | Data dari ESP2 |
| GPIO 5  (TX) | RX ESP2 GPIO 16 | Perintah ke ESP2 |
| GPIO 13 (RX) | TX ESP3 GPIO 17 | Data dari ESP3 |
| GPIO 15 (TX) | RX ESP3 GPIO 16 | Perintah ke ESP3 |

> TX ESP4 → RX ESP1/2/3, dan TX ESP1/2/3 → RX ESP4 (cross).

---

## GitHub — Masalah Invalid Token

Buat Personal Access Token baru:
1. GitHub → Settings → Developer settings → Personal access tokens → Generate new token
2. Centang scope `repo`
3. Copy token
4. Jalankan di terminal:
   ```bash
   git remote set-url origin https://<TOKEN>@github.com/<username>/<repo>.git
   git push origin fetch
   ```
