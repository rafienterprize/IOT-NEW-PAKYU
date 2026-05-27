import { Link } from 'react-router-dom';
import { ChevronRight, Wifi, WifiOff } from 'lucide-react';
import StatusIndicator from '../ui/StatusIndicator';

interface DeviceCardProps {
  espNumber: number;
  status: 'online' | 'offline';
  lastSeen: string;
  deviceType: string;
}

export default function DeviceCard({
  espNumber,
  status,
  lastSeen,
  deviceType,
}: DeviceCardProps) {
  const isOnline = status === 'online';
  
  // Format last seen timestamp
  const formatLastSeen = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) {
        return `${diffSecs}s ago`;
      } else if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else {
        return `${diffDays}d ago`;
      }
    } catch {
      return 'Unknown';
    }
  };

  // Get device route
  const deviceRoute = `/esp${espNumber}`;

  return (
    <Link
      to={deviceRoute}
      className="block bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 hover:bg-gray-750 transition-all duration-200 group"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Header with ESP number and device type */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="text-green-400" size={20} />
              ) : (
                <WifiOff className="text-gray-400" size={20} />
              )}
              <h3 className="text-lg font-semibold text-white">
                ESP32 #{espNumber}
              </h3>
            </div>
          </div>

          {/* Device type */}
          <p className="text-sm text-gray-400 mb-3">{deviceType}</p>

          {/* Status and last seen */}
          <div className="flex items-center gap-3">
            <StatusIndicator isOnline={isOnline} size="sm" />
            <span className="text-xs text-gray-500">
              Last seen: {formatLastSeen(lastSeen)}
            </span>
          </div>
        </div>

        {/* Arrow icon */}
        <ChevronRight
          className="text-gray-500 group-hover:text-gray-400 transition-colors"
          size={20}
        />
      </div>
    </Link>
  );
}
