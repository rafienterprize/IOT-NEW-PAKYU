import { useEffect, useState, useCallback, useRef } from 'react';
import { getStatus, type DeviceStatus } from '../services/esp4Api';
import { POLLING_INTERVAL_MS } from '../config/esp4';

export type { DeviceStatus };

interface DeviceStatusError {
  message: string;
  code?: string;
  timestamp: Date;
}

/** Fallback: tampilkan semua ESP sebagai offline saat ESP4 tidak terjangkau */
function buildFallbackDevices(): DeviceStatus[] {
  return [1, 2, 3, 4].map((n) => ({
    espNumber: n,
    isOnline: false,
    lastSeenAt: new Date().toISOString(),
  }));
}

/**
 * useDeviceStatus
 *
 * Polling status device dari ESP4 setiap POLLING_INTERVAL_MS.
 * Opsional: filter ke espNumber tertentu.
 */
export function useDeviceStatus(espNumber?: number) {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DeviceStatusError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const mountedRef = useRef(true);

  const fetchDevices = useCallback(async () => {
    try {
      const data = await getStatus();
      if (!mountedRef.current) return;
      setDevices(data);
      setError(null);
      setRetryCount(0);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Gagal menghubungi ESP4';
      setError({ message, code: 'NETWORK_ERROR', timestamp: new Date() });
      setDevices(buildFallbackDevices());
      setRetryCount((c) => c + 1);
      console.error('[useDeviceStatus]', message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    mountedRef.current = true;
    fetchDevices();
    const timer = setInterval(fetchDevices, POLLING_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [fetchDevices]);

  const filteredDevices = espNumber
    ? devices.filter((d) => d.espNumber === espNumber)
    : devices;

  return {
    devices: filteredDevices,
    loading,
    error,
    retryCount,
    refresh: fetchDevices,
    clearError,
  };
}
