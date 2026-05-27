# IoT Smart Home Backend

Backend server for IoT Smart Home Web Application with ESP32 integration.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- TimescaleDB extension

## Installation

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Setup database:
```bash
# Create PostgreSQL database
createdb smarthome

# Run Prisma migration
npm run prisma:migrate

# Run TimescaleDB setup
psql -d smarthome -f prisma/setup.sql
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

Run in production mode:
```bash
npm start
```

## Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Mock Mode

For development without hardware, set in `.env`:
```
USE_MOCK_SERIAL=true
```

## Project Structure

```
backend/
├── src/
│   ├── controllers/    # Request handlers
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── app.js          # Main application
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── setup.sql       # TimescaleDB setup
└── tests/              # Test files
```
