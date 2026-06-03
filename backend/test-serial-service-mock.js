/**
 * Test SerialService dengan Mock Mode
 */

import SerialService from './src/services/serialService.js';

console.log('🧪 Test SerialService + Mock...\n');

const serialService = new SerialService('COM8', 115200, true); // useMock = true

serialService.on('connected', () => {
  console.log('✅ Serial service connected!\n');
});

serialService.on('data', (parsed) => {
  console.log('[PARSED DATA]:', JSON.stringify(parsed, null, 2));
});

serialService.on('raw', (rawData) => {
  console.log('[RAW DATA]:', rawData);
});

serialService.on('error', (error) => {
  console.error('[ERROR]:', error.message);
});

await serialService.connect();

console.log('⏳ Tunggu 15 detik untuk data...\n');

setTimeout(async () => {
  console.log('\n✅ Test selesai!');
  await serialService.disconnect();
  process.exit(0);
}, 15000);
