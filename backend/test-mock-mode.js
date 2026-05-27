// Quick test to see if backend can start in mock mode without database
import 'dotenv/config';

console.log('🧪 Testing Mock Mode Configuration...\n');

console.log('Environment Variables:');
console.log('  PORT:', process.env.PORT);
console.log('  USE_MOCK_SERIAL:', process.env.USE_MOCK_SERIAL);
console.log('  DATABASE_URL:', process.env.DATABASE_URL);
console.log('  FRONTEND_URL:', process.env.FRONTEND_URL);

console.log('\n✅ Mock mode is:', process.env.USE_MOCK_SERIAL === 'true' ? 'ENABLED' : 'DISABLED');

if (process.env.USE_MOCK_SERIAL === 'true') {
  console.log('\n💡 Backend should start WITHOUT database in mock mode');
  console.log('💡 Try running: npm run dev');
} else {
  console.log('\n⚠️  Mock mode is DISABLED - database is REQUIRED');
  console.log('💡 To enable mock mode: set USE_MOCK_SERIAL=true in .env');
}
