import { Circle } from 'lucide-react';

interface StatusIndicatorProps {
  isOnline: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusIndicator({ 
  isOnline, 
  label, 
  size = 'md' 
}: StatusIndicatorProps) {
  // Size configurations
  const sizeClasses = {
    sm: {
      badge: 'px-2 py-1 text-xs',
      icon: 12,
      gap: 'gap-1'
    },
    md: {
      badge: 'px-3 py-1.5 text-sm',
      icon: 14,
      gap: 'gap-1.5'
    },
    lg: {
      badge: 'px-4 py-2 text-base',
      icon: 16,
      gap: 'gap-2'
    }
  };

  const currentSize = sizeClasses[size];

  // Status-based styling
  const statusClasses = isOnline
    ? 'bg-green-600/20 text-green-400 border-green-600/50'
    : 'bg-gray-600/20 text-gray-400 border-gray-600/50';

  const statusText = label || (isOnline ? 'Online' : 'Offline');

  return (
    <div
      className={`inline-flex items-center ${currentSize.gap} ${currentSize.badge} rounded-full border ${statusClasses} font-medium transition-colors`}
    >
      <Circle
        size={currentSize.icon}
        className={`${isOnline ? 'fill-green-400 text-green-400' : 'fill-gray-400 text-gray-400'}`}
      />
      <span>{statusText}</span>
    </div>
  );
}
