process.env.SEED_MODE = 'true';
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

  console.log('\n======================================');
  console.log('🔄 STARTING POST-SEED SYNCHRONIZATION');
  console.log('======================================');

  try {
    console.log('\n🔍 Synchronizing Elasticsearch...');
    execSync('node src/sync-es.js', {
      cwd: path.resolve(__dirname, '../../admin-service'),
      stdio: 'inherit',
      env: { 
        ...process.env, 
        DATABASE_URL: process.env.DATABASE_URL || undefined 
      }
    });
    console.log('✅ Elasticsearch synchronization completed.');

    console.log('\n🎫 Initializing Inventory...');
    execSync('node src/sync-inventory.js', {
      cwd: path.resolve(__dirname, '../../inventory-service'),
      stdio: 'inherit',
      env: { 
        ...process.env, 
        DATABASE_URL: process.env.INVENTORY_DATABASE_URL || undefined,
        ADMIN_DATABASE_URL: process.env.DATABASE_URL || process.env.ADMIN_DATABASE_URL || undefined
      }
    });
    console.log('✅ Inventory synchronization completed.');
    console.log('\n🎉 All synchronization completed successfully.');
  } catch (err) {
    console.error('\n❌ Synchronization failed.');
    console.error(err.message);
    throw err;
  }

  console.log('\n======================================');
  console.log('✅ BHARATRAIL DATABASE SEEDING COMPLETE');
  console.log('======================================');
}

main()
  .catch((err) => {
    console.error('❌ Master seeder failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
