// Quick test to check if server can start
import 'dotenv/config';

console.log('✓ Environment loaded');
console.log('PORT:', process.env.PORT);
console.log('USE_MOCK_SERIAL:', process.env.USE_MOCK_SERIAL);
console.log('SERIAL_PORT:', process.env.SERIAL_PORT);

// Test imports
try {
  await import('express');
  console.log('✓ Express imported');
  
  await import('socket.io');
  console.log('✓ Socket.IO imported');
  
  await import('serialport');
  console.log('✓ SerialPort imported');
  
  await import('@serialport/parser-readline');
  console.log('✓ Parser imported');
  
  console.log('\n✅ All dependencies OK! Server should start fine.');
} catch (error) {
  console.error('✗ Import error:', error.message);
}
