import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const SERIAL_PORT = 'COM8';
const BAUDRATE = 115200;

console.log('🔍 Testing Serial Connection to ESP32-4...');
console.log(`📍 Port: ${SERIAL_PORT}`);
console.log(`⚡ Baudrate: ${BAUDRATE}`);
console.log('');

const serialPort = new SerialPort({
  path: SERIAL_PORT,
  baudRate: BAUDRATE,
});

const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

serialPort.on('open', () => {
  console.log('✅ Serial port opened successfully!');
  console.log('📡 Listening for data from ESP32...');
  console.log('');
  console.log('Expected format: ESPx:TYPE:MESSAGE');
  console.log('Press Ctrl+C to exit');
  console.log('─────────────────────────────────────────');
  console.log('');

  // Send test command after 3 seconds
  setTimeout(() => {
    console.log('📤 Sending test command: ESP1:LAMP:ON');
    serialPort.write('ESP1:LAMP:ON\n');
  }, 3000);
});

serialPort.on('error', (error) => {
  console.error('❌ Serial port error:', error.message);
  process.exit(1);
});

serialPort.on('close', () => {
  console.log('🔌 Serial port closed');
  process.exit(0);
});

let messageCount = 0;
parser.on('data', (line) => {
  messageCount++;
  const timestamp = new Date().toLocaleTimeString();
  
  console.log(`[${timestamp}] #${messageCount} ${line}`);

  try {
    const parts = line.trim().split(':');
    if (parts.length >= 3) {
      const espNumber = parts[0];
      const type = parts[1];
      const message = parts.slice(2).join(':');
      
      console.log(`   ├─ Device: ${espNumber}`);
      console.log(`   ├─ Type: ${type}`);
      console.log(`   └─ Message: ${message}`);
    }
  } catch (err) {
    console.log(`   └─ Raw data`);
  }
  console.log('');
});

process.on('SIGINT', () => {
  console.log('');
  console.log('🛑 Closing connection...');
  serialPort.close();
});
