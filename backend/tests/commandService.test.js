import CommandService from '../src/services/commandService.js';

// Manual mock function implementation
function createMockFn() {
  const calls = [];
  const fn = function(...args) {
    calls.push(args);
    return fn._mockReturnValue;
  };
  fn.mockResolvedValue = function(value) {
    fn._mockReturnValue = Promise.resolve(value);
    return fn;
  };
  fn.mockRejectedValue = function(value) {
    fn._mockReturnValue = Promise.reject(value);
    return fn;
  };
  fn.mock = { calls };
  fn._mockReturnValue = Promise.resolve(undefined);
  return fn;
}

describe('CommandService', () => {
  let commandService;
  let mockSerialService;
  let mockPrisma;

  beforeEach(() => {
    // Mock Serial Service
    mockSerialService = {
      sendCommand: createMockFn().mockResolvedValue(undefined),
    };

    // Mock Prisma
    mockPrisma = {
      deviceLog: {
        create: createMockFn().mockResolvedValue({ id: 1 }),
      },
    };

    commandService = new CommandService(mockSerialService, mockPrisma);
  });

  describe('Command Formatting', () => {
    test('should format lamp ON command correctly', async () => {
      await commandService.sendLampCommand('ON');
      
      expect(mockSerialService.sendCommand.mock.calls.length).toBe(1);
      expect(mockSerialService.sendCommand.mock.calls[0][0]).toBe('LAMP:ON');
      expect(mockPrisma.deviceLog.create.mock.calls.length).toBe(1);
      expect(mockPrisma.deviceLog.create.mock.calls[0][0].data.espNumber).toBe(1);
      expect(mockPrisma.deviceLog.create.mock.calls[0][0].data.messageType).toBe('COMMAND');
      expect(mockPrisma.deviceLog.create.mock.calls[0][0].data.message).toBe('LAMP:ON');
    });

    test('should format lamp OFF command correctly', async () => {
      await commandService.sendLampCommand('OFF');
      
      expect(mockSerialService.sendCommand.mock.calls[0][0]).toBe('LAMP:OFF');
    });

    test('should format feed command correctly', async () => {
      await commandService.sendFeedCommand();
      
      expect(mockSerialService.sendCommand.mock.calls[0][0]).toBe('FEED');
      expect(mockPrisma.deviceLog.create.mock.calls[0][0].data.espNumber).toBe(1);
      expect(mockPrisma.deviceLog.create.mock.calls[0][0].data.message).toBe('FEED');
    });

    test('should format clothesline IN command correctly', async () => {
      await commandService.sendClotheslineCommand('IN');
      
      expect(mockSerialService.sendCommand.mock.calls[0][0]).toBe('CLOTHESLINE:IN');
      expect(mockPrisma.deviceLog.create.mock.calls[0][0].data.espNumber).toBe(2);
    });

    test('should format clothesline OUT command correctly', async () => {
      await commandService.sendClotheslineCommand('OUT');
      
      expect(mockSerialService.sendCommand.mock.calls[0][0]).toBe('CLOTHESLINE:OUT');
    });

    test('should format door OPEN command correctly', async () => {
      await commandService.sendDoorCommand('OPEN');
      
      expect(mockSerialService.sendCommand.mock.calls[0][0]).toBe('DOOR:OPEN');
      expect(mockPrisma.deviceLog.create.mock.calls[0][0].data.espNumber).toBe(3);
    });

    test('should format door CLOSE command correctly', async () => {
      await commandService.sendDoorCommand('CLOSE');
      
      expect(mockSerialService.sendCommand.mock.calls[0][0]).toBe('DOOR:CLOSE');
    });

    test('should format gate OPEN command correctly', async () => {
      await commandService.sendGateCommand('OPEN');
      
      expect(mockSerialService.sendCommand.mock.calls[0][0]).toBe('GATE:OPEN');
    });

    test('should format gate CLOSE command correctly', async () => {
      await commandService.sendGateCommand('CLOSE');
      
      expect(mockSerialService.sendCommand.mock.calls[0][0]).toBe('GATE:CLOSE');
    });

    test('should format WiFi config command correctly', async () => {
      await commandService.sendWiFiConfig('MyWiFi', 'Password123');
      
      expect(mockSerialService.sendCommand.mock.calls[0][0]).toBe('WIFI:MyWiFi,Password123');
    });

    test('should format WiFi config with special characters', async () => {
      await commandService.sendWiFiConfig('My-WiFi_2.4G', 'P@ssw0rd!');
      
      expect(mockSerialService.sendCommand.mock.calls[0][0]).toBe('WIFI:My-WiFi_2.4G,P@ssw0rd!');
    });
  });

  describe('Command Validation', () => {
    test('should reject invalid lamp state', async () => {
      await expect(commandService.sendLampCommand('INVALID')).rejects.toThrow(
        'Invalid lamp state: must be ON or OFF'
      );
    });

    test('should reject invalid clothesline position', async () => {
      await expect(commandService.sendClotheslineCommand('INVALID')).rejects.toThrow(
        'Invalid clothesline position: must be IN or OUT'
      );
    });

    test('should reject invalid door action', async () => {
      await expect(commandService.sendDoorCommand('INVALID')).rejects.toThrow(
        'Invalid door action: must be OPEN or CLOSE'
      );
    });

    test('should reject invalid gate action', async () => {
      await expect(commandService.sendGateCommand('INVALID')).rejects.toThrow(
        'Invalid gate action: must be OPEN or CLOSE'
      );
    });

    test('should reject WiFi config without SSID', async () => {
      await expect(commandService.sendWiFiConfig('', 'password')).rejects.toThrow(
        'SSID and password are required'
      );
    });

    test('should reject WiFi config without password', async () => {
      await expect(commandService.sendWiFiConfig('ssid', '')).rejects.toThrow(
        'SSID and password are required'
      );
    });

    test('should validate correct lamp command', () => {
      expect(commandService.validateCommand('LAMP:ON')).toBe(true);
      expect(commandService.validateCommand('LAMP:OFF')).toBe(true);
    });

    test('should validate correct feed command', () => {
      expect(commandService.validateCommand('FEED')).toBe(true);
    });

    test('should validate correct clothesline command', () => {
      expect(commandService.validateCommand('CLOTHESLINE:IN')).toBe(true);
      expect(commandService.validateCommand('CLOTHESLINE:OUT')).toBe(true);
    });

    test('should validate correct door command', () => {
      expect(commandService.validateCommand('DOOR:OPEN')).toBe(true);
      expect(commandService.validateCommand('DOOR:CLOSE')).toBe(true);
    });

    test('should validate correct gate command', () => {
      expect(commandService.validateCommand('GATE:OPEN')).toBe(true);
      expect(commandService.validateCommand('GATE:CLOSE')).toBe(true);
    });

    test('should validate correct WiFi command', () => {
      expect(commandService.validateCommand('WIFI:ssid,password')).toBe(true);
    });

    test('should reject invalid command format', () => {
      expect(commandService.validateCommand('INVALID')).toBe(false);
      expect(commandService.validateCommand('LAMP:INVALID')).toBe(false);
      expect(commandService.validateCommand('')).toBe(false);
      expect(commandService.validateCommand(null)).toBe(false);
    });
  });

  describe('WiFi Configuration Targeting', () => {
    test('should broadcast WiFi config to all devices when no target specified', async () => {
      const result = await commandService.sendWiFiConfig('MyWiFi', 'Password123');
      
      expect(result.targets).toEqual([1, 2, 3]);
      expect(mockPrisma.deviceLog.create.mock.calls.length).toBe(3);
    });

    test('should send WiFi config to specific target', async () => {
      const result = await commandService.sendWiFiConfig('MyWiFi', 'Password123', 1);
      
      expect(result.targets).toEqual([1]);
      expect(mockPrisma.deviceLog.create.mock.calls.length).toBe(1);
      expect(mockPrisma.deviceLog.create.mock.calls[0][0].data.espNumber).toBe(1);
    });
  });

  describe('Command Execution', () => {
    test('should execute lamp command via executeCommand', async () => {
      const result = await commandService.executeCommand(1, 'LAMP:ON');
      
      expect(result.success).toBe(true);
      expect(result.command).toBe('LAMP:ON');
      expect(mockSerialService.sendCommand.mock.calls[0][0]).toBe('LAMP:ON');
    });

    test('should execute feed command via executeCommand', async () => {
      const result = await commandService.executeCommand(1, 'FEED');
      
      expect(result.success).toBe(true);
      expect(result.command).toBe('FEED');
    });

    test('should reject invalid target', async () => {
      await expect(commandService.executeCommand(5, 'LAMP:ON')).rejects.toThrow(
        'Invalid target: must be 1, 2, or 3'
      );
    });

    test('should reject unknown command', async () => {
      await expect(commandService.executeCommand(1, 'UNKNOWN:CMD')).rejects.toThrow(
        'Unknown command'
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle serial service errors', async () => {
      mockSerialService.sendCommand.mockRejectedValue(new Error('Serial error'));
      
      await expect(commandService.sendLampCommand('ON')).rejects.toThrow('Serial error');
    });

    test('should not throw on logging errors', async () => {
      mockPrisma.deviceLog.create.mockRejectedValue(new Error('DB error'));
      
      // Should not throw - logging failure shouldn't prevent command execution
      await expect(commandService.sendLampCommand('ON')).resolves.toBeDefined();
    });
  });

  describe('Return Values', () => {
    test('should return success response for lamp command', async () => {
      const result = await commandService.sendLampCommand('ON');
      
      expect(result).toEqual({
        success: true,
        command: 'LAMP:ON',
        target: 1,
      });
    });

    test('should return success response for feed command', async () => {
      const result = await commandService.sendFeedCommand();
      
      expect(result).toEqual({
        success: true,
        command: 'FEED',
        target: 1,
      });
    });

    test('should return success response for clothesline command', async () => {
      const result = await commandService.sendClotheslineCommand('IN');
      
      expect(result).toEqual({
        success: true,
        command: 'CLOTHESLINE:IN',
        target: 2,
      });
    });
  });
});
