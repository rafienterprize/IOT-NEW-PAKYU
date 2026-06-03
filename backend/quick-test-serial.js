/**
 * Quick test: Apakah ESP32-4 mengirim data?
 * Jalankan: node quick-test-serial.js
 * 
 * PENTING: Tutup Arduino Serial Monitor sebelum menjalankan!
 */

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const PORT = process.env.SERIAL_PORT || 'COM8';
const BAUDRATE = 115200;

console.log('🔍 Quick Test: Apakah ESP32-4 mengirim data?\n');
console.log(`📍 Port: ${PORT}`);
console.log(`⚡ Baudrate: ${BAUDRATE}`);
console.log('⏱️  Tunggu 10 detik...\n');
console.log('─────────────────────────────────────────');

const serialPort = new SerialPort({
  path: PORT,
  baudRate: BAUDRATE,
});

const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

let dataCount = 0;
let hasData = false;

serialPort.on('open', () => {
  console.log('✅ COM8 terbuka! Menunggu data dari ESP32-4...\n');
});

serialPort.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Troubleshooting:');
  console.log('   1. Tutup Arduino Serial Monitor');
  console.log('   2. ESP32-4 terhubung di COM8?');
  console.log('   3. Coba cabut-colok USB ESP32-4');
  process.exit(1);
});

parser.on('data', (line) => {
  dataCount++;
  hasData = true;
  
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] #${dataCount}: ${line}`);
  
  // Parse data
  if (line.includes('ESP1') || line.includes('ESP2') || line.includes('ESP3') || line.includes('ESP4')) {
    console.log('   ✅ Data ESP terdeteksi!');
  }
  console.log('');
});

// Auto exit setelah 10 detik
setTimeout(() => {
  console.log('─────────────────────────────────────────');
  console.log('\n📊 HASIL TEST:\n');
  
  if (hasData) {
    console.log(`✅ ESP32-4 MENGIRIM DATA (${dataCount} pesan)`);
    console.log('\n📝 Kesimpulan:');
    console.log('   - ESP32-4 bekerja dengan baik');
    console.log('   - Kode TEST_MODE aktif');
    console.log('   - Data dikirim ke COM8\n');
    console.log('🔥 NEXT STEP:');
    console.log('   1. Tutup script ini');
    console.log('   2. Start backend: npm start');
    console.log('   3. Refresh website');
    console.log('   4. Semua ESP32 akan ONLINE!\n');
  } else {
    console.log('❌ TIDAK ADA DATA dari ESP32-4!\n');
    console.log('📝 Kemungkinan masalah:');
    console.log('   1. ESP32-4 tidak menyala (cek LED power)');
    console.log('   2. Kode tidak jalan (upload ulang esp32-4.ino)');
    console.log('   3. TEST_MODE = false (harusnya true)');
    console.log('   4. ESP32-4 crash (tekan tombol RESET)\n');
    console.log('🔥 SOLUSI:');
    console.log('   1. Buka Arduino Serial Monitor (COM8, 115200)');
    console.log('   2. Tekan RESET di ESP32-4');
    console.log('   3. Cek apakah ada data di Serial Monitor');
    console.log('   4. Kalau tidak ada, upload ulang esp32-4.ino\n');
  }
  
  serialPort.close();
  process.exit(0);
}, 10000);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n🛑 Test dibatalkan');
  serialPort.close();
  process.exit(0);
});
