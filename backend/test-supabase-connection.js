import { createConnection } from 'net';

const host = 'db.dcdlzxxgstinltjckvqk.supabase.co';
const ports = [5432, 6543]; // Try both direct and pooling ports

console.log('🔍 Testing Supabase Connection...\n');

async function testPort(port) {
  return new Promise((resolve) => {
    console.log(`Testing ${host}:${port}...`);
    
    const socket = createConnection({ host, port, timeout: 5000 });
    
    socket.on('connect', () => {
      console.log(`✅ Port ${port} - Connection successful!`);
      socket.end();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      console.log(`❌ Port ${port} - Connection timeout`);
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', (err) => {
      console.log(`❌ Port ${port} - ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  let anySuccess = false;
  
  for (const port of ports) {
    const success = await testPort(port);
    if (success) anySuccess = true;
    console.log('');
  }
  
  if (anySuccess) {
    console.log('✅ Network can reach Supabase!');
    console.log('💡 Try running: npm run prisma:migrate');
  } else {
    console.log('❌ Cannot reach Supabase');
    console.log('\n💡 Possible solutions:');
    console.log('1. Check firewall settings');
    console.log('2. Check antivirus settings');
    console.log('3. Try using mobile hotspot');
    console.log('4. Try using VPN');
    console.log('5. Check Supabase project status: https://supabase.com/dashboard');
    console.log('\n📖 See SUPABASE_TROUBLESHOOTING.md for detailed solutions');
  }
}

main();
