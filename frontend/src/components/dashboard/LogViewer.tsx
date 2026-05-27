import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface DeviceLog {
  id: number;
  espNumber: number;
  messageType: string;
  message: string;
  createdAt: string;
}

interface LogViewerProps {
  logs: DeviceLog[];
  espFilter?: number; // Filter by ESP number (optional)
  limit?: number; // Max number of logs to display
}

export default function LogViewer({
  logs,
  espFilter,
  limit = 50,
}: LogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter logs by ESP number if specified
  const filteredLogs = espFilter
    ? logs.filter((log) => log.espNumber === espFilter)
    : logs;

  // Limit the number of logs displayed
  const displayedLogs = filteredLogs.slice(0, limit);

  // Auto-scroll to latest log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedLogs]);

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return 'Invalid time';
    }
  };

  // Get color based on message type
  const getMessageTypeColor = (type: string): string => {
    const typeUpper = type.toUpperCase();
    
    if (typeUpper.includes('ERROR') || typeUpper.includes('ALERT')) {
      return 'text-red-400';
    }
    if (typeUpper.includes('WARN')) {
      return 'text-yellow-400';
    }
    if (typeUpper.includes('STATUS') || typeUpper.includes('OK')) {
      return 'text-green-400';
    }
    if (typeUpper.includes('RFID')) {
      return 'text-blue-400';
    }
    if (typeUpper.includes('SYSTEM')) {
      return 'text-purple-400';
    }
    
    return 'text-gray-400';
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-sm font-medium text-white">
          Device Logs
          {espFilter && ` - ESP32 #${espFilter}`}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Showing {displayedLogs.length} of {filteredLogs.length} logs
        </p>
      </div>

      {/* Log list */}
      <div
        ref={scrollRef}
        className="h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      >
        {displayedLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">No logs available</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {displayedLogs.map((log) => (
              <div
                key={log.id}
                className="px-4 py-3 hover:bg-gray-750 transition-colors"
              >
                {/* Log header */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-500">
                    {formatTimestamp(log.createdAt)}
                  </span>
                  <span className="text-xs font-medium text-blue-400">
                    ESP{log.espNumber}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      getMessageTypeColor(log.messageType)
                    )}
                  >
                    {log.messageType}
                  </span>
                </div>

                {/* Log message */}
                <p className="text-sm text-gray-300 font-mono break-all">
                  {log.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
