# Cara Deploy Frontend ke ESP4 (LittleFS)

## Arsitektur Lengkap

```
Browser
  │
  │  HTTP (port 80)
  ▼
ESP32 #4  (Web Server + Gateway)
  │ IP: cek Serial Monitor setelah boot
  │
  │  UART 9600 baud
  ├──► GPIO16/17 → ESP32 #1  (Lamp, Gas, Feeder)
  ├──► GPIO4/5  → ESP32 #2  (Clothesline, Rain)
  └──► GPIO13/15 → ESP32 #3  (Door, Gate, RFID)
```

---

## Langkah 1 — Build Frontend

```bash
cd frontend
npm install
npm run build
```

Hasil build ada di folder `frontend/dist/`.

---

## Langkah 2 — Siapkan folder `data/`

Buat folder `data/` di dalam folder sketch ESP4:

```
code iot/
  esp32-4/            ← buat folder ini jika belum ada
    esp32-4.ino       ← firmware ESP4
    data/             ← isi dengan hasil build frontend
      index.html
      assets/
        index-xxx.js
        index-xxx.css
      favicon.svg
      icons.svg
```

Salin semua isi `frontend/dist/` ke `code iot/esp32-4/data/`:

```bash
cp -r frontend/dist/* "code iot/esp32-4/data/"
```

> **Catatan:** Arduino IDE mengharuskan file `.ino` dan folder `data/`
> berada dalam folder dengan nama yang sama dengan file `.ino`.
> Jadi file harus ada di `esp32-4/esp32-4.ino` dan folder `esp32-4/data/`.

---

## Langkah 3 — Install Plugin Filesystem Upload

### Untuk Arduino IDE 1.x:
1. Download plugin: https://github.com/lorol/arduino-esp32fs-plugin
2. Ekstrak ke `Arduino/tools/ESP32FS/tool/esp32fs.jar`
3. Restart Arduino IDE
4. Menu: **Tools → ESP32 Sketch Data Upload**

### Untuk Arduino IDE 2.x:
1. Install plugin: https://github.com/earlephilhower/arduino-littlefs-upload
2. Ikuti instruksi di README plugin tersebut

### Untuk PlatformIO:
```bash
pio run --target uploadfs
```

---

## Langkah 4 — Upload Firmware + Filesystem

1. **Upload firmware** biasa dulu:
   - Pilih board: ESP32 Dev Module
   - Pilih port COM yang benar
   - Klik Upload

2. **Upload filesystem** (LittleFS):
   - Arduino IDE: **Tools → ESP32 Sketch Data Upload**
   - Tunggu proses selesai

> Upload filesystem dan firmware bisa dilakukan dalam urutan apapun.

---

## Langkah 5 — Cek IP ESP4

1. Buka **Serial Monitor** (baud 115200)
2. Reset ESP4
3. Tunggu koneksi WiFi
4. Lihat output:
   ```
   [WIFI] Connected!
   [WIFI] IP Address: 192.168.1.XXX
   [HTTP] Access at: http://192.168.1.XXX
   ```

---

## Langkah 6 — Update IP di Frontend Config

Edit file `frontend/src/config/esp4.ts`:

```typescript
export const ESP4_BASE_URL = 'http://192.168.1.XXX'; // ← ganti dengan IP dari Serial Monitor
```

Kemudian **build ulang** dan **upload filesystem ulang**.

---

## Library yang Diperlukan

Install via Arduino Library Manager (Sketch → Include Library → Manage Libraries):

| Library | Author | Versi |
|---|---|---|
| ESPAsyncWebServer | me-no-dev | latest |
| AsyncTCP | me-no-dev | latest |
| ArduinoJson | Benoit Blanchon | 6.x |

> **Catatan ESPAsyncWebServer:** Library ini mungkin tidak ada di Library Manager.
> Install manual dari GitHub: https://github.com/me-no-dev/ESPAsyncWebServer
> dan https://github.com/me-no-dev/AsyncTCP

---

## Endpoint API ESP4 (Referensi Cepat)

| Method | Path | Fungsi |
|---|---|---|
| GET | `/status` | Status semua device |
| GET | `/sensor/gas` | Nilai sensor gas ESP1 |
| GET | `/sensor/rain` | Nilai sensor hujan ESP2 |
| GET | `/logs?esp=1&limit=50` | Log sistem |
| POST | `/command` | Kirim command ke ESP1/2/3 |
| POST | `/wifi` | Kirim WiFi config |
| GET | `/automode` | Status auto mode jemuran |
| POST | `/automode` | Toggle auto mode |
| GET | `/rfid/whitelist` | Daftar RFID yang diizinkan |
| POST | `/rfid/whitelist` | Tambah RFID ke whitelist |
| DELETE | `/rfid/whitelist/:uid` | Hapus RFID dari whitelist |
| GET | `/rfid/scans` | Log scan RFID |

---

## Pin UART ESP4 (Referensi)

| Device | RX ESP4 | TX ESP4 | Baud |
|---|---|---|---|
| ESP1 (TX→ESP4) | GPIO 16 | GPIO 17 (→ESP1 RX) | 9600 |
| ESP2 (TX→ESP4) | GPIO 4  | GPIO 5  (→ESP2 RX) | 9600 |
| ESP3 (TX→ESP4) | GPIO 13 | GPIO 15 (→ESP3 RX) | 9600 |

> **Penting:** Hubungkan TX ESP1 ke RX ESP4, dan TX ESP4 ke RX ESP1 (cross).

---

## Troubleshooting

**CORS Error di browser:**
- Pastikan firmware ESP4 sudah ter-upload versi terbaru
- Cek header `Access-Control-Allow-Origin: *` ada di response

**Frontend tidak muncul:**
- Pastikan folder `data/` berisi `index.html`
- Upload filesystem lagi via Tools → ESP32 Sketch Data Upload

**Device status selalu offline:**
- Cek kabel UART (TX↔RX harus di-cross)
- Cek baud rate sama (9600)
- Buka Serial Monitor dan lihat apakah ada data masuk dari ESP1/2/3

**IP berubah setiap restart:**
- Set IP statis di router (DHCP reservation berdasarkan MAC address ESP4)
- Atau gunakan mDNS (tambahkan `ESPmDNS` library dan panggil `MDNS.begin("esp4")`)
  kemudian akses via `http://esp4.local`
