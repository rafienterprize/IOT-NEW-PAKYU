/**
 * StatusIndicator Component Usage Examples
 * 
 * This file demonstrates how to use the StatusIndicator component
 * in various scenarios throughout the IoT Smart Home application.
 */

import StatusIndicator from './StatusIndicator';

export function StatusIndicatorExamples() {
  return (
    <div className="p-8 space-y-8 bg-gray-900 text-gray-100">
      <div>
        <h2 className="text-xl font-bold mb-4 text-green-500">StatusIndicator Examples</h2>
      </div>

      {/* Basic Usage */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-300">Basic Usage</h3>
        <div className="flex gap-4 items-center">
          <StatusIndicator isOnline={true} />
          <StatusIndicator isOnline={false} />
        </div>
      </section>

      {/* Custom Labels */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-300">Custom Labels</h3>
        <div className="flex gap-4 items-center">
          <StatusIndicator isOnline={true} label="Connected" />
          <StatusIndicator isOnline={false} label="Disconnected" />
          <StatusIndicator isOnline={true} label="Active" />
          <StatusIndicator isOnline={false} label="Inactive" />
        </div>
      </section>

      {/* Different Sizes */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-300">Sizes</h3>
        <div className="flex gap-4 items-center">
          <StatusIndicator isOnline={true} size="sm" label="Small" />
          <StatusIndicator isOnline={true} size="md" label="Medium" />
          <StatusIndicator isOnline={true} size="lg" label="Large" />
        </div>
      </section>

      {/* Use Case: Device Cards */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-300">In Device Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">ESP32 #1</h4>
              <StatusIndicator isOnline={true} size="sm" />
            </div>
            <p className="text-sm text-gray-400">Lamp & Gas Sensor</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">ESP32 #2</h4>
              <StatusIndicator isOnline={true} size="sm" />
            </div>
            <p className="text-sm text-gray-400">Clothesline & Rain</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">ESP32 #3</h4>
              <StatusIndicator isOnline={false} size="sm" />
            </div>
            <p className="text-sm text-gray-400">Door & Gate & RFID</p>
          </div>
        </div>
      </section>

      {/* Use Case: Header Connection Status */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-300">In Header</h3>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Dashboard</h4>
            <StatusIndicator isOnline={true} label="WebSocket" size="sm" />
          </div>
        </div>
      </section>

      {/* Use Case: WiFi Status */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-300">WiFi Status</h3>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">ESP32 #1 WiFi</span>
            <StatusIndicator isOnline={true} label="Connected" size="sm" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">ESP32 #2 WiFi</span>
            <StatusIndicator isOnline={true} label="Connected" size="sm" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">ESP32 #3 WiFi</span>
            <StatusIndicator isOnline={false} label="Disconnected" size="sm" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default StatusIndicatorExamples;
