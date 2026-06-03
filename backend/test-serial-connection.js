/**
 * Script untuk test koneksi serial dengan ESP32-4
 * Jalankan: node test-serial-connection.js
 */

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const SERIAL_PORT = process.env.SERIAL_PORT || 'COM3';
const BAUDRATE = 115200;

console.log('🔍 Testing Serial Connection to ESP32-4...');
console.log(`📍 Port: ${SERIAL_PORT}`);
console.log(`⚡ Baudrate: ${BAUDRATE}`);
console.log('');

// List available ports
SerialPort.list().then((ports) => {
  console.log('📋 Available Serial Ports:');
  if (ports.length === 0) {
    console.log('   ❌ No serial ports found!');
    console.log('   💡 Make sure ESP32 is connected via USB');
  } else {
    ports.forEach((port, index) => {
      console.log(`   ${index + 1}. ${port.path}`);
      if (port.manufacturer) console.log(`      Manufacturer: ${port.manufacturer}`);
      if (port.serialNumber) console.log(`      Serial: ${port.serialNumber}`);
    });
  }
  console.log('');

  // Try to connect
  console.log(`🔌 Attempting to connect to ${SERIAL_PORT}...`);
  
  const serialPort = new SerialPort({
    path: SERIAL_PORT,
    baudRate: BAUDRATE,
  });

  const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

  serialPort.on('open', () => {
    console.log('✅ Serial port opened successfully!');
    console.log('📡 Listening for data from ESP32-4...');
    console.log('');
    console.log('Expected format: ESPx:TYPE:MESSAGE');
    console.log('Example: ESP1:STATUS:OK,GAS=1200,LAMP=OFF');
    console.log('');
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
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   1. Check if ESP32-4 is connected via USB');
    console.log('   2. Check the correct COM port in Device Manager (Windows)');
    console.log('   3. Close Arduino IDE Serial Monitor if open');
    console.log('   4. Try a different USB cable or port');
    console.log('   5. Update file .env with correct SERIAL_PORT');
    process.exit(1);
  });

  serialPort.on('close', () => {
    console.log('');
    console.log('🔌 Serial port closed');
    process.exit(0);
  });

  let messageCount = 0;
  parser.on('data', (line) => {
    messageCount++;
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`[${timestamp}] #${messageCount} ${line}`);

    // Try to parse the message
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
      console.log(`   └─ Raw data (could not parse)`);
    }
    console.log('');
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('');
    console.log('🛑 Closing connection...');
    serialPort.close();
  });

}).catch((err) => {
  console.error('❌ Error listing serial ports:', err);
  process.exit(1);
});
