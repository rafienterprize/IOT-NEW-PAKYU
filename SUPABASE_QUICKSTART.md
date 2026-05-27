# ⚡ Supabase Quick Start (5 Menit)

## 🎯 Langkah Cepat

### 1️⃣ Buat Akun & Project (2 menit)

1. Buka https://supabase.com → **Sign up**
2. Klik **"New Project"**
3. Isi:
   - Name: `iot-smart-home`
   - Password: Buat password kuat (SIMPAN!)
   - Region: Singapore/Tokyo
4. Klik **"Create"** → Tunggu 2 menit

### 2️⃣ Copy Connection String (30 detik)

1. Dashboard → **Settings** (⚙️) → **Database**
2. Scroll ke **"Connection string"** → Tab **"URI"**
3. Copy string yang muncul
4. **GANTI** `[YOUR-PASSWORD]` dengan password Anda!

Contoh:
```
postgresql://postgres:myPassword123@db.abcdefg.supabase.co:5432/postgres
```

### 3️⃣ Update Backend (30 detik)

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

Paste connection string dari step 2!

### 4️⃣ Setup Database (1 menit)

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Buat tables di Supabase
npm run prisma:migrate
```

### 5️⃣ Test & Run (1 menit)

```bash
# Test koneksi
node test-db-connection.js

# Jika sukses, start backend
npm run dev
```

**Output sukses:**
```
✅ Database connected successfully!
✓ Server running on http://localhost:3001
```

---

## 🎨 Lihat Data Real-Time

1. Buka https://supabase.com/dashboard
2. Pilih project Anda
3. Klik **"Table Editor"**
4. Lihat data masuk real-time! 🎉

---

## ✅ Done!

Sekarang:
- ✅ Database online (bisa diakses dari mana saja)
- ✅ Data persistent (tidak hilang saat restart)
- ✅ Dashboard untuk monitoring
- ✅ Auto backup

**Total waktu: ~5 menit** ⚡

---

## 🆘 Error?

### "Password authentication failed"
→ Cek password di DATABASE_URL sudah benar

### "Connection timeout"
→ Cek internet connection

### "Migration failed"
→ Jalankan lagi: `npm run prisma:migrate`

---

## 📖 Panduan Lengkap

Lihat `SUPABASE_SETUP.md` untuk:
- TimescaleDB setup
- Security best practices
- Monitoring & maintenance
- Troubleshooting lengkap
