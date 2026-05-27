/**
 * AutoModeService manages clothesline auto mode
 * Monitors rain sensor and automatically triggers clothesline IN command
 * State is persisted in database as singleton (id=1)
 */
class AutoModeService {
  constructor(commandService, prisma) {
    this.commandService = commandService;
    this.prisma = prisma;
    this.enabled = false;
    this.rainThreshold = 1600;
    this.lastTriggeredAt = null;
    this.cooldownPeriod = 60000; // 60 seconds cooldown
  }

  /**
   * Initialize auto mode service
   * Load state from database
   */
  async initialize() {
    try {
      const config = await this.getConfig();
      this.enabled = config.enabled;
      this.rainThreshold = config.rainThreshold;
      this.lastTriggeredAt = config.lastTriggeredAt;
      
      console.log(`✓ Auto Mode initialized: ${this.enabled ? 'ENABLED' : 'DISABLED'}`);
    } catch (error) {
      console.error('Failed to initialize auto mode:', error);
    }
  }

  /**
   * Enable auto mode
   */
  async enableAutoMode() {
    await this.updateConfig({ enabled: true });
    this.enabled = true;
    console.log('✓ Auto Mode ENABLED');
    
    return { enabled: true, rainThreshold: this.rainThreshold };
  }

  /**
   * Disable auto mode
   */
  async disableAutoMode() {
    await this.updateConfig({ enabled: false });
    this.enabled = false;
    console.log('✓ Auto Mode DISABLED');
    
    return { enabled: false, rainThreshold: this.rainThreshold };
  }

  /**
   * Get current auto mode state
   */
  async getAutoModeState() {
    const config = await this.getConfig();
    return {
      enabled: config.enabled,
      rainThreshold: config.rainThreshold,
      lastTriggeredAt: config.lastTriggeredAt,
    };
  }

  /**
   * Handle incoming rain sensor data
   * Triggers clothesline IN if threshold exceeded and auto mode enabled
   */
  async onRainData(data) {
    if (!this.enabled) {
      return;
    }

    const { value } = data;

    // Check if rain threshold exceeded
    if (value > this.rainThreshold) {
      // Check cooldown period
      if (this.lastTriggeredAt) {
        const timeSinceLastTrigger = Date.now() - new Date(this.lastTriggeredAt).getTime();
        if (timeSinceLastTrigger < this.cooldownPeriod) {
          console.log(`⏳ Auto Mode: Cooldown active (${Math.round((this.cooldownPeriod - timeSinceLastTrigger) / 1000)}s remaining)`);
          return;
        }
      }

      // Trigger clothesline IN
      await this.triggerClotheslineIn(value);
    }
  }

  /**
   * Trigger clothesline IN command
   */
  async triggerClotheslineIn(rainValue) {
    try {
      console.log(`🌧️ Auto Mode: Rain threshold exceeded (${rainValue} > ${this.rainThreshold})`);
      console.log('🌧️ Auto Mode: Triggering CLOTHESLINE:IN');

      await this.commandService.sendClotheslineCommand('IN');
      
      // Update last triggered timestamp
      this.lastTriggeredAt = new Date();
      await this.updateConfig({ lastTriggeredAt: this.lastTriggeredAt });

      console.log('✓ Auto Mode: Clothesline IN command sent');
    } catch (error) {
      console.error('✗ Auto Mode: Failed to trigger clothesline IN:', error);
    }
  }

  /**
   * Get auto mode config from database (singleton with id=1)
   */
  async getConfig() {
    let config = await this.prisma.autoModeConfig.findUnique({
      where: { id: 1 },
    });

    // Create default config if not exists
    if (!config) {
      config = await this.prisma.autoModeConfig.create({
        data: {
          id: 1,
          enabled: false,
          rainThreshold: 1600,
        },
      });
    }

    return config;
  }

  /**
   * Update auto mode config in database (upsert with id=1)
   */
  async updateConfig(data) {
    try {
      const config = await this.prisma.autoModeConfig.upsert({
        where: { id: 1 },
        update: data,
        create: {
          id: 1,
          enabled: data.enabled !== undefined ? data.enabled : false,
          rainThreshold: data.rainThreshold || 1600,
          lastTriggeredAt: data.lastTriggeredAt || null,
        },
      });

      return config;
    } catch (error) {
      console.error('Failed to update auto mode config:', error);
      throw error;
    }
  }

  /**
   * Update rain threshold
   */
  async setRainThreshold(threshold) {
    if (threshold < 0 || threshold > 4095) {
      throw new Error('Invalid rain threshold: must be between 0 and 4095');
    }

    await this.updateConfig({ rainThreshold: threshold });
    this.rainThreshold = threshold;
    
    console.log(`✓ Auto Mode: Rain threshold updated to ${threshold}`);
    return { rainThreshold: threshold };
  }
}

export default AutoModeService;
