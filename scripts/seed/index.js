const seedStations = require('./stations/seed-stations');
const prisma = require('../../admin-service/src/config/prisma');

async function main() {
  console.log('=== STARTING BHARATRAIL DATABASE SEEDING ===');
  await seedStations();
  console.log('=== BHARATRAIL DATABASE SEEDING COMPLETED ===');
}

main()
  .catch((err) => {
    console.error('❌ Master seeder failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
