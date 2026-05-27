import SerialService from '../src/services/serialService.js';

describe('SerialService', () => {
  let serialService;

  beforeEach(() => {
    serialService = new SerialService('COM3', 9600, true); // Mock mode
  });

  afterEach(async () => {
    if (serialService) {
      await serialService.disconnect();
    }
  });

  describe('Message Parsing', () => {
    test('should parse valid ESP1 message', () => {
      const message = 'ESP1:STATUS:OK,GAS=1200,LAMP=OFF';
      const parsed = serialService.parseESPMessage(message);

      expect(parsed.espNumber).toBe(1);
      expect(parsed.type).toBe('STATUS');
      expect(parsed.message).toBe('OK,GAS=1200,LAMP=OFF');
      expect(parsed.rawData).toBe(message);
      expect(parsed.timestamp).toBeInstanceOf(Date);
    });

    test('should parse valid ESP2 message', () => {
      const message = 'ESP2:RAIN:800';
      const parsed = serialService.parseESPMessage(message);

      expect(parsed.espNumber).toBe(2);
      expect(parsed.type).toBe('RAIN');
      expect(parsed.message).toBe('800');
    });

    test('should parse valid ESP3 message', () => {
      const message = 'ESP3:RFID:A1B2C3D4';
      const parsed = serialService.parseESPMessage(message);

      expect(parsed.espNumber).toBe(3);
      expect(parsed.type).toBe('RFID');
      expect(parsed.message).toBe('A1B2C3D4');
    });

    test('should parse message with colon in content', () => {
      const message = 'ESP1:WIFI:SSID:Password123';
      const parsed = serialService.parseESPMessage(message);

      expect(parsed.espNumber).toBe(1);
      expect(parsed.type).toBe('WIFI');
      expect(parsed.message).toBe('SSID:Password123');
    });

    test('should throw error for invalid format', () => {
      expect(() => {
        serialService.parseESPMessage('INVALID');
      }).toThrow('Invalid message format');
    });

    test('should throw error for invalid ESP identifier', () => {
      expect(() => {
        serialService.parseESPMessage('INVALID:TYPE:MESSAGE');
      }).toThrow('Invalid ESP identifier');
    });

    test('should throw error for missing parts', () => {
      expect(() => {
        serialService.parseESPMessage('ESP1:TYPE');
      }).toThrow('Invalid message format');
    });
  });

  describe('Mock Mode', () => {
    test('should connect in mock mode', async () => {
      await serialService.connect();
      expect(serialService.isConnected).toBe(true);
      expect(serialService.useMock).toBe(true);
    });

    test('should emit data events in mock mode', (done) => {
      serialService.on('data', (parsed) => {
        expect(parsed).toBeDefined();
        expect(parsed.espNumber).toBeGreaterThanOrEqual(1);
        expect(parsed.espNumber).toBeLessThanOrEqual(4);
        expect(parsed.type).toBeDefined();
        expect(parsed.message).toBeDefined();
        done();
      });

      serialService.connect();
    }, 10000);

    test('should handle commands in mock mode', async () => {
      await serialService.connect();
      
      const commandSentPromise = new Promise((resolve) => {
        serialService.on('command-sent', (command) => {
          expect(command).toBe('LAMP:ON');
          resolve();
        });
      });

      await serialService.sendCommand('LAMP:ON');
      await commandSentPromise;
    });

    test('should disconnect in mock mode', async () => {
      await serialService.connect();
      expect(serialService.isConnected).toBe(true);
      
      await serialService.disconnect();
      expect(serialService.isConnected).toBe(false);
    });
  });

  describe('Status', () => {
    test('should return correct status', () => {
      const status = serialService.getStatus();
      
      expect(status.isConnected).toBe(false);
      expect(status.port).toBe('COM3');
      expect(status.baudRate).toBe(9600);
      expect(status.useMock).toBe(true);
      expect(status.reconnectAttempts).toBe(0);
    });
  });
});
