# 🔧 Supabase Connection Troubleshooting

## ❌ Error: "Can't reach database server"

Anda mengalami error ini karena komputer tidak bisa connect ke Supabase.

### 🔍 Kemungkinan Penyebab:

1. **Firewall Windows** memblokir koneksi
2. **Antivirus** memblokir koneksi
3. **Network/ISP** memblokir port database
4. **Supabase project** belum selesai provisioning
5. **Connection string** salah

---

## ✅ Solusi Step-by-Step

### Solusi 1: Cek Status Supabase Project

1. Buka https://supabase.com/dashboard
2. Pilih project `iot-smart-home`
3. Pastikan status project: **"Active"** (hijau)
4. Jika masih **"Setting up"** → Tunggu 2-3 menit lagi

### Solusi 2: Cek Connection String

1. Di Supabase Dashboard → **Settings** → **Database**
2. Scroll ke **"Connection string"**
3. Pilih tab **"URI"**
4. Copy lagi connection string
5. Pastikan format:
```
postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

6. **PENTING:** Ganti `[PASSWORD]` dengan password Anda!

### Solusi 3: Test dengan Browser

Coba akses Supabase dari browser untuk memastikan internet OK:

1. Buka https://supabase.com/dashboard
2. Jika bisa buka → Internet OK
3. Jika tidak bisa → Masalah internet

### Solusi 4: Disable Firewall Sementara

**Windows Firewall:**

1. Buka **Windows Security**
2. Klik **Firewall & network protection**
3. Klik **Private network** atau **Public network**
4. Toggle **OFF** Windows Defender Firewall
5. Test lagi: `node test-db-connection.js`
6. Jika berhasil → Firewall adalah masalahnya
7. **Jangan lupa nyalakan lagi firewall!**

**Antivirus:**

1. Disable antivirus sementara (Avast, AVG, Kaspersky, dll)
2. Test lagi
3. Jika berhasil → Antivirus memblokir

### Solusi 5: Coba Connection Pooling

Edit `backend/.env`:

```env
# Pakai port 6543 dengan pgbouncer
DATABASE_URL=postgresql://postgres:XISIJA1STEMBA@db.dcdlzxxgstinltjckvqk.supabase.co:6543/postgres?pgbouncer=true
```

Test:
```bash
node test-db-connection.js
```

### Solusi 6: Coba Direct Connection (Tanpa Pooling)

Edit `backend/.env`:

```env
# Pakai port 5432 direct
DATABASE_URL=postgresql://postgres:XISIJA1STEMBA@db.dcdlzxxgstinltjckvqk.supabase.co:5432/postgres
```

Test:
```bash
node test-db-connection.js
```

### Solusi 7: Cek dengan Ping

Buka Command Prompt:

```bash
# Test ping ke Supabase
ping db.dcdlzxxgstinltjckvqk.supabase.co
```

**Jika berhasil:**
```
Reply from xxx.xxx.xxx.xxx: bytes=32 time=50ms TTL=54
```

**Jika gagal:**
```
Request timed out
```
→ Network/ISP memblokir

### Solusi 8: Coba Pakai Hotspot HP

Jika semua solusi di atas gagal:

1. Nyalakan hotspot di HP
2. Connect laptop ke hotspot HP
3. Test lagi: `node test-db-connection.js`
4. Jika berhasil → ISP/Network kantor/kampus memblokir Supabase

### Solusi 9: Pakai VPN

Jika ISP memblokir:

1. Install VPN (Cloudflare WARP, ProtonVPN, dll)
2. Connect VPN
3. Test lagi

### Solusi 10: Alternatif - Pakai Railway Database

Jika Supabase tetap tidak bisa:

1. Buka https://railway.app
2. Sign up (gratis)
3. New Project → **Provision PostgreSQL**
4. Copy connection string
5. Update `backend/.env`

---

## 🧪 Test Connection Script

Buat file `test-supabase.js`:

```javascript
import { createConnection } from 'net';

const host = 'db.dcdlzxxgstinltjckvqk.supabase.co';
const port = 5432;

console.log(`🔍 Testing connection to ${host}:${port}...`);

const socket = createConnection({ host, port, timeout: 5000 });

socket.on('connect', () => {
  console.log('✅ Connection successful!');
  console.log('💡 Network can reach Supabase');
  socket.end();
  process.exit(0);
});

socket.on('timeout', () => {
  console.log('❌ Connection timeout');
  console.log('💡 Firewall or network issue');
  socket.destroy();
  process.exit(1);
});

socket.on('error', (err) => {
  console.log('❌ Connection failed:', err.message);
  console.log('💡 Check firewall, antivirus, or network');
  process.exit(1);
});
```

Jalankan:
```bash
node test-supabase.js
```

---

## 🔄 Fallback: Tetap Pakai Mock Mode

Jika semua solusi gagal, aplikasi tetap bisa jalan dengan mock mode:

Edit `backend/.env`:
```env
# Kembali ke mock mode tanpa database
USE_MOCK_SERIAL=true
# DATABASE_URL bisa dikosongkan atau di-comment
```

Start backend:
```bash
npm run dev
```

**Output:**
```
⚠️  Database not connected - using in-memory storage (mock mode)
💡 This is OK for development
✓ Server running on http://localhost:3001
```

**Aplikasi tetap berfungsi!** Data hanya tidak persistent.

---

## 📞 Bantuan Lebih Lanjut

### Cek Status Supabase:
https://status.supabase.com

### Supabase Discord:
https://discord.supabase.com

### Alternatif Database Online:
1. **Railway** - https://railway.app (Recommended)
2. **Neon** - https://neon.tech
3. **ElephantSQL** - https://www.elephantsql.com
4. **Render** - https://render.com

---

## ✅ Checklist Troubleshooting

- [ ] Cek status Supabase project (Active?)
- [ ] Cek connection string benar
- [ ] Test dengan browser (internet OK?)
- [ ] Disable firewall sementara
- [ ] Disable antivirus sementara
- [ ] Coba connection pooling (port 6543)
- [ ] Coba direct connection (port 5432)
- [ ] Test ping ke Supabase
- [ ] Coba pakai hotspot HP
- [ ] Coba pakai VPN
- [ ] Fallback ke mock mode

---

## 💡 Tips

1. **Untuk development:** Mock mode sudah cukup
2. **Untuk production:** Harus pakai database online
3. **Jika Supabase tidak bisa:** Coba Railway (lebih mudah connect)
4. **Jika di kampus/kantor:** Network mungkin memblokir, pakai hotspot HP

Semoga membantu! 🚀
