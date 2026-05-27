# DeviceCard Component

A card component that displays ESP32 device status information with online/offline indicators, last seen timestamps, and links to device detail pages.

## Features

- **Online/Offline Status**: Visual indicator with color-coded badge
- **WiFi Icon**: Shows connected (green) or disconnected (gray) WiFi icon
- **Last Seen Timestamp**: Human-readable relative time (e.g., "30s ago", "2m ago")
- **Device Type**: Displays the type of devices controlled by the ESP32
- **Navigation**: Clickable card that links to the device detail page
- **Hover Effects**: Smooth transitions on hover for better UX

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `espNumber` | `number` | Yes | ESP32 device number (1-4) |
| `status` | `'online' \| 'offline'` | Yes | Current online status of the device |
| `lastSeen` | `string` | Yes | ISO 8601 timestamp of last communication |
| `deviceType` | `string` | Yes | Description of devices controlled by this ESP32 |

## Usage

### Basic Usage

```tsx
import DeviceCard from './components/dashboard/DeviceCard';

function Dashboard() {
  return (
    <DeviceCard
      espNumber={1}
      status="online"
      lastSeen={new Date().toISOString()}
      deviceType="Lamp, Gas Sensor, Fish Feeder"
    />
  );
}
```

### With Device Status Hook

```tsx
import { useDeviceStatus } from './hooks/useDeviceStatus';
import DeviceCard from './components/dashboard/DeviceCard';

function Dashboard() {
  const { devices, loading } = useDeviceStatus();

  if (loading) return <div>Loading...</div>;

  return (
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
  );
}

function getDeviceType(espNumber: number): string {
  const types = {
    1: 'Lamp, Gas Sensor, Fish Feeder',
    2: 'Clothesline, Rain Sensor',
    3: 'Door, Gate, RFID',
    4: 'Master Controller',
  };
  return types[espNumber as keyof typeof types] || 'Unknown Device';
}
```

### Grid Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <DeviceCard
    espNumber={1}
    status="online"
    lastSeen={new Date().toISOString()}
    deviceType="Lamp, Gas Sensor, Fish Feeder"
  />
  <DeviceCard
    espNumber={2}
    status="offline"
    lastSeen={new Date(Date.now() - 300000).toISOString()}
    deviceType="Clothesline, Rain Sensor"
  />
  <DeviceCard
    espNumber={3}
    status="online"
    lastSeen={new Date(Date.now() - 5000).toISOString()}
    deviceType="Door, Gate, RFID"
  />
</div>
```

## Time Formatting

The component automatically formats the `lastSeen` timestamp into human-readable relative time:

- **< 60 seconds**: "30s ago"
- **< 60 minutes**: "5m ago"
- **< 24 hours**: "2h ago"
- **≥ 24 hours**: "3d ago"
- **Invalid timestamp**: "Unknown"

## Styling

The component uses Tailwind CSS with a dark theme:

- **Background**: Gray-800 with gray-700 border
- **Hover**: Lighter background (gray-750) and gray-600 border
- **Online Status**: Green accent colors
- **Offline Status**: Gray accent colors
- **Text**: White for headings, gray for secondary text

## Navigation

Clicking the card navigates to `/esp{espNumber}` (e.g., `/esp1`, `/esp2`).

## Dependencies

- `react-router-dom`: For navigation links
- `lucide-react`: For WiFi and ChevronRight icons
- `StatusIndicator`: Custom component for online/offline badge

## Accessibility

- Uses semantic HTML with proper link elements
- Provides clear visual indicators for status
- Includes descriptive text for screen readers

## Testing

The component includes comprehensive unit tests covering:

- Rendering device information
- Online/offline status display
- Time formatting for various durations
- Invalid timestamp handling
- Navigation links
- Hover styles

Run tests with:

```bash
npm test DeviceCard.test.tsx
```

## Design Specifications

This component implements task 17.1 from the IoT Smart Home Web Application spec:

- **Requirement 6.1**: Display online/offline status for each Device_ESP
- **Requirement 9.6**: Visual indicators (color-coded badges) for device status
- **Design Document**: DeviceCard component specification

## Related Components

- `StatusIndicator`: Used for the online/offline badge
- `useDeviceStatus`: Hook for fetching device status data
- `Dashboard`: Parent component that displays multiple DeviceCards
