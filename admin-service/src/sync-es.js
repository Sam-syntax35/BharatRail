require('dotenv').config();
const prisma = require('./config/prisma');
const { esClient } = require('./config/elasticsearch');

async function syncToElasticsearch() {
  console.log('--- STARTING DATABASE SYNC TO ELASTICSEARCH ---');

  // 1. Sync Stations
  const stations = await prisma.station.findMany();
  console.log(`Found ${stations.length} stations in PostgreSQL. Syncing...`);

  for (const station of stations) {
    const doc = {
      stationId: station.id,
      name: station.name,
      code: station.code,
      city: station.city,
      suggest: {
        input: [station.name, station.code, station.city].filter(Boolean),
        weight: 10,
      }
    };

    try {
      await esClient.index({
        index: 'stations',
        id: String(station.id),
        document: doc,
        refresh: true,
      });

      console.log(`Indexed Station: ${station.name} (${station.code})`);
    } catch (err) {
      console.error(`Failed to index Station ${station.name}:`, err.message);
    }
  }

  // 2. Sync Trains & Routes
  const trains = await prisma.train.findMany({
    include: {
      seats: true,
      route: {
        include: {
          routeStations: {
            include: {
              station: true
            }
          }
        }
      },
      schedules: true
    }
  });
  console.log(`Found ${trains.length} trains in PostgreSQL. Syncing...`);

  for (const train of trains) {
    const seatSummary = { total: 0, LOWER: 0, MIDDLE: 0, UPPER: 0, SIDE_LOWER: 0, SIDE_UPPER: 0 };
    (train.seats || []).forEach((s) => {
      seatSummary.total++;
      if (seatSummary[s.seatType] !== undefined) seatSummary[s.seatType]++;
    });

    const routeStations = train.route?.routeStations || [];
    const route = routeStations.map((rs) => ({
      stationId: rs.station.id,
      stationName: rs.station.name,
      stationCode: rs.station.code,
      sequenceNumber: rs.sequenceNumber,
      arrivalTime: rs.arrivalTime,
      departureTime: rs.departureTime,
      distanceFromOrigin: rs.distanceFromOrigin,
    }));

    const schedules = (train.schedules || []).map((s) => ({
      scheduleId: s.id,
      departureDate: s.departureDate,
      status: s.status,
      available: train.seats?.length || 0,
      locked: 0,
      booked: 0
    }));

    const doc = {
      trainId: train.id,
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      route,
      schedules,
      seatSummary
    };

    try {
      await esClient.index({
        index: 'trains',
        id: String(train.id),
        document: doc,
        refresh: true,
      });

      console.log(`Indexed Train: ${train.trainNumber} — ${train.trainName}`);
    } catch (err) {
      console.error(`Failed to index Train ${train.trainNumber}:`, err.message);
    }
  }

  console.log('--- DATABASE SYNC TO ELASTICSEARCH COMPLETED ---');
}

syncToElasticsearch()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
