import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import prisma, { testConnection, disconnect } from './db.js';
import SerialService from './services/serialService.js';
import SocketService from './services/socketService.js';
import CommandService from './services/commandService.js';
import AutoModeService from './services/autoModeService.js';
import { createStatusRouter } from './routes/status.js';
import { createLogsRouter } from './routes/logs.js';
import { createCommandRouter } from './routes/command.js';
import { createWiFiRouter } from './routes/wifi.js';
import { createRFIDRouter } from './routes/rfid.js';
import { createSensorsRouter } from './routes/sensors.js';
import { createAutoModeRouter } from './routes/automode.js';

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Initialize services
const serialService = new SerialService(
  process.env.SERIAL_PORT || 'COM3',
  parseInt(process.env.SERIAL_BAUDRATE) || 9600,
  process.env.USE_MOCK_SERIAL === 'true'
);

const socketService = new SocketService(io);
const commandService = new CommandService(serialService, prisma);
const autoModeService = new AutoModeService(commandService, prisma);

// Register API routes
app.use('/api/status', createStatusRouter(prisma));
app.use('/api/logs', createLogsRouter(prisma));
app.use('/api/command', createCommandRouter(commandService));
app.use('/api/wifi', createWiFiRouter(commandService));
app.use('/api/rfid', createRFIDRouter(prisma));
app.use('/api/sensors', createSensorsRouter(prisma));
app.use('/api/automode', createAutoModeRouter(autoModeService));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: prisma ? 'connected' : 'disconnected',
      serial: serialService.getStatus(),
      socket: {
        connected: socketService.getConnectedClients(),
      },
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Wire up Serial Service to Socket Service and Database
serialService.on('data', async (parsed) => {
  try {
    // Try to save to database (will fail silently if DB not connected)
    try {
      await prisma.deviceLog.create({
        data: {
          espNumber: parsed.espNumber,
          messageType: parsed.type,
          message: parsed.message,
          rawData: parsed.rawData,
        },
      });
    } catch (dbError) {
      // Silently fail if database not available (mock mode)
      if (process.env.USE_MOCK_SERIAL !== 'true') {
        console.error('Database error:', dbError.message);
      }
    }

    // Broadcast to all clients (always works)
    socketService.broadcastDeviceLog({
      id: Date.now(),
      espNumber: parsed.espNumber,
      messageType: parsed.type,
      message: parsed.message,
      createdAt: parsed.timestamp.toISOString(),
    });

    // Update device state
    await updateDeviceState(parsed);

    // Handle sensor data
    if (parsed.type === 'GAS' || parsed.type === 'RAIN') {
      await handleSensorData(parsed);
    }

    // Handle RFID scans
    if (parsed.type === 'RFID') {
      await handleRFIDScan(parsed);
    }
  } catch (error) {
    console.error('Error processing serial data:', error);
  }
});

serialService.on('raw', (rawData) => {
  socketService.broadcastRawSerial(rawData);
});

serialService.on('error', (error) => {
  console.error('Serial error:', error);
});

// Update device state based on incoming data
async function updateDeviceState(parsed) {
  const { espNumber, type, message } = parsed;
  const updateData = {
    isOnline: true,
    lastSeenAt: new Date(),
  };

  // Parse specific message types
  if (type === 'STATUS') {
    const parts = message.split(',');
    parts.forEach(part => {
      const [key, value] = part.split('=');
      if (key === 'GAS') updateData.gasValue = parseInt(value);
      if (key === 'LAMP') updateData.lampState = value;
      if (key === 'RAIN') updateData.rainValue = parseInt(value);
      if (key === 'CLOTHESLINE') updateData.clotheslinePos = value;
      if (key === 'DOOR') updateData.doorState = value;
      if (key === 'GATE') updateData.gateState = value;
      if (key === 'WIFI') updateData.wifiStatus = value;
    });
  } else if (type === 'GAS') {
    const value = parseInt(message);
    if (!isNaN(value)) updateData.gasValue = value;
  } else if (type === 'RAIN') {
    const value = parseInt(message);
    if (!isNaN(value)) updateData.rainValue = value;
  } else if (type === 'LAMP') {
    updateData.lampState = message;
  } else if (type === 'CLOTHESLINE') {
    updateData.clotheslinePos = message;
  } else if (type === 'DOOR') {
    updateData.doorState = message;
  } else if (type === 'GATE') {
    updateData.gateState = message;
  }

  // Update or create device state
  try {
    const deviceState = await prisma.deviceState.upsert({
      where: { espNumber },
      update: updateData,
      create: { espNumber, ...updateData },
    });

    // Broadcast device status
    socketService.broadcastDeviceStatus({
      espNumber: deviceState.espNumber,
      isOnline: deviceState.isOnline,
      lastSeenAt: deviceState.lastSeenAt.toISOString(),
      lampState: deviceState.lampState,
      gasValue: deviceState.gasValue,
      rainValue: deviceState.rainValue,
      clotheslinePos: deviceState.clotheslinePos,
      doorState: deviceState.doorState,
      gateState: deviceState.gateState,
      wifiStatus: deviceState.wifiStatus,
    });
  } catch (dbError) {
    // If database fails, still broadcast with mock data
    if (process.env.USE_MOCK_SERIAL === 'true') {
      socketService.broadcastDeviceStatus({
        espNumber,
        isOnline: true,
        lastSeenAt: new Date().toISOString(),
        ...updateData,
      });
    } else {
      throw dbError;
    }
  }
}

