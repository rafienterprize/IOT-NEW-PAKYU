import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';

interface CommandError {
  message: string;
  code?: string;
  statusCode?: number;
  timestamp: Date;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const REQUEST_TIMEOUT = 15000; // 15 seconds for commands (longer than reads)
const MAX_RETRIES = 2;
const RETRY_DELAY = 1500; // 1.5 seconds

export function useCommand() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CommandError | null>(null);
  const [lastCommand, setLastCommand] = useState<string | null>(null);

  const parseError = useCallback((err: unknown, context: string): CommandError => {
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError;
      
      if (axiosError.code === 'ECONNABORTED') {
        return {
          message: `Command timeout. The ${context} command took too long to execute.`,
          code: 'TIMEOUT',
          timestamp: new Date(),
        };
      }
      
      if (axiosError.code === 'ERR_NETWORK') {
        return {
          message: 'Network error. Unable to reach the server.',
          code: 'NETWORK_ERROR',
          timestamp: new Date(),
        };
      }
      
      if (axiosError.response) {
        const responseData = axiosError.response.data as any;
        return {
          message: responseData?.message || `Failed to execute ${context} command`,
          code: 'API_ERROR',
          statusCode: axiosError.response.status,
          timestamp: new Date(),
        };
      }
    }
    
    return {
      message: err instanceof Error ? err.message : `An unknown error occurred while executing ${context} command`,
      code: 'UNKNOWN',
      timestamp: new Date(),
    };
  }, []);

  const sendCommand = useCallback(async (
    target: number,
    command: string,
    retry = 0
  ) => {
    try {
      setLoading(true);
      setError(null);
      setLastCommand(`${command} to ESP${target}`);
      
      // Validate inputs
      if (!target || target < 1 || target > 4) {
        throw new Error('Invalid target ESP number. Must be between 1 and 4.');
      }
      
      if (!command || typeof command !== 'string' || command.trim().length === 0) {
        throw new Error('Invalid command. Command cannot be empty.');
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/api/command`,
        { target, command },
        { timeout: REQUEST_TIMEOUT }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Command failed');
      }
      
      return response.data;
    } catch (err) {
      const parsedError = parseError(err, 'device');
      
      // Retry on network errors or timeouts
      if (
        retry < MAX_RETRIES &&
        (parsedError.code === 'NETWORK_ERROR' || parsedError.code === 'TIMEOUT')
      ) {
        console.log(`Retrying command (${retry + 1}/${MAX_RETRIES})...`);
        
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (retry + 1)));
        return sendCommand(target, command, retry + 1);
      }
      
      setError(parsedError);
      console.error('Failed to send command:', parsedError);
      throw parsedError;
    } finally {
      setLoading(false);
    }
  }, [parseError]);

  const sendWiFiConfig = useCallback(async (
    ssid: string,
    password: string,
    target?: number,
    retry = 0
  ) => {
    try {
      setLoading(true);
      setError(null);
      setLastCommand(`WiFi config to ${target ? `ESP${target}` : 'all devices'}`);
      
      // Validate inputs
      if (!ssid || typeof ssid !== 'string' || ssid.trim().length === 0) {
        throw new Error('Invalid SSID. SSID cannot be empty.');
      }
      
      if (!password || typeof password !== 'string' || password.length < 8) {
        throw new Error('Invalid password. Password must be at least 8 characters.');
      }
      
      if (target !== undefined && (target < 1 || target > 4)) {
        throw new Error('Invalid target ESP number. Must be between 1 and 4.');
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/api/wifi`,
        { ssid, password, target },
        { timeout: REQUEST_TIMEOUT }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'WiFi configuration failed');
      }
      
      return response.data;
    } catch (err) {
      const parsedError = parseError(err, 'WiFi configuration');
      
      // Retry on network errors or timeouts
      if (
        retry < MAX_RETRIES &&
        (parsedError.code === 'NETWORK_ERROR' || parsedError.code === 'TIMEOUT')
      ) {
        console.log(`Retrying WiFi config (${retry + 1}/${MAX_RETRIES})...`);
        
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (retry + 1)));
        return sendWiFiConfig(ssid, password, target, retry + 1);
      }
      
      setError(parsedError);
      console.error('Failed to send WiFi config:', parsedError);
      throw parsedError;
    } finally {
      setLoading(false);
    }
  }, [parseError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { 
    sendCommand, 
    sendWiFiConfig, 
    loading, 
    error,
    lastCommand,
    clearError,
  };
}
