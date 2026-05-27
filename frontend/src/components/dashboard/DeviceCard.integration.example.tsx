import { BrowserRouter } from 'react-router-dom';
import { useDeviceStatus } from '../../hooks/useDeviceStatus';
import DeviceCard from './DeviceCard';

/**
 * Integration Example: DeviceCard with useDeviceStatus Hook
 * 
 * This example demonstrates how to use DeviceCard with real device data
 * from the useDeviceStatus hook.
 */

// Helper function to get device type description
function getDeviceType(espNumber: number): string {
  const deviceTypes: Record<number, string> = {
    1: 'Lamp, Gas Sensor, Fish Feeder',
    2: 'Clothesline, Rain Sensor',
    3: 'Door, Gate, RFID',
    4: 'Master Controller',
  };
  return deviceTypes[espNumber] || 'Unknown Device';
}

export default function DeviceCardIntegrationExample() {
  const { devices, loading, error } = useDeviceStatus();

  if (loading) {
    return (
      <div className="bg-gray-900 min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Device Status</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 animate-pulse"
              >
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3 mb-3"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Device Status</h1>
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 text-red-400">
            <p className="font-semibold mb-2">Error loading device status</p>
            <p className="text-sm">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="bg-gray-900 min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Device Status</h1>
          
          {devices.length === 0 ? (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-400">No devices found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>
    </BrowserRouter>
  );
}

/**
 * Alternative: Using DeviceCard for a specific ESP device
 */
export function SingleDeviceExample() {
  const { devices, loading, error } = useDeviceStatus(1); // Filter for ESP #1

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-400">Error: {error.message}</div>;
  }

  const device = devices[0];

  if (!device) {
    return <div className="text-gray-400">Device not found</div>;
  }

  return (
    <BrowserRouter>
      <DeviceCard
        espNumber={device.espNumber}
        status={device.isOnline ? 'online' : 'offline'}
        lastSeen={device.lastSeenAt}
        deviceType={getDeviceType(device.espNumber)}
      />
    </BrowserRouter>
  );
}
