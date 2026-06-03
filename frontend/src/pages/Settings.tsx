import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Wifi, Info, Activity, CheckCircle } from 'lucide-react';
import { useCommand } from '../hooks/useCommand';
import { ESP4_BASE_URL, GAS_THRESHOLD, RAIN_THRESHOLD, POLLING_INTERVAL_MS } from '../config/esp4';

export default function Settings() {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [target, setTarget] = useState<number | undefined>(undefined);
  const [message, setMessage] = useState('');
  const [uptime, setUptime] = useState('');
  const [version] = useState('1.0.0');

  const { sendWiFiConfig, loading } = useCommand();

  // Session uptime counter
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      setUptime(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSendWiFi = async () => {
    if (!ssid || !password) {
      setMessage('Please enter both SSID and password');
      return;
    }
    setMessage('');
    try {
      await sendWiFiConfig(ssid, password, target);
      setMessage('WiFi configuration sent successfully!');
      setSsid('');
      setPassword('');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to send WiFi configuration');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* ESP4 Connection */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="text-green-400" size={24} />
          <h2 className="text-lg font-semibold">ESP4 Connection</h2>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-300">ESP4 Gateway URL</div>
              <div className="text-xs text-gray-500 mt-1">
                Edit <code className="text-green-400">src/config/esp4.ts</code> untuk mengubah IP
              </div>
            </div>
            <div className="font-mono text-sm text-blue-400">{ESP4_BASE_URL}</div>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-300">Polling Interval</div>
              <div className="text-xs text-gray-500 mt-1">Frekuensi update data dari ESP4</div>
            </div>
            <div className="font-mono text-sm text-blue-400">{POLLING_INTERVAL_MS / 1000}s</div>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-300">Gas Threshold</div>
              <div className="text-xs text-gray-500 mt-1">Batas nilai sensor gas untuk alert</div>
            </div>
            <div className="font-mono text-sm text-blue-400">{GAS_THRESHOLD} ppm</div>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-300">Rain Threshold</div>
              <div className="text-xs text-gray-500 mt-1">Batas nilai sensor hujan untuk alert</div>
            </div>
            <div className="font-mono text-sm text-blue-400">{RAIN_THRESHOLD}</div>
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
            <span className="text-gray-400">Architecture:</span>
            <span className="font-mono text-white">Frontend → ESP4 (Direct HTTP)</span>
          </div>
          <div className="flex justify-between p-2 hover:bg-gray-900 rounded">
            <span className="text-gray-400">Backend:</span>
            <span className="text-green-400 font-semibold">None (Static Frontend)</span>
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
              type="text" value={ssid} onChange={(e) => setSsid(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter WiFi SSID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter WiFi password" minLength={8}
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
            onClick={handleSendWiFi} disabled={loading}
            className="w-full py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Configuration'}
          </button>
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('success')
                ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                : 'bg-red-600/20 text-red-400 border border-red-500/30'
            }`}>
              {message}
            </div>
          )}
        </div>
        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            {target ? `Configuration will be sent to ESP32 #${target} only.` : 'Configuration will be broadcast to all ESP32 devices.'}
          </p>
        </div>
      </div>

      {/* Configuration Notes */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <SettingsIcon className="text-gray-400" size={24} />
          <h2 className="text-lg font-semibold">Configuration Notes</h2>
        </div>
        <div className="space-y-3 text-sm text-gray-400">
          <p>• Ubah <code className="text-green-400">ESP4_BASE_URL</code> di <code className="text-green-400">src/config/esp4.ts</code> sesuai IP ESP4 di jaringan lokal</p>
          <p>• ESP4 adalah gateway utama — menerima semua HTTP request dari browser, meneruskan command ke ESP1/2/3 via UART</p>
          <p>• Frontend adalah website statis, tidak memerlukan backend Node.js atau database</p>
          <p>• Data sensor diperbarui setiap {POLLING_INTERVAL_MS / 1000} detik via HTTP polling ke ESP4</p>
          <p>• Jika browser menampilkan CORS error, pastikan ESP4 mengirim header <code className="text-green-400">Access-Control-Allow-Origin: *</code></p>
          <p>• Semua request frontend hanya ke ESP4. ESP4 yang berkomunikasi ke ESP1, ESP2, ESP3</p>
        </div>
      </div>
    </div>
  );
}
