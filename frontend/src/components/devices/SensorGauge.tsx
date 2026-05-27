import { cn } from '@/lib/utils';

interface SensorGaugeProps {
  value: number;
  max: number;
  threshold: number;
  label: string;
  unit: string;
}

export default function SensorGauge({
  value,
  max,
  threshold,
  label,
  unit,
}: SensorGaugeProps) {
  // Calculate percentage for gauge fill
  const percentage = Math.min((value / max) * 100, 100);
  
  // Determine color based on threshold
  const isAboveThreshold = value > threshold;
  const gaugeColor = isAboveThreshold ? 'text-red-500' : 'text-green-400';
  const gaugeBgColor = isAboveThreshold ? 'stroke-red-500' : 'stroke-green-400';
  
  // SVG circle parameters
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      {/* Circular gauge */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-700"
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn(gaugeBgColor, 'transition-all duration-500')}
          />
        </svg>
        
        {/* Center value display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-3xl font-bold', gaugeColor)}>
            {value}
          </span>
          <span className="text-sm text-gray-400">{unit}</span>
        </div>
      </div>
      
      {/* Label and threshold info */}
      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-500 mt-1">
          Threshold: {threshold} {unit}
        </p>
        {isAboveThreshold && (
          <p className="text-xs text-red-400 mt-1 font-medium">
            ⚠ Above threshold
          </p>
        )}
      </div>
    </div>
  );
}
