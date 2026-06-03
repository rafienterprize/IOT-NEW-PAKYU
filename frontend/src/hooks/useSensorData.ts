import { useEffect, useState, useCallback, useRef } from 'react';
import { getSensorGas, getSensorRain, type SensorReading } from '../services/esp4Api';
import { POLLING_INTERVAL_MS } from '../config/esp4';

export type { SensorReading };

interface SensorDataError {
  message: string;
  code?: string;
  timestamp: Date;
}

/**
 * useSensorData
 *
 * Polling nilai sensor (GAS atau RAIN) dari ESP4 setiap POLLING_INTERVAL_MS.
 * Mempertahankan histori `timeWindow` titik data terakhir untuk ditampilkan di chart.
 *
 * @param espNumber   Nomor ESP sumber sensor
 * @param sensorType  'GAS' atau 'RAIN'
 * @param timeWindow  Jumlah titik data yang disimpan di histori (default: 60)
 */
export function useSensorData(
  espNumber: number,
  sensorType: 'GAS' | 'RAIN',
  timeWindow = 60
) {
  const [data, setData] = useState<SensorReading[]>([]);
  const [latest, setLatest] = useState<SensorReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SensorDataError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const mountedRef = useRef(true);

  const fetchSensorData = useCallback(async () => {
    try {
      // Pilih fungsi getter berdasarkan jenis sensor
      const value = sensorType === 'GAS'
        ? await getSensorGas()
        : await getSensorRain();

      if (!mountedRef.current) return;

      const reading: SensorReading = {
        timestamp: new Date().toISOString(),
        value,
        sensorType,
        espNumber,
      };

      setLatest(reading);
      setData((prev) => [...prev, reading].slice(-timeWindow));
      setError(null);
      setRetryCount(0);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Gagal mengambil data sensor';
      setError({ message, code: 'NETWORK_ERROR', timestamp: new Date() });
      setRetryCount((c) => c + 1);
      console.error(`[useSensorData ${sensorType}]`, message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [espNumber, sensorType, timeWindow]);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    mountedRef.current = true;
    fetchSensorData();
    const timer = setInterval(fetchSensorData, POLLING_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [fetchSensorData]);

  return {
    data,
    latest,
    loading,
    error,
    retryCount,
    refresh: fetchSensorData,
    clearError,
  };
}
