const { execSync } = require('child_process');
const path = require('path');
const seedStations = require('./stations/seed-stations');
const seedTrains = require('./trains/seed-trains');
const seedRoutes = require('./routes/seed-routes');
const seedSchedules = require('./schedules/seed-schedules');
const prisma = require('../../admin-service/src/config/prisma');

async function main() {
  console.log('=== STARTING BHARATRAIL DATABASE SEEDING ===');
  await seedStations();
  await seedTrains();
  await seedRoutes();
  await seedSchedules();

  console.log('--- STARTING MANIFEST SYNCHRONIZATION ORCHESTRATION ---');
  try {
    console.log('✔ Syncing Elasticsearch');
    execSync('node src/sync-es.js', {
      cwd: path.resolve(__dirname, '../../admin-service'),
      stdio: 'ignore',
      env: { ...process.env, DATABASE_URL: undefined }
    });
    console.log('✔ Indexed stations');
    console.log('✔ Indexed routes');
    console.log('✔ Indexed schedules');
    
    console.log('✔ Syncing Inventory');
    execSync('node src/sync-inventory.js', {
      cwd: path.resolve(__dirname, '../../inventory-service'),
      stdio: 'ignore',
      env: { ...process.env, DATABASE_URL: undefined }
    });
    console.log('✔ Created ScheduleInventory');
    console.log('✔ Created SeatInventory');
    console.log('✔ Synchronization complete');
  } catch (err) {
    console.error('❌ Orchestration synchronization failed:', err.message);
  }

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
