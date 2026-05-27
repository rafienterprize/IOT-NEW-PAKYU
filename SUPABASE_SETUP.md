# 🚀 Setup Supabase Database (Online PostgreSQL)

## 📌 Kenapa Supabase?

✅ **PostgreSQL online** - Bisa diakses dari mana saja
✅ **Gratis** - Free tier cukup untuk project ini
✅ **Mudah setup** - Tidak perlu install PostgreSQL lokal
✅ **Dashboard bagus** - Bisa lihat data real-time
✅ **Auto backup** - Data aman
✅ **Support TimescaleDB** - Untuk sensor history

---

## 🎯 Langkah-Langkah Setup

### Step 1: Buat Akun Supabase

1. Buka https://supabase.com
2. Klik **"Start your project"**
3. Sign up dengan GitHub/Google/Email
4. Verifikasi email Anda

### Step 2: Buat Project Baru

1. Klik **"New Project"**
2. Isi form:
   - **Name:** `iot-smart-home` (atau nama lain)
   - **Database Password:** Buat password yang kuat (SIMPAN INI!)
   - **Region:** Pilih yang terdekat (Singapore/Tokyo untuk Indonesia)
   - **Pricing Plan:** Free (cukup untuk development)
3. Klik **"Create new project"**
4. Tunggu 2-3 menit sampai project ready

### Step 3: Dapatkan Connection String

1. Di dashboard Supabase, klik **"Settings"** (icon gear)
2. Klik **"Database"** di sidebar
3. Scroll ke bawah ke **"Connection string"**
4. Pilih tab **"URI"**
5. Copy connection string yang muncul

Format connection string:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

**PENTING:** Ganti `[YOUR-PASSWORD]` dengan password yang Anda buat di Step 2!

### Step 4: Update Backend .env

Edit file `backend/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration - SUPABASE
DATABASE_URL=postgresql://postgres:PASSWORD_ANDA@db.xxxxx.supabase.co:5432/postgres

# Serial Port Configuration
SERIAL_PORT=COM3
SERIAL_BAUDRATE=9600
USE_MOCK_SERIAL=true

# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# Sensor Thresholds
GAS_THRESHOLD=1800
RAIN_THRESHOLD=1600

# Device Timeout (seconds)
OFFLINE_TIMEOUT=7
```

**Contoh lengkap:**
```env
DATABASE_URL=postgresql://postgres:mySecurePass123@db.abcdefghijk.supabase.co:5432/postgres
```

### Step 5: Jalankan Prisma Migration

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Jalankan migration (buat tables di Supabase)
npm run prisma:migrate
```

**Output yang diharapkan:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "db.xxxxx.supabase.co:5432"

Applying migration `20240101000000_init`

The following migration(s) have been applied:

migrations/
  └─ 20240101000000_init/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client
```

### Step 6: Test Koneksi

```bash
cd backend
node test-db-connection.js
```

**Output sukses:**
```
🔍 Testing database connection...
📍 DATABASE_URL: postgresql://postgres:***@db.xxxxx.supabase.co:5432/postgres
✅ Database connected successfully!
✅ Found 0 device states in database
✅ Found 0 recent logs in database
✅ Database test completed successfully!
```

### Step 7: Start Backend

```bash
cd backend
npm run dev
```

**Output dengan Supabase:**
```
🚀 Starting IoT Smart Home Backend...
✓ Database connected successfully
📡 Serial Service: Running in MOCK mode
🎭 Mock Serial: Starting data simulation...
✓ Server running on http://localhost:3001
✓ Socket.IO ready
✓ CORS enabled for http://localhost:5173
✓ Mock Serial Mode: Simulating ESP32 devices
```

---

## 🎨 Lihat Data di Supabase Dashboard

### Cara Akses:

1. Buka dashboard Supabase: https://supabase.com/dashboard
2. Pilih project Anda
3. Klik **"Table Editor"** di sidebar
4. Anda akan lihat semua tables:
   - `DeviceState` - Status devices
   - `DeviceLog` - Logs dari ESP32
   - `SensorHistory` - History sensor data
   - `RFIDWhitelist` - Daftar RFID yang diizinkan
   - `RFIDLog` - Log scan RFID
   - `AutoModeConfig` - Konfigurasi auto mode

### Fitur Dashboard:

✅ **View data real-time** - Lihat data yang masuk
✅ **Edit data** - Bisa edit manual
✅ **Add data** - Tambah data manual
✅ **Delete data** - Hapus data
✅ **SQL Editor** - Jalankan query SQL
✅ **API Docs** - Auto-generated API documentation

---

## 📊 Setup TimescaleDB (Opsional - Untuk Performa)

Supabase support TimescaleDB extension untuk time-series data (sensor history).

### Cara Enable:

1. Di Supabase dashboard, klik **"SQL Editor"**
2. Klik **"New query"**
3. Paste SQL ini:

```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Convert SensorHistory to hypertable
SELECT create_hypertable('SensorHistory', 'timestamp', if_not_exists => TRUE);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sensor_history_esp_type 
ON "SensorHistory" (espNumber, sensorType, timestamp DESC);

-- Add retention policy (hapus data > 30 hari otomatis)
SELECT add_retention_policy('SensorHistory', INTERVAL '30 days', if_not_exists => TRUE);
```

4. Klik **"Run"**

**Manfaat:**
- ✅ Query sensor history lebih cepat
- ✅ Auto-delete data lama (hemat storage)
- ✅ Optimized untuk time-series data

---

## 🔒 Security Best Practices

### 1. Jangan Commit .env ke Git

Pastikan `.env` ada di `.gitignore`:

