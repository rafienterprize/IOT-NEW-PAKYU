import { useEffect, useState, useCallback } from 'react';
import { useDeviceStatus } from '../hooks/useDeviceStatus';
import { useSensorData } from '../hooks/useSensorData';
import { useCommand } from '../hooks/useCommand';
import { Lightbulb, Fish, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import SensorGauge from '../components/devices/SensorGauge';
import SensorChart from '../components/devices/SensorChart';
import CommandButton from '../components/devices/CommandButton';
import LogViewer from '../components/dashboard/LogViewer';
import StatusIndicator from '../components/ui/StatusIndicator';
import { getLogs, type DeviceLog } from '../services/esp4Api';
import { GAS_THRESHOLD, POLLING_INTERVAL_MS } from '../config/esp4';

export default function ESP1() {
  const { devices } = useDeviceStatus(1);
  const { data: gasData, latest: latestGas } = useSensorData(1, 'GAS', 60);
  const { sendCommand } = useCommand();

  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [showAlert, setShowAlert] = useState(false);

  const device = devices[0];
  const gasValue = latestGas?.value ?? device?.gasValue ?? 0;
  const lampState = device?.lampState ?? 'OFF';
  const wifiStatus = device?.wifiStatus ?? 'DISCONNECTED';
  const isOnline = device?.isOnline ?? false;
  const isGasAlert = gasValue > GAS_THRESHOLD;

  // Fetch logs ESP1 via service layer
  const fetchLogs = useCallback(async () => {
    try {
      const data = await getLogs(1, 50);
      setLogs(data);
    } catch (err) {
      console.error('[ESP1] Failed to fetch logs:', err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const timer = setInterval(fetchLogs, POLLING_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchLogs]);

  useEffect(() => {
    if (isGasAlert) setShowAlert(true);
  }, [isGasAlert]);

  const handleLampToggle = async () => {
    await sendCommand(1, `LAMP:${lampState === 'ON' ? 'OFF' : 'ON'}`);
  };

  const handleFeed = async () => {
    await sendCommand(1, 'FEED');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ESP32 #1 - Smart Lamp, Gas Detector &amp; Fish Feeder</h1>
        <div className="flex items-center gap-3">
          <StatusIndicator isOnline={isOnline} />
          {wifiStatus === 'OK' ? (
            <div className="flex items-center gap-2 text-green-400">
              <Wifi size={20} />
              <span className="text-sm">WiFi Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <WifiOff size={20} />
              <span className="text-sm">WiFi Disconnected</span>
            </div>
          )}
        </div>
      </div>

      {/* Gas Alert Banner */}
      {showAlert && isGasAlert && (
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={24} />
            <div>
              <h3 className="font-semibold text-red-400">Gas Alert!</h3>
              <p className="text-sm text-red-300">
                Gas level ({gasValue}) has exceeded the threshold ({GAS_THRESHOLD})
              </p>
            </div>
          </div>
          <button onClick={() => setShowAlert(false)} className="text-red-400 hover:text-red-300 text-sm font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Sensor */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <SensorGauge value={gasValue} max={4095} threshold={GAS_THRESHOLD} label="Gas Sensor" unit="ppm" />
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <SensorChart data={gasData} threshold={GAS_THRESHOLD} label="Gas Level History" unit="ppm" timeWindow={60} />
          </div>
        </div>

        {/* Right — Controls */}
        <div className="space-y-6">
          {/* Smart Lamp */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className={lampState === 'ON' ? 'text-yellow-400' : 'text-gray-500'} size={24} />
              <h2 className="text-lg font-semibold">Smart Lamp</h2>
            </div>
            <div className="text-2xl font-bold mb-4">
              Status:{' '}
              <span className={lampState === 'ON' ? 'text-yellow-400' : 'text-gray-400'}>{lampState}</span>
            </div>
            <CommandButton
              label={lampState === 'ON' ? 'Turn OFF' : 'Turn ON'}
              command={`LAMP:${lampState === 'ON' ? 'OFF' : 'ON'}`}
              icon={Lightbulb}
              variant={lampState === 'ON' ? 'secondary' : 'primary'}
              onSend={handleLampToggle}
            />
          </div>

          {/* Fish Feeder */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Fish className="text-blue-400" size={24} />
              <h2 className="text-lg font-semibold">Fish Feeder</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">Click the button below to dispense fish food</p>
            <CommandButton label="Feed Now" command="FEED" icon={Fish} variant="primary" onSend={handleFeed} />
          </div>

          {/* Logs */}
          <div>
            <LogViewer logs={logs} espFilter={1} limit={50} />
          </div>
        </div>
      </div>
    </div>
  );
}
