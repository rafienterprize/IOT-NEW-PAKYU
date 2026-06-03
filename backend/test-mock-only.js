/**
 * Test Mock Serial Only
 * Cek apakah mock serial mengirim data
 */

import MockSerial from './src/services/mockSerial.js';

console.log('🧪 Test Mock Serial...\n');

const mock = new MockSerial();

mock.on('data', (line) => {
  console.log('[MOCK DATA]:', line);
});

mock.start();

console.log('⏳ Tunggu 15 detik untuk data...\n');

setTimeout(() => {
  console.log('\n✅ Test selesai!');
  mock.stop();
  process.exit(0);
}, 15000);