```bash
# Cek .gitignore
cat backend/.gitignore | grep .env
```

Jika belum ada, tambahkan:
```
.env
.env.local
.env.*.local
```

### 2. Gunakan Environment Variables di Production

Untuk deployment (Vercel, Railway, dll):
- Jangan hardcode DATABASE_URL
- Set sebagai environment variable di platform

### 3. Rotate Database Password

Jika password bocor:
1. Buka Supabase Dashboard
2. Settings → Database
3. Klik "Reset database password"
4. Update DATABASE_URL di .env

---

## 🌐 Akses Database dari Mana Saja

### Dari Komputer Lain:

1. Clone repository
2. Copy file `.env` (atau buat baru dengan DATABASE_URL yang sama)
3. Install dependencies: `npm install`
4. Run: `npm run dev`

### Dari Server (Deploy):

1. Set environment variable `DATABASE_URL` di server
2. Deploy backend
3. Database otomatis connect ke Supabase

**Contoh di Vercel:**
```bash
vercel env add DATABASE_URL
# Paste: postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

---

## 📈 Monitoring & Maintenance

### Cek Usage:

1. Buka Supabase Dashboard
2. Klik **"Settings"** → **"Usage"**
3. Monitor:
   - Database size
   - API requests
   - Bandwidth
   - Storage

### Free Tier Limits:

- ✅ 500 MB database storage
- ✅ 2 GB bandwidth/month
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests

**Cukup untuk development dan small production!**

### Backup Data:

Supabase auto-backup setiap hari. Untuk manual backup:

1. Dashboard → Settings → Database
2. Scroll ke "Database backups"
3. Klik "Download backup"

---

## 🔄 Migrasi dari PostgreSQL Lokal ke Supabase

Jika sudah ada data di PostgreSQL lokal:

### Export Data:

```bash
# Export dari PostgreSQL lokal
pg_dump -U postgres -d smarthome -f backup.sql
```

### Import ke Supabase:

1. Buka Supabase SQL Editor
2. Paste isi file `backup.sql`
3. Run query

Atau pakai command line:
```bash
psql "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres" < backup.sql
```

---

## 🧪 Testing

### Test Connection:

```bash
cd backend
node test-db-connection.js
```

### Test API:

```bash
# Test status endpoint
curl http://localhost:3001/api/status

# Test logs endpoint
curl http://localhost:3001/api/logs

# Test health endpoint
curl http://localhost:3001/health
```

### Test Frontend:

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Buka: http://localhost:5173
4. Cek:
   - Device cards muncul
   - Charts update real-time
   - Logs muncul
   - Commands berfungsi

---

## 🆘 Troubleshooting

### Error: "Connection timeout"

**Penyebab:** Firewall atau network issue

**Solusi:**
1. Cek internet connection
2. Cek firewall tidak block port 5432
3. Coba ganti region Supabase (Settings → General)

### Error: "Password authentication failed"

**Penyebab:** Password salah di DATABASE_URL

**Solusi:**
1. Cek password di Supabase Dashboard (Settings → Database)
2. Pastikan password di DATABASE_URL benar
3. Jangan ada spasi atau karakter special yang tidak di-encode

### Error: "Too many connections"

**Penyebab:** Connection pool penuh

**Solusi:**
1. Restart backend
2. Tambahkan connection pooling di DATABASE_URL:
```
postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true
```

### Database lambat?

**Solusi:**
1. Enable TimescaleDB (lihat section di atas)
2. Add indexes untuk query yang sering:
```sql
CREATE INDEX idx_device_logs_esp ON "DeviceLog" (espNumber, createdAt DESC);
CREATE INDEX idx_sensor_esp_type ON "SensorHistory" (espNumber, sensorType);
```

---

## 💰 Upgrade ke Paid Plan (Opsional)

Jika project berkembang dan butuh lebih:

### Pro Plan ($25/month):
- ✅ 8 GB database storage
- ✅ 50 GB bandwidth
- ✅ Daily backups (7 days retention)
- ✅ No pausing (free tier pause after 1 week inactive)

### Kapan Upgrade?
- Database > 400 MB
- Traffic tinggi (>1000 users/day)
- Butuh backup lebih lama
- Production app yang critical

---

## 📚 Resources

### Dokumentasi:
- Supabase Docs: https://supabase.com/docs
- Prisma + Supabase: https://supabase.com/docs/guides/integrations/prisma
- TimescaleDB: https://docs.timescale.com/

### Support:
- Supabase Discord: https://discord.supabase.com
- Supabase GitHub: https://github.com/supabase/supabase

---

## ✅ Checklist Setup

- [ ] Buat akun Supabase
- [ ] Buat project baru
- [ ] Copy connection string
- [ ] Update `backend/.env`
- [ ] Run `npm run prisma:generate`
- [ ] Run `npm run prisma:migrate`
- [ ] Test dengan `node test-db-connection.js`
- [ ] Start backend `npm run dev`
- [ ] Test frontend
- [ ] (Opsional) Enable TimescaleDB
- [ ] (Opsional) Setup backup strategy

---

## 🎉 Selesai!

Sekarang aplikasi Anda:
- ✅ Menggunakan database online (Supabase)
- ✅ Bisa diakses dari mana saja
- ✅ Data persistent dan aman
- ✅ Auto backup
- ✅ Dashboard untuk monitoring

**Backend siap untuk production!** 🚀

---

## 🔄 Rollback ke PostgreSQL Lokal

Jika ingin kembali ke PostgreSQL lokal:

1. Edit `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/smarthome
```

2. Restart backend:
```bash
npm run dev
```

Selesai! Mudah kan? 😊
