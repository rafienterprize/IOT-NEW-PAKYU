import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import EventEmitter from 'events';
import MockSerial from './mockSerial.js';

/**
 * SerialService manages USB Serial connection to ESP32 #4
 * Handles message parsing, command transmission, and error recovery
 * Supports mock mode for development without hardware
 */
class SerialService extends EventEmitter {
  constructor(port, baudRate, useMock = false) {
    super();
    this.port = port;
    this.baudRate = baudRate;
    this.useMock = useMock;
    this.serialPort = null;
    this.parser = null;
    this.mockSerial = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000; // 5 seconds
  }

  /**
   * Connect to serial port or start mock mode
   */
  async connect() {
    if (this.useMock) {
      console.log('📡 Serial Service: Running in MOCK mode');
      this.mockSerial = new MockSerial();
      
      // Forward mock data events
      this.mockSerial.on('data', (line) => {
        this.handleIncomingData(line);
      });
      
      this.mockSerial.start();
      this.isConnected = true;
      this.emit('connected');
      return;
    }

    try {
      this.serialPort = new SerialPort({
        path: this.port,
        baudRate: this.baudRate,
      });

      this.parser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

      this.serialPort.on('open', () => {
        console.log(`✓ Serial port opened: ${this.port} @ ${this.baudRate} baud`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
      });

      this.serialPort.on('error', (error) => {
        console.error('✗ Serial port error:', error.message);
        this.isConnected = false;
        this.emit('error', error);
        this.handleReconnection();
      });

      this.serialPort.on('close', () => {
        console.log('Serial port closed');
        this.isConnected = false;
        this.emit('disconnected');
        this.handleReconnection();
      });

      this.parser.on('data', (line) => {
        this.handleIncomingData(line);
      });

    } catch (error) {
      console.error('✗ Failed to open serial port:', error.message);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Disconnect from serial port or stop mock mode
   */
  async disconnect() {
    if (this.useMock && this.mockSerial) {
      this.mockSerial.stop();
      this.mockSerial = null;
      this.isConnected = false;
      return;
    }

    if (this.serialPort && this.serialPort.isOpen) {
      return new Promise((resolve) => {
        this.serialPort.close((err) => {
          if (err) {
            console.error('Error closing serial port:', err);
          }
          this.isConnected = false;
          resolve();
        });
      });
    }
  }

  /**
   * Handle reconnection logic
   */
  handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`✗ Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      this.emit('max-reconnect-reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error.message);
      });
    }, this.reconnectDelay);
  }

  /**
   * Handle incoming data from serial port
   */
  handleIncomingData(rawLine) {
    const line = rawLine.trim();
    if (!line) return;

    try {
      const parsed = this.parseESPMessage(line);
      this.emit('data', parsed);
      this.emit('raw', line);
    } catch (error) {
      console.error('Parse error:', error.message, '| Raw:', line);
      this.emit('parse-error', { error, rawData: line });
    }
  }

  /**
   * Parse ESP message format: ESPx:TYPE:MESSAGE
   */
  parseESPMessage(rawMessage) {
    const parts = rawMessage.trim().split(':');

    if (parts.length < 3) {
      throw new Error('Invalid message format: expected ESPx:TYPE:MESSAGE');
    }

    const espMatch = parts[0].match(/ESP(\d)/);
    if (!espMatch) {
      throw new Error('Invalid ESP identifier: expected ESP1, ESP2, ESP3, or ESP4');
    }

    return {
      espNumber: parseInt(espMatch[1]),
      type: parts[1],
      message: parts.slice(2).join(':'),
      rawData: rawMessage,
      timestamp: new Date(),
    };
  }

  /**
   * Send command to ESP32 via serial port or mock
   */
  async sendCommand(command) {
    if (this.useMock) {
      console.log(`📤 [MOCK] Sending command: ${command}`);
      if (this.mockSerial) {
        this.mockSerial.handleCommand(command);
      }
      this.emit('command-sent', command);
      return;
    }

    if (!this.isConnected || !this.serialPort || !this.serialPort.isOpen) {
      throw new Error('Serial port is not connected');
    }

    return new Promise((resolve, reject) => {
      this.serialPort.write(command + '\n', (error) => {
        if (error) {
          console.error('✗ Failed to send command:', error.message);
          reject(error);
        } else {
          console.log(`📤 Command sent: ${command}`);
          this.emit('command-sent', command);
          resolve();
        }
      });
    });
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      port: this.port,
      baudRate: this.baudRate,
      useMock: this.useMock,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

export default SerialService;
