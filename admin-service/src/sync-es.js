require('dotenv').config();
const prisma = require('./config/prisma');

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

    const res = await fetch(`http://localhost:9200/stations/_doc/${station.id}?refresh=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    });
    
    if (res.ok) {
      console.log(`Indexed Station: ${station.name} (${station.code})`);
    } else {
      const errText = await res.text();
      console.error(`Failed to index Station ${station.name}:`, errText);
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

    const res = await fetch(`http://localhost:9200/trains/_doc/${train.id}?refresh=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    });

    if (res.ok) {
      console.log(`Indexed Train: ${train.trainNumber} — ${train.trainName}`);
    } else {
      const errText = await res.text();
      console.error(`Failed to index Train ${train.trainNumber}:`, errText);
    }
  }

  console.log('--- DATABASE SYNC TO ELASTICSEARCH COMPLETED ---');
}

syncToElasticsearch()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
