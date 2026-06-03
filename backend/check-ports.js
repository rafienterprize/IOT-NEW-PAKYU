/**
 * Script untuk cek port serial yang tersedia
 * Jalankan: node check-ports.js
 */

import { SerialPort } from 'serialport';

console.log('🔍 Checking available serial ports...\n');

SerialPort.list()
  .then((ports) => {
    if (ports.length === 0) {
      console.log('❌ No serial ports found!');
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Make sure ESP32 is plugged in via USB');
      console.log('   2. Try a different USB cable (must support data, not just charging)');
      console.log('   3. Try a different USB port on your computer');
      console.log('   4. Install USB-to-Serial driver:');
      console.log('      - CP210x: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers');
      console.log('      - CH340: http://www.wch-ic.com/downloads/CH341SER_ZIP.html');
      console.log('   5. Restart your computer after installing driver');
      console.log('   6. Check Device Manager (devmgmt.msc) for "Ports (COM & LPT)"');
      return;
    }

    console.log(`✅ Found ${ports.length} serial port(s):\n`);
    
    ports.forEach((port, index) => {
      console.log(`Port ${index + 1}:`);
      console.log(`   Path: ${port.path}`);
      if (port.manufacturer) {
        console.log(`   Manufacturer: ${port.manufacturer}`);
      }
      if (port.serialNumber) {
        console.log(`   Serial Number: ${port.serialNumber}`);
      }
      if (port.vendorId) {
        console.log(`   Vendor ID: ${port.vendorId}`);
      }
      if (port.productId) {
        console.log(`   Product ID: ${port.productId}`);
      }
      console.log('');
    });

    console.log('💡 Copy the port path (e.g., COM3) to your .env file:');
    console.log('   SERIAL_PORT=' + ports[0].path);
  })
  .catch((err) => {
    console.error('❌ Error:', err.message);
  });
