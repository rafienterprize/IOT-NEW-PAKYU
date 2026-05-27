import { useEffect, useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { useSocket } from './useSocket';

interface DeviceStatus {
  espNumber: number;
  isOnline: boolean;
  lastSeenAt: string;
  lampState?: string;
  gasValue?: number;
  rainValue?: number;
  clotheslinePos?: string;
  doorState?: string;
  gateState?: string;
  wifiStatus?: string;
}

interface DeviceStatusError {
  message: string;
  code?: string;
  statusCode?: number;
  timestamp: Date;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export function useDeviceStatus(espNumber?: number) {
  const { socket, connected } = useSocket();
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DeviceStatusError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const parseError = useCallback((err: unknown): DeviceStatusError => {
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError;
      
      if (axiosError.code === 'ECONNABORTED') {
        return {
          message: 'Request timeout. Server is taking too long to respond.',
          code: 'TIMEOUT',
          timestamp: new Date(),
        };
      }
      
      if (axiosError.code === 'ERR_NETWORK') {
        return {
          message: 'Network error. Please check your connection.',
          code: 'NETWORK_ERROR',
          timestamp: new Date(),
        };
      }
      
      if (axiosError.response) {
        return {
          message: (axiosError.response.data as any)?.message || 'Failed to fetch device status',
          code: 'API_ERROR',
          statusCode: axiosError.response.status,
          timestamp: new Date(),
        };
      }
    }
    
    return {
      message: err instanceof Error ? err.message : 'An unknown error occurred',
      code: 'UNKNOWN',
      timestamp: new Date(),
    };
  }, []);

  const fetchDevices = useCallback(async (retry = 0) => {
    try {
      setLoading(true);
      // Only clear error on first attempt, not on retries
      if (retry === 0) {
        setError(null);
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/status`, {
        timeout: REQUEST_TIMEOUT,
      });
      
      if (response.data.success) {
        setDevices(response.data.data);
        setRetryCount(0);
        setError(null); // Clear any previous errors on success
      } else {
        throw new Error(response.data.message || 'Failed to fetch device status');
      }
    } catch (err) {
      const parsedError = parseError(err);
      
      // Retry on network errors or timeouts
      if (
        retry < MAX_RETRIES &&
        (parsedError.code === 'NETWORK_ERROR' || parsedError.code === 'TIMEOUT')
      ) {
        console.log(`Retrying device status fetch (${retry + 1}/${MAX_RETRIES})...`);
        setRetryCount(retry + 1);
        
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (retry + 1)));
        return fetchDevices(retry + 1);
      }
      
      // Only set error after all retries exhausted
      setError(parsedError);
      console.error('Failed to fetch device status:', parsedError);
    } finally {
      setLoading(false);
    }
  }, [parseError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (!socket || !connected) return;

    const handleDeviceStatus = (status: DeviceStatus) => {
      setDevices((prev) => {
        const existingIndex = prev.findIndex((d) => d.espNumber === status.espNumber);
        
        if (existingIndex >= 0) {
          // Update existing device
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...status };
          return updated;
        } else {
          // Add new device
          return [...prev, status];
        }
      });
    };

    socket.on('device:status', handleDeviceStatus);

    return () => {
      socket.off('device:status', handleDeviceStatus);
    };
  }, [socket, connected]);

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
