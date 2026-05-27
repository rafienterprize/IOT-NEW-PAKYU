import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface SocketError {
  message: string;
  type: 'connection' | 'timeout' | 'transport' | 'unknown';
  timestamp: Date;
}

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<SocketError | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Helper function to emit events
  const emit = useCallback((event: string, data?: any) => {
    if (!socket) {
      console.warn('Cannot emit event: socket not initialized');
      return;
    }
    if (!connected) {
      console.warn('Cannot emit event: socket not connected');
      return;
    }
    try {
      socket.emit(event, data);
    } catch (err) {
      console.error('Error emitting socket event:', err);
      setError({
        message: `Failed to emit event: ${event}`,
        type: 'unknown',
        timestamp: new Date(),
      });
    }
  }, [socket, connected]);

  // Helper function to subscribe to events
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (!socket) {
      console.warn('Cannot subscribe to event: socket not initialized');
      return;
    }
    try {
      socket.on(event, handler);
    } catch (err) {
      console.error('Error subscribing to socket event:', err);
      setError({
        message: `Failed to subscribe to event: ${event}`,
        type: 'unknown',
        timestamp: new Date(),
      });
    }
  }, [socket]);

  // Helper function to unsubscribe from events
  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (!socket) {
      console.warn('Cannot unsubscribe from event: socket not initialized');
      return;
    }
    try {
      if (handler) {
        socket.off(event, handler);
      } else {
        socket.off(event);
      }
    } catch (err) {
      console.error('Error unsubscribing from socket event:', err);
    }
  }, [socket]);

  useEffect(() => {
    setConnecting(true);

    const socketInstance = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      setConnecting(false);
      setError(null);
      setReconnectAttempts(0);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
      setConnecting(false);
      
      // Only set error for unexpected disconnections
      if (reason === 'io server disconnect' || reason === 'transport close') {
        setError({
          message: 'Connection lost. Attempting to reconnect...',
          type: 'connection',
          timestamp: new Date(),
        });
      }
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setConnected(false);
      setConnecting(false);
      setError({
        message: err.message || 'Failed to connect to server',
        type: 'connection',
        timestamp: new Date(),
      });
    });

    socketInstance.on('connect_timeout', () => {
      console.error('Socket connection timeout');
      setConnected(false);
      setConnecting(false);
      setError({
        message: 'Connection timeout. Server may be unreachable.',
        type: 'timeout',
        timestamp: new Date(),
      });
    });

    socketInstance.io.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt ${attempt}`);
      setReconnectAttempts(attempt);
      setConnecting(true);
    });

    socketInstance.io.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      setError({
        message: 'Failed to reconnect after multiple attempts',
        type: 'connection',
        timestamp: new Date(),
      });
      setConnecting(false);
    });

    socketInstance.io.on('reconnect', (attempt) => {
      console.log(`Reconnected after ${attempt} attempts`);
      setError(null);
      setReconnectAttempts(0);
    });

    socketInstance.on('error', (err) => {
      console.error('Socket error:', err);
      setError({
        message: typeof err === 'string' ? err : 'An unknown socket error occurred',
        type: 'unknown',
        timestamp: new Date(),
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    };
  }, []);

  return { 
    socket, 
    connected, 
    connecting,
    error,
    reconnectAttempts,
    clearError,
    emit,
    on,
    off,
  };
}
