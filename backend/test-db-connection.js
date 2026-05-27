import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('📍 DATABASE_URL:', process.env.DATABASE_URL);
    
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    // Try to query device states
    const deviceStates = await prisma.deviceState.findMany();
    console.log(`✅ Found ${deviceStates.length} device states in database`);
    
    // Try to query device logs
    const logs = await prisma.deviceLog.findMany({ take: 5 });
    console.log(`✅ Found ${logs.length} recent logs in database`);
    
    await prisma.$disconnect();
    console.log('✅ Database test completed successfully!');
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    console.error('\n💡 Possible solutions:');
    console.error('1. Check if PostgreSQL is running');
    console.error('2. Verify DATABASE_URL in .env file');
    console.error('3. Check database credentials (username/password)');
    console.error('4. Make sure database "smarthome" exists');
    console.error('5. Run: npm run prisma:migrate');
    process.exit(1);
  }
}

testConnection();
