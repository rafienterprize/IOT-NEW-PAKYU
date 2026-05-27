import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useDeviceStatus } from '../hooks/useDeviceStatus';
import { useSensorData } from '../hooks/useSensorData';
import { useCommand } from '../hooks/useCommand';
import DeviceCard from '../components/dashboard/DeviceCard';
import SensorChart from '../components/devices/SensorChart';
import AlertBanner from '../components/dashboard/AlertBanner';
import LogViewer from '../components/dashboard/LogViewer';
import { Wifi, AlertTriangle, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface DeviceLog {
  id: number;
  espNumber: number;
  messageType: string;
  message: string;
  createdAt: string;
}

interface Alert {
  id: string;
  type: 'GAS' | 'RAIN' | 'OFFLINE' | 'RFID';
  severity: 'warning' | 'error' | 'info';
  message: string;
  espNumber: number;
  timestamp: string;
  dismissed: boolean;
}

const GAS_THRESHOLD = 1800;
const RAIN_THRESHOLD = 1600;

export default function Dashboard() {
  const { socket, connected } = useSocket();
  const { devices, loading: devicesLoading, error: devicesError, refresh: refreshDevices } = useDeviceStatus();
  const { data: gasData, latest: latestGas } = useSensorData(1, 'GAS', 60);
  const { data: rainData, latest: latestRain } = useSensorData(2, 'RAIN', 60);
  const { sendWiFiConfig, loading: wifiLoading, error: wifiError } = useCommand();
  
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // WiFi configuration state
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiTarget, setWifiTarget] = useState<number | undefined>(undefined);
  const [wifiSuccess, setWifiSuccess] = useState(false);

  // Fetch initial logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLogsLoading(true);
        setLogsError(null);
        const response = await axios.get('/api/logs?limit=50');
        if (response.data.success) {
          setLogs(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch logs:', err);
        setLogsError('Failed to load logs');
      } finally {
        setLogsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Listen for real-time log updates
  useEffect(() => {
    if (!socket) return;

    const handleDeviceLog = (log: DeviceLog) => {
      setLogs((prev) => [log, ...prev].slice(0, 50));
    };

    socket.on('device:log', handleDeviceLog);

    return () => {
      socket.off('device:log', handleDeviceLog);
    };
  }, [socket]);

  // Listen for alerts
  useEffect(() => {
    if (!socket) return;

    const handleAlert = (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev]);
    };

    socket.on('device:alert', handleAlert);

    return () => {
      socket.off('device:alert', handleAlert);
    };
  }, [socket]);

  // Generate alerts based on sensor thresholds
  useEffect(() => {
    if (latestGas && latestGas.value > GAS_THRESHOLD) {
      const alertId = `gas_${Date.now()}`;
      const existingAlert = alerts.find(
        (a) => a.type === 'GAS' && !a.dismissed && Date.now() - new Date(a.timestamp).getTime() < 30000
      );
      
      if (!existingAlert) {
        setAlerts((prev) => [
          {
            id: alertId,
            type: 'GAS',
            severity: 'error',
            message: `Gas level exceeded threshold: ${latestGas.value} > ${GAS_THRESHOLD}`,
            espNumber: 1,
            timestamp: new Date().toISOString(),
            dismissed: false,
          },
          ...prev,
        ]);
      }
    }
  }, [latestGas, alerts]);

  useEffect(() => {
    if (latestRain && latestRain.value > RAIN_THRESHOLD) {
      const alertId = `rain_${Date.now()}`;
      const existingAlert = alerts.find(
        (a) => a.type === 'RAIN' && !a.dismissed && Date.now() - new Date(a.timestamp).getTime() < 30000
      );
      
      if (!existingAlert) {
        setAlerts((prev) => [
          {
            id: alertId,
            type: 'RAIN',
            severity: 'warning',
            message: `Rain level exceeded threshold: ${latestRain.value} > ${RAIN_THRESHOLD}`,
            espNumber: 2,
            timestamp: new Date().toISOString(),
            dismissed: false,
          },
          ...prev,
        ]);
      }
    }
  }, [latestRain, alerts]);

  // Generate offline alerts
  useEffect(() => {
    devices.forEach((device) => {
      if (!device.isOnline) {
        const alertId = `offline_${device.espNumber}_${Date.now()}`;
        const existingAlert = alerts.find(
          (a) => a.type === 'OFFLINE' && a.espNumber === device.espNumber && !a.dismissed
        );
        
        if (!existingAlert) {
          setAlerts((prev) => [
            {
              id: alertId,
              type: 'OFFLINE',
              severity: 'warning',
              message: `ESP32 #${device.espNumber} is offline`,
              espNumber: device.espNumber,
              timestamp: new Date().toISOString(),
              dismissed: false,
            },
            ...prev,
          ]);
        }
      }
    });
  }, [devices, alerts]);

  const handleDismissAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, dismissed: true } : alert
      )
    );
  };

  const handleWiFiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWifiSuccess(false);
    
    try {
      await sendWiFiConfig(wifiSsid, wifiPassword, wifiTarget);
      setWifiSuccess(true);
      setWifiSsid('');
      setWifiPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setWifiSuccess(false), 3000);
    } catch (err) {
      console.error('WiFi configuration failed:', err);
    }
  };

  const getDeviceType = (espNumber: number): string => {
    switch (espNumber) {
      case 1:
        return 'Lamp, Gas Sensor, Fish Feeder';
      case 2:
        return 'Clothesline, Rain Sensor';
      case 3:
        return 'Door, Gate, RFID Access';
      case 4:
        return 'Master Controller';
      default:
        return 'Unknown Device';
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="h-6 bg-gray-700 rounded w-2/3 mb-3"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">System Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-400">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={() => refreshDevices()}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors"
            title="Refresh device status"
          >
            <RefreshCw size={18} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Error banner for device status - only show critical errors */}
      {devicesError && devicesError.code !== 'NETWORK_ERROR' && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-400">Failed to load device status</p>
            <p className="text-sm text-gray-300 mt-1">{devicesError.message}</p>
          </div>
          <button
            onClick={() => refreshDevices()}
            className="text-sm text-red-400 hover:text-red-300 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Alert Center */}
      {alerts.filter((a) => !a.dismissed).length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Alert Center</h2>
          <AlertBanner alerts={alerts} onDismiss={handleDismissAlert} />
        </div>
      )}

      {/* System Overview Cards */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Device Status</h2>
        {devicesLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {devices.map((device) => (
              <DeviceCard
                key={device.espNumber}
                espNumber={device.espNumber}
                status={device.isOnline ? 'online' : 'offline'}
                lastSeen={device.lastSeenAt}
                deviceType={getDeviceType(device.espNumber)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Real-time Sensor Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gas Sensor Chart */}
        <div>
          <SensorChart
            data={gasData}
            threshold={GAS_THRESHOLD}
            label="Gas Sensor (ESP32 #1)"
            unit="ppm"
            timeWindow={60}
          />
          {latestGas && (
            <div className="mt-2 text-sm text-gray-400">
              Current: <span className="font-semibold text-white">{latestGas.value} ppm</span>
            </div>
          )}
        </div>

        {/* Rain Sensor Chart */}
        <div>
          <SensorChart
            data={rainData}
            threshold={RAIN_THRESHOLD}
            label="Rain Sensor (ESP32 #2)"
            unit="units"
            timeWindow={60}
          />
          {latestRain && (
            <div className="mt-2 text-sm text-gray-400">
              Current: <span className="font-semibold text-white">{latestRain.value} units</span>
            </div>
          )}
        </div>
      </div>

      {/* WiFi Configuration Panel */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wifi className="text-blue-400" size={24} />
          <h2 className="text-xl font-bold text-white">WiFi Configuration</h2>
        </div>
        
        <form onSubmit={handleWiFiSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ssid" className="block text-sm font-medium text-gray-300 mb-2">
                SSID
              </label>
              <input
                type="text"
                id="ssid"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter WiFi SSID"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter WiFi password"
                required
                minLength={8}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="target" className="block text-sm font-medium text-gray-300 mb-2">
              Target Device
            </label>
            <select
              id="target"
              value={wifiTarget || ''}
              onChange={(e) => setWifiTarget(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Devices</option>
              <option value="1">ESP32 #1</option>
              <option value="2">ESP32 #2</option>
              <option value="3">ESP32 #3</option>
              <option value="4">ESP32 #4</option>
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={wifiLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {wifiLoading ? 'Sending...' : 'Send Configuration'}
            </button>
            
            {wifiSuccess && (
              <span className="text-sm text-green-400 font-medium">
                ✓ Configuration sent successfully
              </span>
            )}
            
            {wifiError && (
              <span className="text-sm text-red-400">
                {wifiError.message}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* System Log Stream */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">System Logs</h2>
        {logsLoading ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : logsError ? (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="text-red-400" size={20} />
            <p className="text-sm text-gray-300">{logsError}</p>
          </div>
        ) : (
          <LogViewer logs={logs} limit={50} />
        )}
      </div>
    </div>
  );
}
