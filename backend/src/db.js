import { PrismaClient } from '@prisma/client';

const USE_MOCK_SERIAL = process.env.USE_MOCK_SERIAL === 'true';

// Create Prisma client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// In-memory storage for mock mode (when database is not available)
const mockStorage = {
  deviceStates: new Map(),
  deviceLogs: [],
  sensorHistory: [],
  rfidWhitelist: new Map(),
  rfidLogs: [],
  autoModeConfig: { id: 1, enabled: false, rainThreshold: 1600 },
};

// Test database connection
export async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✓ Database connected successfully');
    return true;
  } catch (error) {
    if (USE_MOCK_SERIAL) {
      console.log('⚠️  Database not connected - using in-memory storage (mock mode)');
      console.log('💡 This is OK for development. Data will not persist after restart.');
      return false; // Return false but don't throw error
    } else {
      console.error('✗ Database connection failed:', error.message);
      throw error; // Throw error in production mode
    }
  }
}

// Graceful shutdown
export async function disconnect() {
  try {
    await prisma.$disconnect();
    console.log('Database disconnected');
  } catch (error) {
    // Ignore disconnect errors in mock mode
    if (!USE_MOCK_SERIAL) {
      console.error('Error disconnecting database:', error.message);
    }
  }
}

// Export both prisma and mock storage
export { mockStorage };
export default prisma;