// Handle sensor data (save to history and check thresholds)
async function handleSensorData(parsed) {
  const { espNumber, type, message } = parsed;
  const value = parseInt(message);

  if (isNaN(value)) return;

  // Try to save to sensor history
  try {
    await prisma.sensorHistory.create({
      data: {
        espNumber,
        sensorType: type,
        value,
      },
    });
  } catch (dbError) {
    // Silently fail if database not available
    if (process.env.USE_MOCK_SERIAL !== 'true') {
      console.error('Database error saving sensor data:', dbError.message);
    }
  }

  // Broadcast sensor data (always works)
  socketService.broadcastSensorData({
    espNumber,
    sensorType: type,
    value,
    timestamp: new Date().toISOString(),
  });

  // Check thresholds and emit alerts
  const gasThreshold = parseInt(process.env.GAS_THRESHOLD) || 1800;
  const rainThreshold = parseInt(process.env.RAIN_THRESHOLD) || 1600;

  if (type === 'GAS' && value > gasThreshold) {
    socketService.broadcastAlert({
      id: `alert_${Date.now()}`,
      type: 'GAS',
      severity: 'error',
      message: `Gas level exceeded threshold: ${value} > ${gasThreshold}`,
      espNumber,
      timestamp: new Date().toISOString(),
      dismissed: false,
    });
  }

  if (type === 'RAIN' && value > rainThreshold) {
    socketService.broadcastAlert({
      id: `alert_${Date.now()}`,
      type: 'RAIN',
      severity: 'warning',
      message: `Rain detected: ${value} > ${rainThreshold}`,
      espNumber,
      timestamp: new Date().toISOString(),
      dismissed: false,
    });

    // Trigger auto mode if enabled
    await autoModeService.onRainData({ value });
  }
}

// Handle RFID scans
async function handleRFIDScan(parsed) {
  const { espNumber, message: uid } = parsed;

  // Check if UID is in whitelist
  const whitelisted = await prisma.rFIDWhitelist.findUnique({
    where: { uid },
  });

  const authorized = !!whitelisted;

  // Log RFID scan
  await prisma.rFIDLog.create({
    data: {
      uid,
      authorized,
      espNumber,
    },
  });

  // Broadcast RFID scan
  socketService.broadcastRFIDScan({
    uid,
    authorized,
    espNumber,
    scannedAt: new Date().toISOString(),
  });
}

// Check device online status periodically
const OFFLINE_TIMEOUT = (parseInt(process.env.OFFLINE_TIMEOUT) || 7) * 1000;
setInterval(async () => {
  try {
    const now = new Date();
    const devices = await prisma.deviceState.findMany();

    for (const device of devices) {
      const timeSinceLastSeen = now - new Date(device.lastSeenAt);
      const shouldBeOnline = timeSinceLastSeen < OFFLINE_TIMEOUT;

      if (device.isOnline !== shouldBeOnline) {
        await prisma.deviceState.update({
          where: { espNumber: device.espNumber },
          data: { isOnline: shouldBeOnline },
        });

        socketService.broadcastDeviceStatus({
          espNumber: device.espNumber,
          isOnline: shouldBeOnline,
          lastSeenAt: device.lastSeenAt.toISOString(),
        });

        if (!shouldBeOnline) {
          socketService.broadcastAlert({
            id: `alert_${Date.now()}`,
            type: 'OFFLINE',
            severity: 'warning',
            message: `ESP${device.espNumber} is offline`,
            espNumber: device.espNumber,
            timestamp: new Date().toISOString(),
            dismissed: false,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking device status:', error);
  }
}, 5000); // Check every 5 seconds

// Start server
async function start() {
  try {
    console.log('🚀 Starting IoT Smart Home Backend...');

    // Test database connection
    const dbConnected = await testConnection();
    const USE_MOCK_SERIAL = process.env.USE_MOCK_SERIAL === 'true';
    
    if (!dbConnected && !USE_MOCK_SERIAL) {
      console.error('❌ Failed to connect to database. Exiting...');
      console.error('💡 Set USE_MOCK_SERIAL=true in .env to run without database');
      process.exit(1);
    }
    
    if (!dbConnected && USE_MOCK_SERIAL) {
      console.log('⚠️  Running in MOCK MODE without database');
      console.log('💡 Data will be stored in memory and lost on restart');
      console.log('💡 To enable database: fix DATABASE_URL in .env and restart');
    }

    // Initialize auto mode service
    await autoModeService.initialize();

    // Initialize Socket.IO service
    socketService.initialize();

    // Connect to serial port
    await serialService.connect();

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Socket.IO ready`);
      console.log(`✓ CORS enabled for ${FRONTEND_URL}`);
      if (USE_MOCK_SERIAL) {
        console.log(`✓ Mock Serial Mode: Simulating ESP32 devices`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('\n🛑 Shutting down gracefully...');

  try {
    await serialService.disconnect();
    await disconnect();
    httpServer.close(() => {
      console.log('✓ Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
start();

export default app;
