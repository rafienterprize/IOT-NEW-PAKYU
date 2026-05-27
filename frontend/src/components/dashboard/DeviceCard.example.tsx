import { BrowserRouter } from 'react-router-dom';
import DeviceCard from './DeviceCard';

/**
 * DeviceCard Component Examples
 * 
 * This file demonstrates various usage scenarios for the DeviceCard component.
 */

export default function DeviceCardExamples() {
  return (
    <BrowserRouter>
      <div className="bg-gray-900 min-h-screen p-8">
        <h1 className="text-2xl font-bold text-white mb-6">DeviceCard Examples</h1>
        
        <div className="space-y-6 max-w-2xl">
          {/* Example 1: Online device */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Online Device</h2>
            <DeviceCard
              espNumber={1}
              status="online"
              lastSeen={new Date().toISOString()}
              deviceType="Lamp, Gas Sensor, Fish Feeder"
            />
          </div>

          {/* Example 2: Offline device */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Offline Device</h2>
            <DeviceCard
              espNumber={2}
              status="offline"
              lastSeen={new Date(Date.now() - 300000).toISOString()} // 5 minutes ago
              deviceType="Clothesline, Rain Sensor"
            />
          </div>

          {/* Example 3: Recently seen device */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Recently Seen (30s ago)</h2>
            <DeviceCard
              espNumber={3}
              status="online"
              lastSeen={new Date(Date.now() - 30000).toISOString()}
              deviceType="Door, Gate, RFID"
            />
          </div>

          {/* Example 4: Device seen hours ago */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Seen 2 Hours Ago</h2>
            <DeviceCard
              espNumber={4}
              status="offline"
              lastSeen={new Date(Date.now() - 7200000).toISOString()}
              deviceType="Master Controller"
            />
          </div>

          {/* Example 5: All devices in a grid */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Grid Layout</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DeviceCard
                espNumber={1}
                status="online"
                lastSeen={new Date().toISOString()}
                deviceType="Lamp, Gas Sensor, Fish Feeder"
              />
              <DeviceCard
                espNumber={2}
                status="online"
                lastSeen={new Date(Date.now() - 5000).toISOString()}
                deviceType="Clothesline, Rain Sensor"
              />
              <DeviceCard
                espNumber={3}
                status="offline"
                lastSeen={new Date(Date.now() - 600000).toISOString()}
                deviceType="Door, Gate, RFID"
              />
              <DeviceCard
                espNumber={4}
                status="online"
                lastSeen={new Date(Date.now() - 2000).toISOString()}
                deviceType="Master Controller"
              />
            </div>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
