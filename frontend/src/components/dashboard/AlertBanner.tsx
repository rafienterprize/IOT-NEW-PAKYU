import { useState, useEffect } from 'react';
import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  type: 'GAS' | 'RAIN' | 'OFFLINE' | 'RFID';
  severity: 'warning' | 'error' | 'info';
  message: string;
  espNumber: number;
  timestamp: string;
  dismissed: boolean;
}

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
}

export default function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  const [toastAlerts, setToastAlerts] = useState<Set<string>>(new Set());

  // Show toast notification for new alerts
  useEffect(() => {
    const newAlerts = alerts.filter(
      (alert) => !alert.dismissed && !toastAlerts.has(alert.id)
    );

    if (newAlerts.length > 0) {
      newAlerts.forEach((alert) => {
        setToastAlerts((prev) => new Set(prev).add(alert.id));
        
        // Auto-dismiss toast after 5 seconds
        setTimeout(() => {
          setToastAlerts((prev) => {
            const next = new Set(prev);
            next.delete(alert.id);
            return next;
          });
        }, 5000);
      });
    }
  }, [alerts, toastAlerts]);

  // Filter active (non-dismissed) alerts
  const activeAlerts = alerts.filter((alert) => !alert.dismissed);

  // Get icon based on severity
  const getIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'info':
        return <Info size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  // Get styles based on severity
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'error':
        return {
          bg: 'bg-red-900/50',
          border: 'border-red-500',
          text: 'text-red-400',
          icon: 'text-red-400',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-900/50',
          border: 'border-yellow-500',
          text: 'text-yellow-400',
          icon: 'text-yellow-400',
        };
      case 'info':
        return {
          bg: 'bg-blue-900/50',
          border: 'border-blue-500',
          text: 'text-blue-400',
          icon: 'text-blue-400',
        };
      default:
        return {
          bg: 'bg-gray-900/50',
          border: 'border-gray-500',
          text: 'text-gray-400',
          icon: 'text-gray-400',
        };
    }
  };

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
      return '';
    }
  };

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {activeAlerts.map((alert) => {
        const styles = getSeverityStyles(alert.severity);
        
        return (
          <div
            key={alert.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg border transition-all duration-300',
              styles.bg,
              styles.border
            )}
          >
            {/* Icon */}
            <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
              {getIcon(alert.severity)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('text-sm font-semibold', styles.text)}>
                  {alert.type} Alert
                </span>
                <span className="text-xs text-gray-500">
                  ESP{alert.espNumber}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(alert.timestamp)}
                </span>
              </div>
              <p className="text-sm text-gray-300">{alert.message}</p>
            </div>

            {/* Dismiss button */}
            <button
              onClick={() => onDismiss(alert.id)}
              className={cn(
                'flex-shrink-0 p-1 rounded hover:bg-gray-700 transition-colors',
                styles.icon
              )}
              aria-label="Dismiss alert"
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
