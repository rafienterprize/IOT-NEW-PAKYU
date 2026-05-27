# StatusIndicator Component

A reusable React component that displays online/offline status with color-coded badges.

## Features

- **Color-coded badges**: Green for online, gray for offline
- **Customizable labels**: Override default "Online"/"Offline" text
- **Multiple sizes**: Small, medium, and large variants
- **Dark mode theme**: Follows the IoT Smart Home dark theme with green/blue accents
- **Animated indicator**: Uses filled circle icon from Lucide React
- **Tailwind CSS styling**: Fully styled with Tailwind utility classes

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOnline` | `boolean` | *required* | Whether the device/service is online |
| `label` | `string` | `undefined` | Custom label text (defaults to "Online"/"Offline") |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant of the badge |

## Usage

### Basic Usage

```tsx
import { StatusIndicator } from '@/components/ui';

// Online status
<StatusIndicator isOnline={true} />

// Offline status
<StatusIndicator isOnline={false} />
```

### Custom Labels

```tsx
// Custom label for online status
<StatusIndicator isOnline={true} label="Connected" />

// Custom label for offline status
<StatusIndicator isOnline={false} label="Disconnected" />
```

### Different Sizes

```tsx
// Small size
<StatusIndicator isOnline={true} size="sm" />

// Medium size (default)
<StatusIndicator isOnline={true} size="md" />

// Large size
<StatusIndicator isOnline={true} size="lg" />
```

## Use Cases

### Device Cards

Display online/offline status for ESP32 devices:

```tsx
<div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
  <div className="flex items-center justify-between mb-2">
    <h4 className="font-semibold">ESP32 #1</h4>
    <StatusIndicator isOnline={deviceStatus.isOnline} size="sm" />
  </div>
  <p className="text-sm text-gray-400">Lamp & Gas Sensor</p>
</div>
```

### Header Connection Status

Show WebSocket connection status in the header:

```tsx
<header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-semibold">Dashboard</h2>
    <StatusIndicator 
      isOnline={socketConnected} 
      label="WebSocket" 
      size="sm" 
    />
  </div>
</header>
```

### WiFi Status Indicators

Display WiFi connection status for each device:

```tsx
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <span className="text-sm">ESP32 #1 WiFi</span>
    <StatusIndicator 
      isOnline={esp1.wifiStatus === 'OK'} 
      label={esp1.wifiStatus === 'OK' ? 'Connected' : 'Disconnected'}
      size="sm" 
    />
  </div>
</div>
```

## Styling

The component uses the following color scheme:

- **Online**: Green background (`bg-green-600/20`), green text (`text-green-400`), green border (`border-green-600/50`)
- **Offline**: Gray background (`bg-gray-600/20`), gray text (`text-gray-400`), gray border (`border-gray-600/50`)

The badge has:
- Rounded full corners (`rounded-full`)
- Smooth color transitions (`transition-colors`)
- Inline flex layout with centered items
- Filled circle icon that matches the status color

## Accessibility

- Uses semantic HTML with clear visual indicators
- Color is not the only indicator (text label is always present)
- Sufficient color contrast for readability in dark mode

## Design Specifications

This component follows the design specifications from the IoT Smart Home Web Application:

- **Validates**: Requirements 6.1, 9.6 (Device online/offline status display)
- **Theme**: Dark mode with green accent colors
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Related Components

- `DeviceCard`: Uses StatusIndicator to show device online/offline status
- `Header`: Uses StatusIndicator to show WebSocket connection status
- `ESP1/ESP2/ESP3 Pages`: Use StatusIndicator for WiFi status

## Testing

See `StatusIndicator.test.tsx` for unit tests covering:
- Online/offline rendering
- Custom labels
- Size variants
- Styling classes
- Default behavior

## Examples

See `StatusIndicator.example.tsx` for a comprehensive visual showcase of all component variants and use cases.
