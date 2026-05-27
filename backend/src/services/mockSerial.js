import EventEmitter from 'events';

/**
 * MockSerial simulates ESP32 data for development without hardware
 * Generates realistic sensor data and device status messages
 */
class MockSerial extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.intervals = [];
    
    // Simulated device states
    this.state = {
      esp1: {
        lampState: 'OFF',
        gasValue: 1200,
        wifiStatus: 'OK',
      },
      esp2: {
        rainValue: 800,
        clotheslinePos: 'OUT',
      },
      esp3: {
        doorState: 'CLOSE',
        gateState: 'CLOSE',
      },
    };
  }

  /**
   * Start mock data generation
   */
  start() {
    if (this.isRunning) return;
    
    console.log('🎭 Mock Serial: Starting data simulation...');
    this.isRunning = true;

    // ESP1: Status every 3 seconds
    this.intervals.push(setInterval(() => {
      this.emitESP1Status();
    }, 3000));

    // ESP1: Gas sensor reading every 3 seconds (with variation)
    this.intervals.push(setInterval(() => {
      this.state.esp1.gasValue = this.randomGasValue();
      this.emit('data', `ESP1:GAS:${this.state.esp1.gasValue}`);
    }, 3000));

    // ESP2: Status every 3 seconds
    this.intervals.push(setInterval(() => {
      this.emitESP2Status();
    }, 3000));

    // ESP2: Rain sensor reading every 3 seconds (with variation)
    this.intervals.push(setInterval(() => {
      this.state.esp2.rainValue = this.randomRainValue();
      this.emit('data', `ESP2:RAIN:${this.state.esp2.rainValue}`);
    }, 3000));

    // ESP3: Status every 3 seconds
    this.intervals.push(setInterval(() => {
      this.emitESP3Status();
    }, 3000));

    // ESP4: System ready on start
    setTimeout(() => {
      this.emit('data', 'ESP4:SYSTEM:READY');
    }, 1000);

    // Simulate occasional RFID scan (every 30-60 seconds)
    this.intervals.push(setInterval(() => {
      if (Math.random() > 0.7) {
        const uid = this.randomRFIDUID();
        this.emit('data', `ESP3:RFID:${uid}`);
      }
    }, 30000));

    // Simulate occasional gas alert (when value > 1800)
    this.intervals.push(setInterval(() => {
      if (this.state.esp1.gasValue > 1800) {
        this.emit('data', 'ESP1:GAS:ALERT');
      }
    }, 5000));

    // Simulate occasional rain alert (when value > 1600)
    this.intervals.push(setInterval(() => {
      if (this.state.esp2.rainValue > 1600) {
        this.emit('data', 'ESP2:RAIN:ALERT_CLOTHESLINE_IN');
      }
    }, 5000));
  }

  /**
   * Stop mock data generation
   */
  stop() {
    if (!this.isRunning) return;
    
    console.log('🎭 Mock Serial: Stopping data simulation...');
    this.isRunning = false;
    
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  /**
   * Simulate command execution
   */
  handleCommand(command) {
    console.log(`🎭 Mock Serial: Received command: ${command}`);

    // Parse and update state based on command
    if (command.includes('LAMP:ON')) {
      this.state.esp1.lampState = 'ON';
      setTimeout(() => this.emit('data', 'ESP1:LAMP:ON'), 100);
    } else if (command.includes('LAMP:OFF')) {
      this.state.esp1.lampState = 'OFF';
      setTimeout(() => this.emit('data', 'ESP1:LAMP:OFF'), 100);
    } else if (command.includes('FEED')) {
      setTimeout(() => this.emit('data', 'ESP1:FEED:DONE'), 500);
    } else if (command.includes('CLOTHESLINE:IN')) {
      this.state.esp2.clotheslinePos = 'IN';
      setTimeout(() => this.emit('data', 'ESP2:CLOTHESLINE:IN'), 200);
    } else if (command.includes('CLOTHESLINE:OUT')) {
      this.state.esp2.clotheslinePos = 'OUT';
      setTimeout(() => this.emit('data', 'ESP2:CLOTHESLINE:OUT'), 200);
    } else if (command.includes('DOOR:OPEN')) {
      this.state.esp3.doorState = 'OPEN';
      setTimeout(() => this.emit('data', 'ESP3:DOOR:OPEN'), 150);
      // Auto-close after 3 seconds
      setTimeout(() => {
        this.state.esp3.doorState = 'CLOSE';
        this.emit('data', 'ESP3:DOOR:CLOSE');
      }, 3150);
    } else if (command.includes('DOOR:CLOSE')) {
      this.state.esp3.doorState = 'CLOSE';
      setTimeout(() => this.emit('data', 'ESP3:DOOR:CLOSE'), 150);
    } else if (command.includes('GATE:OPEN')) {
      this.state.esp3.gateState = 'OPEN';
      setTimeout(() => this.emit('data', 'ESP3:GATE:OPEN'), 150);
      // Auto-close after 4 seconds
      setTimeout(() => {
        this.state.esp3.gateState = 'CLOSE';
        this.emit('data', 'ESP3:GATE:CLOSE');
      }, 4150);
    } else if (command.includes('GATE:CLOSE')) {
      this.state.esp3.gateState = 'CLOSE';
      setTimeout(() => this.emit('data', 'ESP3:GATE:CLOSE'), 150);
    } else if (command.includes('WIFI:')) {
      setTimeout(() => this.emit('data', 'ESP1:WIFI:CONNECTED'), 1000);
      setTimeout(() => this.emit('data', 'ESP2:WIFI:CONNECTED'), 1100);
      setTimeout(() => this.emit('data', 'ESP3:WIFI:CONNECTED'), 1200);
    }
  }

  // Helper methods for generating realistic data

  emitESP1Status() {
    const status = `OK,GAS=${this.state.esp1.gasValue},LAMP=${this.state.esp1.lampState},WIFI=${this.state.esp1.wifiStatus}`;
    this.emit('data', `ESP1:STATUS:${status}`);
  }

  emitESP2Status() {
    const status = `OK,RAIN=${this.state.esp2.rainValue},CLOTHESLINE=${this.state.esp2.clotheslinePos}`;
    this.emit('data', `ESP2:STATUS:${status}`);
  }

  emitESP3Status() {
    const status = `OK,DOOR=${this.state.esp3.doorState},GATE=${this.state.esp3.gateState}`;
    this.emit('data', `ESP3:STATUS:${status}`);
  }

  randomGasValue() {
    // Generate gas value between 1000-2000 with occasional spikes
    const base = 1200;
    const variation = Math.random() * 400 - 200; // -200 to +200
    const spike = Math.random() > 0.95 ? 600 : 0; // Occasional spike
    return Math.round(base + variation + spike);
  }

  randomRainValue() {
    // Generate rain value between 500-1800 with occasional rain
    const base = 800;
    const variation = Math.random() * 400 - 200; // -200 to +200
    const rain = Math.random() > 0.9 ? 800 : 0; // Occasional rain
    return Math.round(base + variation + rain);
  }

  randomRFIDUID() {
    const uids = ['A1B2C3D4', 'E5F6G7H8', '12345678', 'ABCDEF01'];
    return uids[Math.floor(Math.random() * uids.length)];
  }
}

export default MockSerial;
