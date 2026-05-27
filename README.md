# IoT Smart Home Web Application

Full-stack real-time monitoring and control system for ESP32-based smart home devices.

## 🏗️ Architecture

- **Backend**: Node.js + Express + Socket.IO + PostgreSQL + TimescaleDB
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Hardware**: 4x ESP32 microcontrollers (UART Serial communication)

## 📋 Features

### ESP32 #1 - Smart Lamp, Gas Detector & Fish Feeder
- Real-time gas sensor monitoring with alerts (threshold: 1800)
- Remote lamp control (ON/OFF)
- Fish feeder automation
- WiFi configuration

### ESP32 #2 - Smart Clothesline & Rain Sensor
- Real-time rain sensor monitoring
- Manual clothesline control (IN/OUT)
- **Auto Mode**: Automatically moves clothesline IN when rain detected
- Rain alerts (threshold: 1600)

### ESP32 #3 - Smart Door, Gate & RFID
- Remote door control (auto-closes after 3s)
- Remote gate control (auto-closes after 4s)
- RFID access logging
- RFID whitelist management

### System Features
- Real-time bidirectional communication via Socket.IO
- Time-series sensor data storage with TimescaleDB
- Device online/offline detection (7-second timeout)
- Mock mode for development without hardware
- Dark-themed responsive UI

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- PostgreSQL v14+ with TimescaleDB extension
- (Optional) ESP32 hardware with USB Serial connection

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
createdb smarthome
npm run prisma:migrate
psql -d smarthome -f prisma/setup.sql

# Generate Prisma client
npm run prisma:generate

# Run in development mode (with mock serial)
npm run dev

# Run in production mode
npm start
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📡 API Endpoints

### Device Status
- `GET /api/status` - Get all device states
- `GET /api/logs?esp=1&limit=50` - Get device logs

### Commands
- `POST /api/command` - Send command to ESP device
  ```json
  { "target": 1, "command": "LAMP:ON" }
  ```

### WiFi Configuration
- `POST /api/wifi` - Configure WiFi for devices
  ```json
  { "ssid": "MyWiFi", "password": "password123" }
  ```

### RFID Management
- `GET /api/rfid/whitelist` - Get RFID whitelist
- `POST /api/rfid/whitelist` - Add RFID UID
- `DELETE /api/rfid/whitelist/:uid` - Remove RFID UID

### Sensor Data
- `GET /api/sensors/history?esp=1&type=GAS&limit=60` - Get sensor history

### Auto Mode
- `GET /api/automode` - Get auto mode status
- `POST /api/automode` - Enable/disable auto mode
  ```json
  { "enabled": true }
  ```

## 🔌 Socket.IO Events

### Server → Client
- `device:log` - New device log
- `device:status` - Device status update
- `device:alert` - Threshold alert
- `sensor:data` - Real-time sensor data
- `rfid:scan` - RFID card scanned
- `connection:status` - Connection status

### Client → Server
- `command:send` - Send command
- `wifi:send` - Send WiFi config

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                 # Run all tests
npm run test:watch       # Watch mode
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🔧 Development Mode

The system supports **Mock Mode** for development without hardware:

```env
# backend/.env
USE_MOCK_SERIAL=true
```

Mock mode simulates:
- Periodic sensor data (gas, rain)
- Device status updates
- Command responses
- RFID scans

## 📊 Database Schema

### Core Tables
- `device_logs` - All device messages
- `device_states` - Current device states
- `sensor_history` - Time-series sensor data (TimescaleDB hypertable)
- `rfid_whitelist` - Authorized RFID UIDs
- `rfid_logs` - RFID scan history
- `auto_mode_config` - Auto mode settings (singleton)

## 🎨 UI Screenshots

- **Dashboard**: System overview with all device statuses
- **ESP1 Page**: Gas monitoring, lamp control, fish feeder
- **ESP2 Page**: Rain monitoring, clothesline control, auto mode
- **ESP3 Page**: Door/gate control, RFID management
- **Settings**: WiFi configuration, system info

## 🔐 Security Notes

- RFID whitelist is for audit/logging only (physical access control on ESP32)
- WiFi passwords transmitted in plaintext (use HTTPS in production)
- No authentication implemented (add auth middleware for production)

## 📝 Serial Protocol

### Message Format (ESP → Server)
```
ESPx:TYPE:MESSAGE
```

Examples:
```
ESP1:STATUS:OK,GAS=1200,LAMP=OFF,WIFI=OK
ESP1:GAS:1850
ESP2:RAIN:ALERT_CLOTHESLINE_IN
ESP3:RFID:A1B2C3D4
```

### Command Format (Server → ESP)
```
COMMAND:PARAMETER
```

Examples:
```
LAMP:ON
FEED
CLOTHESLINE:IN
DOOR:OPEN
WIFI:MyWiFi,Password123
```

## 🛠️ Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Run `npm run prisma:generate`

### Serial port error
- Set `USE_MOCK_SERIAL=true` for development
- Check SERIAL_PORT in .env (COM3 on Windows, /dev/ttyUSB0 on Linux)
- Verify ESP32 #4 is connected via USB

### Frontend can't connect
- Ensure backend is running on port 3001
- Check CORS settings in backend
- Verify Socket.IO connection in browser console

## 📦 Project Structure

```
IOT-NEW-PAKYU/
├── backend/
│   ├── src/
│   │   ├── services/      # Serial, Socket, Command, Auto Mode
│   │   ├── routes/        # API endpoints
│   │   ├── db.js          # Database connection
│   │   └── app.js         # Main application
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── setup.sql      # TimescaleDB setup
│   └── tests/             # Unit & integration tests
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
│   └── public/
└── code iot/              # ESP32 firmware (Arduino)
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👥 Authors

- IoT Smart Home Team

## 🙏 Acknowledgments

- ESP32 community
- Socket.IO team
- TimescaleDB team
- React & Vite teams
