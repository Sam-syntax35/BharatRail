const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../admin-service/.env') });

const prisma = require('../../../admin-service/src/config/prisma');
const { createRoute } = require('../../../admin-service/src/services/train.service');
const corridors = require('./corridors.json');

function minutesToHHMM(m) {
  const totalMinutes = m % 1440;
  const hrs = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mins = String(totalMinutes % 60).padStart(2, '0');
  return `${hrs}:${mins}`;
}

function generateTimings(numStops) {
  const times = [];
  let currentMinutes = 480; // Start at 08:00 AM
  
  for (let i = 0; i < numStops; i++) {
    if (i === 0) {
      times.push({
        arrivalTime: null,
        departureTime: minutesToHHMM(currentMinutes)
      });
    } else {
      const travelTime = 90 + Math.floor(Math.random() * 60); // 1.5 - 2.5 hours travel
      const arrival = currentMinutes + travelTime;
      
      if (i === numStops - 1) {
        times.push({
          arrivalTime: minutesToHHMM(arrival),
          departureTime: null
        });
      } else {
        const layover = 5 + Math.floor(Math.random() * 10); // 5 - 15 mins layover
        const departure = arrival + layover;
        times.push({
          arrivalTime: minutesToHHMM(arrival),
          departureTime: minutesToHHMM(departure)
        });
        currentMinutes = departure;
      }
    }
  }
  return times;
}

async function seedRoutes() {
  console.log('--- STARTING ROUTE SEEDER ---');

  if (!Array.isArray(corridors) || corridors.length === 0) {
    console.error('❌ Failed: Corridor dataset is empty or invalid.');
    process.exit(1);
  }

  console.log(`✔ Loaded ${corridors.length} corridors.`);

  // 1. Fetch all trains and stations
  const trains = await prisma.train.findMany();
  const dbStations = await prisma.station.findMany();

  if (trains.length === 0) {
    console.error('❌ Failed: No trains found in database. Seed trains first.');
    process.exit(1);
  }
  if (dbStations.length === 0) {
    console.error('❌ Failed: No stations found in database. Seed stations first.');
    process.exit(1);
  }

  console.log(`✔ Mapped ${trains.length} trains.`);

  // Create a map from code to stationId
  const stationMap = new Map();
  dbStations.forEach(s => stationMap.set(s.code, s.id));

  let createdRoutes = 0;
  let skippedExistingRoutes = 0;
  let publishedRouteEvents = 0;

  for (let idx = 0; idx < trains.length; idx++) {
    const train = trains[idx];

    // Check if train already has a route
    const existingRoute = await prisma.route.findUnique({
      where: { trainId: train.id }
    });

    if (existingRoute) {
      skippedExistingRoutes++;
      continue;
    }

    // Assign train to a corridor round-robin
    const corridor = corridors[idx % corridors.length];
    
    // Convert corridor station codes to station IDs
    const stationsPayload = [];
    let validCorridor = true;

    const timings = generateTimings(corridor.stations.length);
    let currentDistance = 0;

    for (let sIdx = 0; sIdx < corridor.stations.length; sIdx++) {
      const code = corridor.stations[sIdx];
      const stationId = stationMap.get(code);

      if (!stationId) {
        console.warn(`⚠️ Skipped train ${train.trainNumber}: Corridor "${corridor.corridorName}" references missing station code "${code}".`);
        validCorridor = false;
        break;
      }

      if (sIdx > 0) {
        currentDistance += 80 + Math.floor(Math.random() * 120); // 80 - 200 km gap
      }

      stationsPayload.push({
        stationId,
        sequenceNumber: sIdx + 1,
        arrivalTime: timings[sIdx].arrivalTime,
        departureTime: timings[sIdx].departureTime,
        distanceFromOrigin: currentDistance
      });
    }

    if (!validCorridor) {
      continue;
    }

    try {
      // 2. Insert route using the application's existing route creation service
      await createRoute({
        trainId: train.id,
        stations: stationsPayload
      });

      createdRoutes++;
      publishedRouteEvents++;
    } catch (err) {
      console.error(`❌ Error creating route for train ${train.trainNumber}:`, err.message);
    }
  }

  console.log('✔ Loaded corridors');
  console.log(`✔ Mapped trains: ${trains.length}`);
  console.log(`✔ Created routes: ${createdRoutes}`);
  console.log(`✔ Skipped existing routes: ${skippedExistingRoutes}`);
  console.log(`✔ Published route events: ${publishedRouteEvents}`);
  console.log('✔ Completed successfully');
}

if (require.main === module) {
  seedRoutes()
    .catch((err) => {
      console.error('❌ Seeding process encountered a fatal error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = seedRoutes;
