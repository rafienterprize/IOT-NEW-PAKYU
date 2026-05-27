/**
 * SocketService manages Socket.IO connections and real-time communication
 * Broadcasts device data, status updates, and alerts to all connected clients
 */
class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedClients = new Map();
  }

  /**
   * Initialize Socket.IO event handlers
   */
  initialize() {
    this.io.on('connection', (socket) => {
      console.log(`✓ Client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, socket);

      // Broadcast connection status to all clients
      this.broadcastConnectionStatus();

      // Handle client disconnection
      socket.on('disconnect', () => {
        console.log(`✗ Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
        this.broadcastConnectionStatus();
      });

      // Handle command requests from client
      socket.on('command:send', async (data, callback) => {
        try {
          console.log(`📨 Command received from ${socket.id}:`, data);
          // Command will be handled by command service
          this.io.emit('command:received', data);
          
          if (callback) {
            callback({ success: true, message: 'Command received' });
          }
        } catch (error) {
          console.error('Error handling command:', error);
          if (callback) {
            callback({ success: false, message: error.message });
          }
        }
      });

      // Handle WiFi configuration requests
      socket.on('wifi:send', async (data, callback) => {
        try {
          console.log(`📨 WiFi config received from ${socket.id}:`, data);
          // WiFi config will be handled by command service
          this.io.emit('wifi:received', data);
          
          if (callback) {
            callback({ success: true, message: 'WiFi configuration received' });
          }
        } catch (error) {
          console.error('Error handling WiFi config:', error);
          if (callback) {
            callback({ success: false, message: error.message });
          }
        }
      });
    });

    console.log('✓ Socket.IO service initialized');
  }

  /**
   * Broadcast device log to all connected clients
   */
  broadcastDeviceLog(log) {
    this.io.emit('device:log', log);
  }

  /**
   * Broadcast device status update to all connected clients
   */
  broadcastDeviceStatus(status) {
    this.io.emit('device:status', status);
  }

  /**
   * Broadcast alert to all connected clients
   */
  broadcastAlert(alert) {
    this.io.emit('device:alert', alert);
  }

  /**
   * Broadcast sensor data to all connected clients
   */
  broadcastSensorData(data) {
    this.io.emit('sensor:data', data);
  }

  /**
   * Broadcast RFID scan to all connected clients
   */
  broadcastRFIDScan(scan) {
    this.io.emit('rfid:scan', scan);
  }

  /**
   * Broadcast raw serial data to all connected clients
   */
  broadcastRawSerial(data) {
    this.io.emit('serial:raw', data);
  }

  /**
   * Broadcast connection status to all connected clients
   */
  broadcastConnectionStatus() {
    const status = {
      connected: true,
      clientCount: this.connectedClients.size,
      timestamp: new Date().toISOString(),
    };
    this.io.emit('connection:status', status);
  }

  /**
   * Emit event to specific client
   */
  emitToClient(clientId, event, data) {
    const socket = this.connectedClients.get(clientId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  /**
   * Get number of connected clients
   */
  getConnectedClients() {
    return this.connectedClients.size;
  }

  /**
   * Get all connected client IDs
   */
  getClientIds() {
    return Array.from(this.connectedClients.keys());
  }
}

export default SocketService;
