import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface SensorReading {
  timestamp: string;
  value: number;
}

interface SensorChartProps {
  data: SensorReading[];
  threshold: number;
  label: string;
  unit: string;
  timeWindow?: number; // in seconds, default 60
}

export default function SensorChart({
  data,
  threshold,
  label,
  unit,
  timeWindow = 60,
}: SensorChartProps) {
  // Filter data to only show the last timeWindow seconds
  const now = new Date().getTime();
  const windowStart = now - timeWindow * 1000;
  
  const filteredData = data
    .filter((reading) => {
      const timestamp = new Date(reading.timestamp).getTime();
      return timestamp >= windowStart;
    })
    .map((reading) => ({
      ...reading,
      time: new Date(reading.timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-xs text-gray-400">{data.time}</p>
          <p className="text-sm font-semibold text-white mt-1">
            {data.value} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Chart header */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-white">{label}</h3>
        <p className="text-xs text-gray-500 mt-1">
          Last {timeWindow} seconds
        </p>
      </div>

      {/* Chart */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#9CA3AF' }}
              label={{
                value: unit,
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#9CA3AF', fontSize: '12px' },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Threshold line */}
            <ReferenceLine
              y={threshold}
              stroke="#EF4444"
              strokeDasharray="5 5"
              label={{
                value: `Threshold: ${threshold}`,
                position: 'right',
                fill: '#EF4444',
                fontSize: 12,
              }}
            />
            
            {/* Data line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#10B981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
