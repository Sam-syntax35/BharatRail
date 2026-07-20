const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../admin-service/.env') });

const prisma = require('../../../admin-service/src/config/prisma');

function formatDate(date) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function seedSchedules() {
  console.log('--- STARTING SCHEDULE SEEDER ---');

  // 1. Determine days duration from argument or environment variable
  let days = 30;
  
  // Parse command line arguments like --days=90
  const args = process.argv.slice(2);
  const daysArg = args.find(arg => arg.startsWith('--days='));
  if (daysArg) {
    const parsed = parseInt(daysArg.split('=')[1], 10);
    if (!isNaN(parsed) && parsed > 0) {
      days = parsed;
    }
  } else if (process.env.DAYS) {
    const parsed = parseInt(process.env.DAYS, 10);
    if (!isNaN(parsed) && parsed > 0) {
      days = parsed;
    }
  }

  console.log(`✔ Configured duration: ${days} days.`);

  // 2. Fetch trains and existing schedules
  const trains = await prisma.train.findMany({
    include: { route: true }
  });

  const validTrains = trains.filter(t => t.route);
  console.log(`✔ Loaded trains: ${trains.length} total, ${validTrains.length} with routes.`);

  if (validTrains.length === 0) {
    console.warn('⚠️ No trains with routes found. Please seed routes first.');
    return;
  }

  const existingSchedules = await prisma.schedule.findMany({
    select: { trainId: true, departureDate: true }
  });

  // Map existing keys
  const existingKeys = new Set(existingSchedules.map(s => {
    return `${s.trainId}_${formatDate(s.departureDate)}`;
  }));

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const toCreate = [];
  let skippedSchedules = 0;

  for (const train of validTrains) {
    for (let d = 0; d < days; d++) {
      const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + d));
      const dateKey = `${train.id}_${formatDate(date)}`;

      if (existingKeys.has(dateKey)) {
        skippedSchedules++;
      } else {
        toCreate.push({
          trainId: train.id,
          departureDate: date,
          status: 'ACTIVE'
        });
      }
    }
  }

  let createdSchedules = 0;
  if (toCreate.length > 0) {
    // Perform efficient batch insert
    const result = await prisma.schedule.createMany({
      data: toCreate
    });
    createdSchedules = result.count;
  }

  console.log('✔ Loaded trains');
  console.log(`✔ Generated schedules: ${createdSchedules}`);
  console.log(`✔ Skipped schedules: ${skippedSchedules}`);
  console.log('✔ Completed successfully');
}

if (require.main === module) {
  seedSchedules()
    .catch((err) => {
      console.error('❌ Seeding process encountered a fatal error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = seedSchedules;
