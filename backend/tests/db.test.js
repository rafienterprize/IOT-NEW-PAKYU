import prisma from '../src/db.js';

describe('Database Connection', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should connect to database', async () => {
    await expect(prisma.$connect()).resolves.not.toThrow();
  });

  test('should create and retrieve DeviceState', async () => {
    const deviceState = await prisma.deviceState.upsert({
      where: { espNumber: 1 },
      update: { isOnline: true },
      create: { espNumber: 1, isOnline: true },
    });

    expect(deviceState).toBeDefined();
    expect(deviceState.espNumber).toBe(1);
    expect(deviceState.isOnline).toBe(true);
  });

  test('should create and retrieve DeviceLog', async () => {
    const log = await prisma.deviceLog.create({
      data: {
        espNumber: 1,
        messageType: 'STATUS',
        message: 'TEST',
      },
    });

    expect(log).toBeDefined();
    expect(log.espNumber).toBe(1);
    expect(log.messageType).toBe('STATUS');

    const retrieved = await prisma.deviceLog.findFirst({
      where: { id: log.id },
    });

    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(log.id);
  });

  test('should create and retrieve RFID whitelist entry', async () => {
    const uid = 'TEST123';
    const entry = await prisma.rFIDWhitelist.upsert({
      where: { uid },
      update: {},
      create: { uid, description: 'Test Card' },
    });

    expect(entry).toBeDefined();
    expect(entry.uid).toBe(uid);

    const retrieved = await prisma.rFIDWhitelist.findUnique({
      where: { uid },
    });

    expect(retrieved).toBeDefined();
    expect(retrieved.uid).toBe(uid);
  });
});
