require('dotenv').config();
const { Client } = require('pg');
const inventoryService = require('./services/inventory.service');
const inventoryPrisma = require('./config/prisma');

async function main() {
  console.log('--- STARTING INVENTORY SYNCHRONIZATION ---');

  // Connect to admin database
  const adminClient = new Client({
    connectionString: 'postgres://admin:irctcpass@localhost:5432/admin_service_database',
  });
  await adminClient.connect();

  try {
    // 1. Fetch all schedules
    const resSchedules = await adminClient.query('SELECT * FROM schedules');
    const adminSchedules = resSchedules.rows;
    console.log(`Found ${adminSchedules.length} schedules in Admin DB.`);

    for (const schedule of adminSchedules) {
      const scheduleId = schedule.id;

      try {
        // Check if schedule inventory already exists
        const existing = await inventoryPrisma.scheduleInventory.findUnique({
          where: { scheduleId },
        });

        if (existing) {
          console.log(`Inventory already exists for schedule ${scheduleId}`);
          continue;
        }

        // 2. Fetch train details
        const trainRes = await adminClient.query('SELECT * FROM trains WHERE id = $1', [schedule.trainId]);
        const train = trainRes.rows[0];
        if (!train) {
          console.error(`Train with ID ${schedule.trainId} not found for schedule ${scheduleId}`);
          continue;
        }

        console.log(`Initializing inventory for schedule ${scheduleId} (${train.trainName})...`);

        // 3. Fetch seats
        const seatsRes = await adminClient.query('SELECT * FROM seats WHERE "trainId" = $1', [schedule.trainId]);
        const seats = seatsRes.rows;

        // 4. Fetch route stop sequence
        const routeStationsRes = await adminClient.query(`
          SELECT rs.*, s.name as "stationName", s.code as "stationCode"
          FROM route_stations rs
          JOIN stations s ON rs."stationId" = s.id
          JOIN routes r ON rs."routeId" = r.id
          WHERE r."trainId" = $1
          ORDER BY rs."sequenceNumber" ASC
        `, [schedule.trainId]);
        const routeStations = routeStationsRes.rows;

        const eventData = {
          scheduleId,
          trainId: train.id,
          trainNumber: train.trainNumber,
          trainName: train.trainName,
          departureDate: schedule.departureDate,
          seats: seats.map(s => ({
            seatId: s.id,
            seatNumber: s.seatNumber,
            seatType: s.seatType,
            price: s.price,
          })),
          route: routeStations.map(rs => ({
            stationId: rs.stationId,
            stationName: rs.stationName,
            stationCode: rs.stationCode,
            sequenceNumber: rs.sequenceNumber,
          })),
        };

        await inventoryService.initializeInventory(eventData);
        console.log(`✅ Successfully initialized inventory for schedule ${scheduleId}`);
      } catch (err) {
        console.error(`Failed to initialize inventory for schedule ${scheduleId}:`, err.message);
      }
    }
  } finally {
    await adminClient.end();
  }

  console.log('--- INVENTORY SYNCHRONIZATION COMPLETED ---');
}

main()
  .catch(console.error)
  .finally(async () => {
    await inventoryPrisma.$disconnect();
    process.exit(0);
  });
