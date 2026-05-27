import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create initial device states for all ESP devices
  const deviceStates = [
    { espNumber: 1, isOnline: false },
    { espNumber: 2, isOnline: false },
    { espNumber: 3, isOnline: false },
    { espNumber: 4, isOnline: false },
  ];

  for (const device of deviceStates) {
    await prisma.deviceState.upsert({
      where: { espNumber: device.espNumber },
      update: {},
      create: device,
    });
  }

  console.log('Created device states for ESP 1-4');

  // Create initial AutoModeConfig (singleton with id=1)
  await prisma.autoModeConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      enabled: false,
      rainThreshold: 1600,
    },
  });

  console.log('Created auto mode config');

  // Create sample RFID whitelist entries
  const rfidEntries = [
    { uid: 'A1B2C3D4', description: 'Admin Card' },
    { uid: 'E5F6G7H8', description: 'User Card 1' },
  ];

  for (const entry of rfidEntries) {
    await prisma.rFIDWhitelist.upsert({
      where: { uid: entry.uid },
      update: {},
      create: entry,
    });
  }

  console.log('Created sample RFID whitelist entries');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
