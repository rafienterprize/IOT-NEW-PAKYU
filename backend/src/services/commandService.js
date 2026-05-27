/**
 * CommandService handles command validation, formatting, and transmission
 * Routes commands to appropriate ESP32 devices via Serial Service
 */
class CommandService {
  constructor(serialService, prisma) {
    this.serialService = serialService;
    this.prisma = prisma;
  }

  /**
   * Send lamp command (ON/OFF) to ESP1
   */
  async sendLampCommand(state) {
    if (!['ON', 'OFF'].includes(state)) {
      throw new Error('Invalid lamp state: must be ON or OFF');
    }

    const command = `LAMP:${state}`;
    await this.sendCommand(command);
    await this.logCommand(1, command);
    
    return { success: true, command, target: 1 };
  }

  /**
   * Send feed command to ESP1
   */
  async sendFeedCommand() {
    const command = 'FEED';
    await this.sendCommand(command);
    await this.logCommand(1, command);
    
    return { success: true, command, target: 1 };
  }

  /**
   * Send clothesline command (IN/OUT) to ESP2
   */
  async sendClotheslineCommand(position) {
    if (!['IN', 'OUT'].includes(position)) {
      throw new Error('Invalid clothesline position: must be IN or OUT');
    }

    const command = `CLOTHESLINE:${position}`;
    await this.sendCommand(command);
    await this.logCommand(2, command);
    
    return { success: true, command, target: 2 };
  }

  /**
   * Send door command (OPEN/CLOSE) to ESP3
   */
  async sendDoorCommand(action) {
    if (!['OPEN', 'CLOSE'].includes(action)) {
      throw new Error('Invalid door action: must be OPEN or CLOSE');
    }

    const command = `DOOR:${action}`;
    await this.sendCommand(command);
    await this.logCommand(3, command);
    
    return { success: true, command, target: 3 };
  }

  /**
   * Send gate command (OPEN/CLOSE) to ESP3
   */
  async sendGateCommand(action) {
    if (!['OPEN', 'CLOSE'].includes(action)) {
      throw new Error('Invalid gate action: must be OPEN or CLOSE');
    }

    const command = `GATE:${action}`;
    await this.sendCommand(command);
    await this.logCommand(3, command);
    
    return { success: true, command, target: 3 };
  }

  /**
   * Send WiFi configuration to ESP device(s)
   * @param {string} ssid - WiFi SSID
   * @param {string} password - WiFi password
   * @param {number} target - Target ESP number (optional, broadcasts to all if omitted)
   */
  async sendWiFiConfig(ssid, password, target = null) {
    if (!ssid || !password) {
      throw new Error('SSID and password are required');
    }

    const command = `WIFI:${ssid},${password}`;
    await this.sendCommand(command);

    // Log for each target
    if (target) {
      await this.logCommand(target, command);
    } else {
      // Broadcast to all ESP devices
      await this.logCommand(1, command);
      await this.logCommand(2, command);
      await this.logCommand(3, command);
    }
    
    return { 
      success: true, 
      command, 
      targets: target ? [target] : [1, 2, 3] 
    };
  }

  /**
   * Validate command format
   */
  validateCommand(command) {
    if (!command || typeof command !== 'string') {
      return false;
    }

    const validCommands = [
      /^LAMP:(ON|OFF)$/,
      /^FEED$/,
      /^CLOTHESLINE:(IN|OUT)$/,
      /^DOOR:(OPEN|CLOSE)$/,
      /^GATE:(OPEN|CLOSE)$/,
      /^WIFI:.+,.+$/,
    ];

    return validCommands.some(pattern => pattern.test(command));
  }

  /**
   * Send command via serial service
   * Uses broadcast approach (no ESP prefix) as ESP32 #4 forwards all commands
   */
  async sendCommand(command) {
    if (!this.validateCommand(command)) {
      throw new Error(`Invalid command format: ${command}`);
    }

    try {
      await this.serialService.sendCommand(command);
      console.log(`✓ Command sent: ${command}`);
    } catch (error) {
      console.error(`✗ Failed to send command: ${command}`, error);
      throw error;
    }
  }

  /**
   * Log command to database
   */
  async logCommand(espNumber, command) {
    try {
      await this.prisma.deviceLog.create({
        data: {
          espNumber,
          messageType: 'COMMAND',
          message: command,
          rawData: command,
        },
      });
    } catch (error) {
      console.error('Failed to log command:', error);
      // Don't throw - logging failure shouldn't prevent command execution
    }
  }

  /**
   * Parse and execute generic command
   * Used for API endpoint that accepts any valid command
   */
  async executeCommand(target, command) {
    // Validate target
    if (![1, 2, 3].includes(target)) {
      throw new Error('Invalid target: must be 1, 2, or 3');
    }

    // Parse command and route to appropriate method
    if (command.startsWith('LAMP:')) {
      const state = command.split(':')[1];
      return await this.sendLampCommand(state);
    } else if (command === 'FEED') {
      return await this.sendFeedCommand();
    } else if (command.startsWith('CLOTHESLINE:')) {
      const position = command.split(':')[1];
      return await this.sendClotheslineCommand(position);
    } else if (command.startsWith('DOOR:')) {
      const action = command.split(':')[1];
      return await this.sendDoorCommand(action);
    } else if (command.startsWith('GATE:')) {
      const action = command.split(':')[1];
      return await this.sendGateCommand(action);
    } else if (command.startsWith('WIFI:')) {
      const parts = command.substring(5).split(',');
      return await this.sendWiFiConfig(parts[0], parts[1], target);
    } else {
      throw new Error(`Unknown command: ${command}`);
    }
  }
}

export default CommandService;
