# 🚀 QUICK START GUIDE

## Prerequisites Check
- ✅ Node.js v18+ installed
- ✅ PostgreSQL installed (optional for mock mode)

## Option 1: Quick Start (Mock Mode - No Database Required)

### 1. Start Backend (Terminal 1)
```bash
cd backend
npm install
npm run dev
```

Backend akan jalan di `http://localhost:3001` dengan **MOCK MODE** (simulasi ESP32).

### 2. Start Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```

Frontend akan jalan di `http://localhost:5173`

### 3. Open Browser
Buka `http://localhost:5173`

**✅ Done! Aplikasi sudah jalan tanpa database!**

---

## Option 2: Full Setup (With Database)

### Pilihan A: Supabase (Online Database - RECOMMENDED) ⭐

**Kelebihan:** Database online, bisa diakses dari mana saja, gratis!

1. **Buat akun Supabase:** https://supabase.com
2. **Buat project baru** → Simpan password!
3. **Copy connection string:** Settings → Database → Connection string (URI)
4. **Update .env:**
```env
DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres
```
5. **Setup database:**
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

**📖 Panduan lengkap:** Lihat `SUPABASE_QUICKSTART.md` (5 menit setup!)

### Pilihan B: PostgreSQL Lokal

1. **Setup Database:**
```bash
# Create database
createdb smarthome

# Setup tables
cd backend
npm run prisma:migrate

# Setup TimescaleDB (optional)
psql -d smarthome -f prisma/setup.sql
```

2. **Configure Backend:**
Edit `backend/.env`:
```env
USE_MOCK_SERIAL=true
DATABASE_URL=postgresql://postgres:password@localhost:5432/smarthome
```

### 3. Start Backend
```bash
cd backend
npm run dev
```

### 4. Start Frontend
```bash
cd frontend
npm run dev
```

### 5. Open Browser
Buka `http://localhost:5173`

---

## 🌐 Deploy ke Production (Opsional)

### Backend (Railway/Render):
1. Push code ke GitHub
2. Connect repository di Railway/Render
3. Set environment variable `DATABASE_URL` (dari Supabase)
4. Deploy!

### Frontend (Vercel/Netlify):
1. Push code ke GitHub
2. Connect repository di Vercel/Netlify
3. Set `VITE_API_URL` ke backend URL
4. Deploy!

**📖 Panduan lengkap:** Lihat `DEPLOYMENT.md` (coming soon)

---

## Troubleshooting

### Frontend Error: "PostCSS plugin tailwindcss"
```bash
cd frontend
npm uninstall tailwindcss
npm install -D tailwindcss@3 postcss autoprefixer
```

### Backend Error: "Cannot find module serialport"
```bash
cd backend
npm install serialport @serialport/parser-readline
```

### Database Connection Error
Set `USE_MOCK_SERIAL=true` di `backend/.env` untuk skip database.

### Port Already in Use
- Backend (3001): Change `PORT` in `backend/.env`
- Frontend (5173): Vite will auto-increment port

---

## Testing Features

### 1. Dashboard
- Lihat status semua ESP devices
- Monitor real-time logs

### 2. ESP1 Page
- Toggle lamp ON/OFF
- Monitor gas sensor
- Click "Feed Now" button

### 3. ESP2 Page
- Control clothesline IN/OUT
- Toggle auto mode
- Monitor rain sensor

### 4. ESP3 Page
- Control door OPEN/CLOSE
- Control gate OPEN/CLOSE
- View RFID scans

### 5. Settings
- Configure WiFi for all devices

---

## Mock Mode Features

Dalam mock mode, sistem akan:
- ✅ Generate sensor data setiap 3 detik
- ✅ Simulate command responses
- ✅ Trigger alerts when threshold exceeded
- ✅ Auto-close door/gate after delay
- ✅ Random RFID scans

**Perfect untuk demo dan development!**
