import { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Wifi, Database, Info, Activity, Terminal, CheckCircle, XCircle } from 'lucide-react';

export default function Settings() {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<number | undefined>(undefined);
  
  // System info state
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [serialPort, setSerialPort] = useState<string>('');
  const [mockMode, setMockMode] = useState<boolean>(false);
  const [uptime, setUptime] = useState<string>('');
  const [version] = useState<string>('1.0.0');

  // Fetch system information
  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        // Check database connection
        const statusRes = await axios.get('/api/status');
        setDbStatus(statusRes.data.success ? 'connected' : 'disconnected');
      } catch (error) {
        setDbStatus('disconnected');
      }

      // Get environment info from backend (if available)
      // For now, use defaults
      setSerialPort(import.meta.env.VITE_SERIAL_PORT || 'COM3');
      setMockMode(import.meta.env.VITE_USE_MOCK_SERIAL === 'true');
    };

    fetchSystemInfo();

    // Update uptime every second
    const startTime = Date.now();
    const uptimeInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      setUptime(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(uptimeInterval);
  }, []);

  const sendWiFiConfig = async () => {
    if (!ssid || !password) {
      setMessage('Please enter both SSID and password');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await axios.post('/api/wifi', { 
        ssid, 
        password,
        target 
      });
      if (res.data.success) {
        setMessage('WiFi configuration sent successfully!');
        setSsid('');
        setPassword('');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Failed to send WiFi configuration');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Serial Port Configuration */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Terminal className="text-purple-400" size={24} />
          <h2 className="text-lg font-semibold">Serial Port Configuration</h2>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-300">Serial Port</div>
              <div className="text-xs text-gray-500 mt-1">USB connection to ESP32 #4</div>
            </div>
            <div className="font-mono text-sm text-blue-400">{serialPort}</div>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-300">Baud Rate</div>
              <div className="text-xs text-gray-500 mt-1">Communication speed</div>
            </div>
            <div className="font-mono text-sm text-blue-400">9600</div>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-300">Mock Mode</div>
              <div className="text-xs text-gray-500 mt-1">Simulated hardware for development</div>
            </div>
            <div className={`flex items-center gap-2 ${mockMode ? 'text-yellow-400' : 'text-gray-400'}`}>
              {mockMode ? (
                <>
                  <CheckCircle size={16} />
                  <span className="text-sm font-semibold">Enabled</span>
                </>
              ) : (
                <>
                  <XCircle size={16} />
                  <span className="text-sm font-semibold">Disabled</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Database Connection Status */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Database className="text-green-400" size={24} />
          <h2 className="text-lg font-semibold">Database Connection</h2>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
          <div>
            <div className="text-sm font-medium text-gray-300">PostgreSQL + TimescaleDB</div>
            <div className="text-xs text-gray-500 mt-1">Time-series sensor data storage</div>
          </div>
          <div className="flex items-center gap-2">
            {dbStatus === 'checking' ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            ) : dbStatus === 'connected' ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-semibold text-green-400">Connected</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-sm font-semibold text-red-400">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Info className="text-blue-400" size={24} />
          <h2 className="text-lg font-semibold">System Information</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between p-2 hover:bg-gray-900 rounded">
            <span className="text-gray-400">Application Version:</span>
            <span className="font-mono text-white">{version}</span>
          </div>
          <div className="flex justify-between p-2 hover:bg-gray-900 rounded">
            <span className="text-gray-400">Backend URL:</span>
            <span className="font-mono text-white">http://localhost:3001</span>
          </div>
          <div className="flex justify-between p-2 hover:bg-gray-900 rounded">
            <span className="text-gray-400">Frontend URL:</span>
            <span className="font-mono text-white">http://localhost:5173</span>
          </div>
          <div className="flex justify-between p-2 hover:bg-gray-900 rounded">
            <span className="text-gray-400">Environment:</span>
            <span className="text-yellow-400 font-semibold">Development</span>
          </div>
          <div className="flex justify-between p-2 hover:bg-gray-900 rounded">
            <span className="text-gray-400 flex items-center gap-2">
              <Activity size={14} />
              Session Uptime:
            </span>
            <span className="font-mono text-white">{uptime}</span>
          </div>
        </div>
      </div>

      {/* WiFi Configuration */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Wifi className="text-blue-400" size={24} />
          <h2 className="text-lg font-semibold">WiFi Configuration</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">SSID</label>
            <input
              type="text"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter WiFi SSID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter WiFi password"
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target Device</label>
            <select
              value={target || ''}
              onChange={(e) => setTarget(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">All Devices</option>
              <option value="1">ESP32 #1 (Lamp, Gas, Feeder)</option>
              <option value="2">ESP32 #2 (Clothesline, Rain)</option>
              <option value="3">ESP32 #3 (Door, Gate, RFID)</option>
              <option value="4">ESP32 #4 (Master Controller)</option>
            </select>
          </div>

          <button
            onClick={sendWiFiConfig}
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Configuration'}
          </button>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.includes('success')
                  ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                  : 'bg-red-600/20 text-red-400 border border-red-500/30'
              }`}
            >
              {message}
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            {target 
              ? `Configuration will be sent to ESP32 #${target} only.`
              : 'Configuration will be broadcast to all ESP32 devices.'}
          </p>
        </div>
      </div>

      {/* Additional Settings Info */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <SettingsIcon className="text-gray-400" size={24} />
          <h2 className="text-lg font-semibold">Configuration Notes</h2>
        </div>
        <div className="space-y-3 text-sm text-gray-400">
          <p>
            • Serial port configuration is set via environment variables in the backend .env file
          </p>
          <p>
            • Mock mode simulates ESP32 devices for development without physical hardware
          </p>
          <p>
            • Database connection uses PostgreSQL with TimescaleDB extension for time-series data
          </p>
          <p>
            • WiFi configuration commands are sent via the master controller (ESP32 #4)
          </p>
        </div>
      </div>
    </div>
  );
}
