import { useEffect, useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { useSocket } from './useSocket';

interface SensorReading {
  timestamp: string;
  value: number;
  sensorType: string;
  espNumber: number;
}

interface SensorDataError {
  message: string;
  code?: string;
  statusCode?: number;
  timestamp: Date;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export function useSensorData(
  espNumber: number,
  sensorType: 'GAS' | 'RAIN',
  timeWindow: number = 60
) {
  const { socket, connected } = useSocket();
  const [data, setData] = useState<SensorReading[]>([]);
  const [latest, setLatest] = useState<SensorReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SensorDataError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const parseError = useCallback((err: unknown): SensorDataError => {
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
          message: (axiosError.response.data as any)?.message || 'Failed to fetch sensor data',
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

  const fetchHistory = useCallback(async (retry = 0) => {
    try {
      setLoading(true);
      // Only clear error on first attempt, not on retries
      if (retry === 0) {
        setError(null);
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/sensors/history`, {
        params: { esp: espNumber, type: sensorType, limit: timeWindow },
        timeout: REQUEST_TIMEOUT,
      });
      
      if (response.data.success) {
        const sensorData = response.data.data;
        setData(sensorData);
        
        if (sensorData.length > 0) {
          setLatest(sensorData[sensorData.length - 1]);
        }
        
        setRetryCount(0);
        setError(null); // Clear any previous errors on success
      } else {
        throw new Error(response.data.message || 'Failed to fetch sensor data');
      }
    } catch (err) {
      const parsedError = parseError(err);
      
      // Retry on network errors or timeouts
      if (
        retry < MAX_RETRIES &&
        (parsedError.code === 'NETWORK_ERROR' || parsedError.code === 'TIMEOUT')
      ) {
        console.log(`Retrying sensor data fetch (${retry + 1}/${MAX_RETRIES})...`);
        setRetryCount(retry + 1);
        
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (retry + 1)));
        return fetchHistory(retry + 1);
      }
      
      // Only set error after all retries exhausted
      setError(parsedError);
      console.error('Failed to fetch sensor data:', parsedError);
    } finally {
      setLoading(false);
    }
  }, [espNumber, sensorType, timeWindow, parseError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!socket || !connected) return;

    const handleSensorData = (reading: SensorReading) => {
      try {
        // Validate reading data
        if (
          !reading ||
          typeof reading.espNumber !== 'number' ||
          typeof reading.sensorType !== 'string' ||
          typeof reading.value !== 'number'
        ) {
          console.error('Invalid sensor reading received:', reading);
          return;
        }

        if (
          reading.espNumber === espNumber &&
          reading.sensorType === sensorType
        ) {
          setLatest(reading);
          setData((prev) => {
            const newData = [...prev, reading];
            // Keep only the last timeWindow readings
            return newData.slice(-timeWindow);
          });
        }
      } catch (err) {
        console.error('Error handling sensor data:', err);
        setError({
          message: 'Failed to process real-time sensor data',
          code: 'PROCESSING_ERROR',
          timestamp: new Date(),
        });
      }
    };

    socket.on('sensor:data', handleSensorData);

    return () => {
      socket.off('sensor:data', handleSensorData);
    };
  }, [socket, connected, espNumber, sensorType, timeWindow]);

  return { 
    data, 
    latest, 
    loading, 
    error,
    retryCount,
    refresh: fetchHistory,
    clearError,
  };
}
