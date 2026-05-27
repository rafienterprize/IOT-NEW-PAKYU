# 🗄️ Database Setup Guide

## ❌ Masalah Saat Ini

**Database tidak terkoneksi!** Error: `password authentication failed for user "postgres"`

Password di file `.env` tidak sesuai dengan password PostgreSQL Anda.

---

## ✅ Solusi: 2 Pilihan

### **Pilihan 1: Tetap Pakai Mock Mode (RECOMMENDED untuk testing)**

Aplikasi sudah berjalan dengan baik di mock mode. Data disimpan di memory, tidak perlu database.

**Kelebihan:**
- ✅ Tidak perlu setup database
- ✅ Lebih cepat untuk development
- ✅ Semua fitur tetap berfungsi
- ✅ Data sensor dan logs tetap muncul (simulasi)

**Kekurangan:**
- ⚠️ Data hilang saat restart server
- ⚠️ Tidak bisa test dengan data real

**Cara pakai:** Sudah aktif! Tidak perlu apa-apa.

---

### **Pilihan 2: Setup Database PostgreSQL (untuk production)**

Jika ingin data persistent (tidak hilang saat restart), ikuti langkah ini:

#### **Langkah 1: Cari Password PostgreSQL Anda**

Coba salah satu cara ini:

**Cara A - Cek password yang tersimpan:**
```bash
# Buka pgAdmin atau cek saat install PostgreSQL
```

**Cara B - Reset password PostgreSQL:**
```bash
# 1. Buka Command Prompt as Administrator
# 2. Masuk ke PostgreSQL
psql -U postgres

# 3. Reset password (ganti 'newpassword' dengan password baru)
ALTER USER postgres PASSWORD 'newpassword';

# 4. Keluar
\q
```

#### **Langkah 2: Update file .env**

Edit file `backend/.env`, ganti password di DATABASE_URL:

```env
# Ganti 'password' dengan password PostgreSQL Anda yang benar
DATABASE_URL=postgresql://postgres:PASSWORD_ANDA_DISINI@localhost:5432/smarthome
```

Contoh:
```env
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/smarthome
```

#### **Langkah 3: Buat Database**

```bash
# Buka Command Prompt
cd backend

# Buat database (masukkan password saat diminta)
createdb -U postgres smarthome
```

Atau pakai SQL:
```bash
psql -U postgres
CREATE DATABASE smarthome;
\q
```

#### **Langkah 4: Jalankan Migration**

```bash
cd backend
npm run prisma:migrate
```

#### **Langkah 5: Test Koneksi**

```bash
cd backend
node test-db-connection.js
```

Jika berhasil, akan muncul:
```
✅ Database connected successfully!
✅ Found 0 device states in database
✅ Found 0 recent logs in database
✅ Database test completed successfully!
```

#### **Langkah 6: Restart Backend**

```bash
cd backend
npm run dev
```

---

## 🔍 Cek Status Database

Jalankan script test:
```bash
cd backend
node test-db-connection.js
```

**Jika berhasil:** ✅ Database connected!
**Jika gagal:** ❌ Ikuti solusi di atas

---

## 📊 Perbedaan Mock Mode vs Database Mode

| Fitur | Mock Mode | Database Mode |
|-------|-----------|---------------|
| Data persistence | ❌ Hilang saat restart | ✅ Tersimpan permanent |
| Setup | ✅ Mudah (sudah jalan) | ⚠️ Perlu setup database |
| Kecepatan | ✅ Sangat cepat | ⚠️ Tergantung database |
| Sensor data | ✅ Simulasi otomatis | ✅ Data real dari ESP32 |
| Logs | ✅ Simulasi | ✅ Real logs |
| RFID whitelist | ❌ Tidak tersimpan | ✅ Tersimpan |
| Auto mode config | ❌ Tidak tersimpan | ✅ Tersimpan |

---

## 💡 Rekomendasi

**Untuk saat ini:** Pakai **Mock Mode** (sudah aktif)
- Aplikasi sudah berjalan dengan baik
- Semua fitur bisa di-test
- Tidak perlu ribet setup database

**Untuk production nanti:** Setup **Database Mode**
- Data tidak hilang
- Bisa simpan RFID whitelist
- Bisa simpan konfigurasi auto mode
- Bisa lihat history sensor data yang lama

---

## 🚀 Quick Test

Cek apakah aplikasi berjalan dengan baik sekarang:

1. **Backend:** Buka http://localhost:3001/api/status
   - Harus muncul data ESP devices

2. **Frontend:** Buka http://localhost:5173
   - Dashboard harus muncul
   - Device cards harus ada
   - Charts harus update real-time

Jika semua berjalan, **aplikasi sudah OK!** Database opsional untuk sekarang.
