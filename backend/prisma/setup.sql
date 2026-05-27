-- IoT Smart Home Database Setup Script
-- Run this script after creating the database

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Note: Run 'npx prisma migrate dev --name init' first to create tables
-- Then run the commands below to setup TimescaleDB

-- Convert sensor_history to hypertable
SELECT create_hypertable('sensor_history', 'timestamp', if_not_exists => TRUE);

-- Create retention policy (optional - keep data for 30 days)
SELECT add_retention_policy('sensor_history', INTERVAL '30 days', if_not_exists => TRUE);

-- Create continuous aggregate for hourly averages (optional)
CREATE MATERIALIZED VIEW IF NOT EXISTS sensor_history_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', timestamp) AS bucket,
  "espNumber",
  "sensorType",
  AVG(value) AS avg_value,
  MAX(value) AS max_value,
  MIN(value) AS min_value
FROM sensor_history
GROUP BY bucket, "espNumber", "sensorType";

-- Create initial AutoModeConfig row (singleton with id=1)
INSERT INTO auto_mode_config (id, enabled, "rainThreshold")
VALUES (1, false, 1600)
ON CONFLICT (id) DO NOTHING;
