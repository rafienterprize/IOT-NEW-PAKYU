import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useDeviceStatus } from '../hooks/useDeviceStatus';
import { useSensorData } from '../hooks/useSensorData';
import { useCommand } from '../hooks/useCommand';
import axios from 'axios';
import { Lightbulb, Fish, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import SensorGauge from '../components/devices/SensorGauge';
import SensorChart from '../components/devices/SensorChart';
import CommandButton from '../components/devices/CommandButton';
import LogViewer from '../components/dashboard/LogViewer';
import StatusIndicator from '../components/ui/StatusIndicator';

interface DeviceLog {
  id: number;
  espNumber: number;
  messageType: string;
  message: string;
  createdAt: string;
}

export default function ESP1() {
  const { socket, connected } = useSocket();
  const { devices } = useDeviceStatus(1);
  const { data: gasData, latest: latestGas } = useSensorData(1, 'GAS', 60);
  const { sendCommand } = useCommand();
  
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [showAlert, setShowAlert] = useState(false);

  const device = devices[0];
  const gasValue = latestGas?.value || device?.gasValue || 0;
  const lampState = device?.lampState || 'OFF';
  const wifiStatus = device?.wifiStatus || 'DISCONNECTED';
  const isOnline = device?.isOnline || false;

  const gasThreshold = 1800;
  const isGasAlert = gasValue > gasThreshold;

  // Fetch logs on mount
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get('/api/logs', {
          params: { esp: 1, limit: 50 }
        });
        if (response.data.success) {
          setLogs(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      }
    };
    fetchLogs();
  }, []);

  // Listen for real-time log updates
  useEffect(() => {
    if (!socket || !connected) return;

    const handleDeviceLog = (log: DeviceLog) => {
      if (log.espNumber === 1) {
        setLogs((prev) => [log, ...prev].slice(0, 50));
      }
    };

    socket.on('device:log', handleDeviceLog);

    return () => {
      socket.off('device:log', handleDeviceLog);
    };
  }, [socket, connected]);

  // Show alert when gas threshold exceeded
  useEffect(() => {
    if (isGasAlert) {
      setShowAlert(true);
    }
  }, [isGasAlert]);

  // Listen for gas alerts
  useEffect(() => {
    if (!socket || !connected) return;

    const handleAlert = (alert: any) => {
      if (alert.espNumber === 1 && alert.type === 'GAS') {
        setShowAlert(true);
      }
    };

    socket.on('device:alert', handleAlert);

    return () => {
      socket.off('device:alert', handleAlert);
    };
  }, [socket, connected]);

  const handleLampToggle = async () => {
    const newState = lampState === 'ON' ? 'OFF' : 'ON';
    await sendCommand(1, `LAMP:${newState}`);
  };

  const handleFeed = async () => {
    await sendCommand(1, 'FEED');
  };

  return (
    <div className="space-y-6">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ESP32 #1 - Smart Lamp, Gas Detector & Fish Feeder</h1>
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
                Gas level ({gasValue}) has exceeded the threshold ({gasThreshold})
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAlert(false)}
            className="text-red-400 hover:text-red-300 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Sensor Data */}
        <div className="space-y-6">
          {/* Gas Sensor Gauge */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <SensorGauge
              value={gasValue}
              max={4095}
              threshold={gasThreshold}
              label="Gas Sensor"
              unit="ppm"
            />
          </div>

          {/* Gas Sensor Chart */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <SensorChart
              data={gasData}
              threshold={gasThreshold}
              label="Gas Level History"
              unit="ppm"
              timeWindow={60}
            />
          </div>
        </div>

        {/* Right Column - Controls */}
        <div className="space-y-6">
          {/* Smart Lamp Control */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb 
                className={lampState === 'ON' ? 'text-yellow-400' : 'text-gray-500'} 
                size={24} 
              />
              <h2 className="text-lg font-semibold">Smart Lamp</h2>
            </div>
            <div className="text-2xl font-bold mb-4">
              Status: <span className={lampState === 'ON' ? 'text-yellow-400' : 'text-gray-400'}>
                {lampState}
              </span>
            </div>
            <CommandButton
              label={lampState === 'ON' ? 'Turn OFF' : 'Turn ON'}
              command={`LAMP:${lampState === 'ON' ? 'OFF' : 'ON'}`}
              icon={Lightbulb}
              variant={lampState === 'ON' ? 'secondary' : 'primary'}
              onSend={handleLampToggle}
            />
          </div>

          {/* Fish Feeder Control */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Fish className="text-blue-400" size={24} />
              <h2 className="text-lg font-semibold">Fish Feeder</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Click the button below to dispense fish food
            </p>
            <CommandButton
              label="Feed Now"
              command="FEED"
              icon={Fish}
              variant="primary"
              onSend={handleFeed}
            />
          </div>

          {/* Device Logs */}
          <div>
            <LogViewer logs={logs} espFilter={1} limit={50} />
          </div>
        </div>
      </div>
    </div>
  );
}
