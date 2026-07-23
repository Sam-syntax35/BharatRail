const path = require('path');
const dotenv = require('dotenv');

if (!process.env.DATABASE_URL) {
  dotenv.config({
    path: path.resolve(__dirname, '../../../admin-service/.env'),
  });
}

const prisma = require('../../../admin-service/src/config/prisma');
const corridors = require('./corridors.json');

function minutesToHHMM(m) {
  const totalMinutes = m % 1440;
  const hrs = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mins = String(totalMinutes % 60).padStart(2, '0');
  return `${hrs}:${mins}`;
}

function generateTimings(numStops) {
  const times = [];
  let currentMinutes = 480; // 08:00 AM

  for (let i = 0; i < numStops; i++) {
    if (i === 0) {
      times.push({
        arrivalTime: null,
        departureTime: minutesToHHMM(currentMinutes),
      });
    } else {
      const travelTime = 90 + Math.floor(Math.random() * 60);
      const arrival = currentMinutes + travelTime;

      if (i === numStops - 1) {
        times.push({
          arrivalTime: minutesToHHMM(arrival),
          departureTime: null,
        });
      } else {
        const layover = 5 + Math.floor(Math.random() * 10);
        const departure = arrival + layover;

        times.push({
          arrivalTime: minutesToHHMM(arrival),
          departureTime: minutesToHHMM(departure),
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
    throw new Error('Corridor dataset is empty or invalid.');
  }

  console.log(`✔ Loaded ${corridors.length} corridors.`);

  const trains = await prisma.train.findMany();
  const dbStations = await prisma.station.findMany();

  if (trains.length === 0) {
    throw new Error('No trains found. Seed trains first.');
  }

  if (dbStations.length === 0) {
    throw new Error('No stations found. Seed stations first.');
  }

  console.log(`✔ Mapped ${trains.length} trains.`);

  const stationMap = new Map();
  dbStations.forEach((station) => {
    stationMap.set(station.code, station.id);
  });

  let createdRoutes = 0;
  let skippedExistingRoutes = 0;
  let skippedInvalidCorridors = 0;

  for (let idx = 0; idx < trains.length; idx++) {
    const train = trains[idx];
    const corridor = corridors[idx % corridors.length];

    // Skip if this train already has a route
    const existingRoute = await prisma.route.findUnique({
      where: {
        trainId: train.id,
      },
    });

    if (existingRoute) {
      skippedExistingRoutes++;
      continue;
    }

    const stationsPayload = [];
    const timings = generateTimings(corridor.stations.length);

    let currentDistance = 0;
    let validCorridor = true;

    for (let sIdx = 0; sIdx < corridor.stations.length; sIdx++) {
      const stationCode = corridor.stations[sIdx];
      const stationId = stationMap.get(stationCode);

      if (!stationId) {
        console.warn(
          `⚠️ Missing station "${stationCode}" for corridor "${corridor.corridorName}". Skipping train ${train.trainNumber}.`
        );
        validCorridor = false;
        break;
      }

      if (sIdx > 0) {
        currentDistance += 80 + Math.floor(Math.random() * 120);
      }

      stationsPayload.push({
        stationId,
        sequenceNumber: sIdx + 1,
        arrivalTime: timings[sIdx].arrivalTime,
        departureTime: timings[sIdx].departureTime,
        distanceFromOrigin: currentDistance,
      });
    }

    if (!validCorridor) {
      skippedInvalidCorridors++;
      continue;
    }

    try {
      await prisma.route.create({
        data: {
          trainId: train.id,
          routeStations: {
            create: stationsPayload,
          },
        },
      });

      createdRoutes++;
    } catch (err) {
      console.log("\n==========================");
      console.log("Train:", train.trainNumber);
      console.log("Corridor:", corridor.corridorName);
      console.dir(err, { depth: null });
      console.log("==========================\n");

      if (err.code === "P2002") {
        skippedExistingRoutes++;
      }
    }
  }

  console.log('✔ Route seeding completed');
  console.log(`✔ Total trains: ${trains.length}`);
  console.log(`✔ Routes created: ${createdRoutes}`);
  console.log(`✔ Existing routes skipped: ${skippedExistingRoutes}`);
  console.log(`✔ Invalid corridors skipped: ${skippedInvalidCorridors}`);
}

if (require.main === module) {
  seedRoutes()
    .catch((err) => {
      console.error('❌ Route seeding failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = seedRoutes;