import { useEffect, useState, useCallback } from 'react';
import { useDeviceStatus } from '../hooks/useDeviceStatus';
import { useSensorData } from '../hooks/useSensorData';
import { useCommand } from '../hooks/useCommand';
import { MoveHorizontal, ArrowLeftCircle, ArrowRightCircle, AlertTriangle } from 'lucide-react';
import SensorGauge from '../components/devices/SensorGauge';
import SensorChart from '../components/devices/SensorChart';
import CommandButton from '../components/devices/CommandButton';
import LogViewer from '../components/dashboard/LogViewer';
import StatusIndicator from '../components/ui/StatusIndicator';
import { getLogs, getAutoMode, setAutoMode, type DeviceLog } from '../services/esp4Api';
import { RAIN_THRESHOLD, POLLING_INTERVAL_MS } from '../config/esp4';

export default function ESP2() {
  const { devices } = useDeviceStatus(2);
  const { data: rainData, latest: latestRain } = useSensorData(2, 'RAIN', 60);
  const { sendCommand } = useCommand();

  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [autoMode, setAutoModeState] = useState(false);
  const [autoModeLoading, setAutoModeLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const device = devices[0];
  const rainValue = latestRain?.value ?? device?.rainValue ?? 0;
  const clotheslinePos = device?.clotheslinePos ?? 'OUT';
  const isOnline = device?.isOnline ?? false;
  const isRaining = rainValue > RAIN_THRESHOLD;

  // Fetch logs ESP2 via service layer
  const fetchLogs = useCallback(async () => {
    try {
      const data = await getLogs(2, 50);
      setLogs(data);
    } catch (err) {
      console.error('[ESP2] Failed to fetch logs:', err);
    }
  }, []);

  // Fetch auto mode via service layer
  const fetchAutoMode = useCallback(async () => {
    try {
      const enabled = await getAutoMode();
      setAutoModeState(enabled);
    } catch (err) {
      console.error('[ESP2] Failed to fetch auto mode:', err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchAutoMode();
    const logsTimer = setInterval(fetchLogs, POLLING_INTERVAL_MS);
    const autoTimer = setInterval(fetchAutoMode, POLLING_INTERVAL_MS);
    return () => {
      clearInterval(logsTimer);
      clearInterval(autoTimer);
    };
  }, [fetchLogs, fetchAutoMode]);

  useEffect(() => {
    if (isRaining) setShowAlert(true);
  }, [isRaining]);

  const handleClotheslineMove = async (position: 'IN' | 'OUT') => {
    await sendCommand(2, `CLOTHESLINE:${position}`);
  };

  const handleAutoModeToggle = async () => {
    setAutoModeLoading(true);
    try {
      const newMode = !autoMode;
      await setAutoMode(newMode);
      setAutoModeState(newMode);
    } catch (err) {
      console.error('[ESP2] Failed to toggle auto mode:', err);
    } finally {
      setAutoModeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ESP32 #2 - Smart Clothesline &amp; Rain Sensor</h1>
        <StatusIndicator isOnline={isOnline} />
      </div>

      {/* Rain Alert */}
      {showAlert && isRaining && (
        <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-blue-500" size={24} />
            <div>
              <h3 className="font-semibold text-blue-400">Rain Detected!</h3>
              <p className="text-sm text-blue-300">
                Rain level ({rainValue}) has exceeded the threshold ({RAIN_THRESHOLD})
                {autoMode && ' - Auto mode will move clothesline IN'}
              </p>
            </div>
          </div>
          <button onClick={() => setShowAlert(false)} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Sensor */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <SensorGauge value={rainValue} max={4095} threshold={RAIN_THRESHOLD} label="Rain Sensor" unit="level" />
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <SensorChart data={rainData} threshold={RAIN_THRESHOLD} label="Rain Level History" unit="level" timeWindow={60} />
          </div>
        </div>

        {/* Right — Controls */}
        <div className="space-y-6">
          {/* Clothesline Control */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <MoveHorizontal className="text-purple-400" size={24} />
              <h2 className="text-lg font-semibold">Clothesline Control</h2>
            </div>

            {/* Position Indicator */}
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-2">Current Position</div>
              <div className="flex items-center justify-center gap-4 p-4 bg-gray-900 rounded-lg">
                <div className={`flex items-center gap-2 ${clotheslinePos === 'IN' ? 'text-blue-400' : 'text-gray-600'}`}>
                  <ArrowLeftCircle size={24} />
                  <span className="font-semibold">IN</span>
                </div>
                <div className="flex-1 h-2 bg-gray-700 rounded-full relative">
                  <div className={`absolute top-0 h-2 rounded-full transition-all ${clotheslinePos === 'IN' ? 'bg-blue-500 w-0' : 'bg-green-500 w-full'}`} />
                </div>
                <div className={`flex items-center gap-2 ${clotheslinePos === 'OUT' ? 'text-green-400' : 'text-gray-600'}`}>
                  <span className="font-semibold">OUT</span>
                  <ArrowRightCircle size={24} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <CommandButton label="Move IN" command="CLOTHESLINE:IN" icon={ArrowLeftCircle} variant="primary" onSend={() => handleClotheslineMove('IN')} />
                <CommandButton label="Move OUT" command="CLOTHESLINE:OUT" icon={ArrowRightCircle} variant="secondary" onSend={() => handleClotheslineMove('OUT')} />
              </div>

              {/* Auto Mode Toggle */}
              <div className="border-t border-gray-700 pt-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold">Auto Mode</span>
                    <p className="text-xs text-gray-400 mt-1">
                      Automatically moves clothesline IN when rain is detected
                    </p>
                  </div>
                  <button
                    onClick={handleAutoModeToggle}
                    disabled={autoModeLoading}
                    className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${autoMode ? 'bg-green-600' : 'bg-gray-600'}`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${autoMode ? 'translate-x-6' : ''}`} />
                  </button>
                </label>
              </div>
            </div>
          </div>

          {/* Logs */}
          <div>
            <LogViewer logs={logs} espFilter={2} limit={50} />
          </div>
        </div>
      </div>
    </div>
  );
}
