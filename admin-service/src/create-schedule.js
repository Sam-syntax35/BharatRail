require('dotenv').config();
const prisma = require('./config/prisma');

async function main() {
  console.log('--- CREATING SCHEDULE FOR AUGUST 17, 2026 ---');

  // Find all trains
  const trains = await prisma.train.findMany();
  console.log(`Found ${trains.length} trains in the database.`);

  const dateToSchedule = new Date('2026-08-17T00:00:00.000Z');

  for (const train of trains) {
    try {
      const existing = await prisma.schedule.findUnique({
        where: {
          trainId_departureDate: {
            trainId: train.id,
            departureDate: dateToSchedule,
          },
        },
      });

      if (existing) {
        console.log(`Schedule already exists for train ${train.trainName} (${train.trainNumber}) on 2026-08-17`);
      } else {
        const created = await prisma.schedule.create({
          data: {
            trainId: train.id,
            departureDate: dateToSchedule,
            status: 'ACTIVE',
          },
        });
        console.log(`✅ Created Schedule: ${train.trainName} on 2026-08-17 (Schedule ID: ${created.id})`);
      }
    } catch (err) {
      console.error(`Failed to create schedule for train ${train.trainName}:`, err.message);
    }
  }

  console.log('--- SCHEDULE CREATION COMPLETED ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
