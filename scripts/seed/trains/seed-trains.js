const path = require('path');
const dotenv = require('dotenv');

if (!process.env.DATABASE_URL) {
  dotenv.config({
    path: path.resolve(__dirname, '../../../admin-service/.env'),
  });
}
const prisma = require('../../../admin-service/src/config/prisma');
const trains = require('./trains.json');

const SEAT_TYPES = ['LOWER', 'MIDDLE', 'UPPER', 'SIDE_LOWER', 'SIDE_UPPER'];
const VALID_COACH_NAMES = ['AC', 'Sleeper', 'Chair Car', 'Second Sitting', 'General'];

async function seedTrains() {
  console.log('--- STARTING TRAIN SEEDER ---');

  if (!Array.isArray(trains)) {
    console.error('❌ Failed: Train dataset is not an array.');
    process.exit(1);
  }

  console.log(`✔ Loaded train dataset containing ${trains.length} records.`);

  let insertedTrains = 0;
  let updatedTrains = 0;
  let skippedTrains = 0;
  let totalGeneratedSeats = 0;
  let skippedSeats = 0;
  const seenTrainNumbers = new Set();

  for (const t of trains) {
    // 1. Validation
    if (!t.trainNumber || !t.trainName || !t.coachName || typeof t.totalSeats !== 'number') {
      console.warn(`⚠️ Skipped malformed train record: ${JSON.stringify(t)}`);
      skippedTrains++;
      continue;
    }

    const cleanNumber = t.trainNumber.trim();
    const cleanName = t.trainName.trim();
    const cleanCoach = t.coachName.trim();
    const totalSeats = t.totalSeats;

    if (totalSeats <= 0) {
      console.warn(`⚠️ Skipped train ${cleanNumber} with non-positive seats: ${totalSeats}`);
      skippedTrains++;
      continue;
    }

    if (!VALID_COACH_NAMES.includes(cleanCoach)) {
      console.warn(`⚠️ Skipped train ${cleanNumber} with unsupported coachName: "${cleanCoach}"`);
      skippedTrains++;
      continue;
    }

    if (seenTrainNumbers.has(cleanNumber)) {
      console.warn(`⚠️ Skipped duplicate train number in source dataset: ${cleanNumber}`);
      skippedTrains++;
      continue;
    }
    seenTrainNumbers.add(cleanNumber);

    try {
      // 2. Idempotent Upsert Train
      const existingTrain = await prisma.train.findUnique({
        where: { trainNumber: cleanNumber },
        include: { seats: true }
      });

      let dbTrain;
      let trainAction = 'none';

      if (existingTrain) {
        const needsUpdate =
          existingTrain.trainName !== cleanName ||
          existingTrain.coachName !== cleanCoach ||
          existingTrain.totalSeats !== totalSeats;

        if (needsUpdate) {
          dbTrain = await prisma.train.update({
            where: { trainNumber: cleanNumber },
            data: { trainName: cleanName, coachName: cleanCoach, totalSeats }
          });
          updatedTrains++;
          trainAction = 'updated';
        } else {
          dbTrain = existingTrain;
          trainAction = 'skipped';
        }
      } else {
        dbTrain = await prisma.train.create({
          data: { trainNumber: cleanNumber, trainName: cleanName, coachName: cleanCoach, totalSeats }
        });
        insertedTrains++;
        trainAction = 'inserted';
      }

      // 3. Seat Generation
      const existingSeatsMap = new Map();
      if (existingTrain && existingTrain.seats) {
        existingTrain.seats.forEach(s => {
          existingSeatsMap.set(s.seatNumber, s);
        });
      }

      const seatsToInsert = [];
      const seatsToUpdate = [];

      for (let i = 1; i <= totalSeats; i++) {
        // Seat type selection: rotate through SEAT_TYPES
        const seatType = SEAT_TYPES[(i - 1) % SEAT_TYPES.length];
        const price = t.basePrice || 500; // Use basePrice from JSON

        const existingSeat = existingSeatsMap.get(i);

        if (existingSeat) {
          // Check if seat fields changed
          if (existingSeat.seatType !== seatType || existingSeat.price !== price) {
            seatsToUpdate.push(prisma.seat.update({
              where: { id: existingSeat.id },
              data: { seatType, price }
            }));
            totalGeneratedSeats++;
          } else {
            skippedSeats++;
          }
        } else {
          seatsToInsert.push({
            trainId: dbTrain.id,
            seatNumber: i,
            seatType,
            price
          });
          totalGeneratedSeats++;
        }
      }

      // Execute seat inserts/updates inside transaction
      if (seatsToInsert.length > 0) {
        await prisma.seat.createMany({
          data: seatsToInsert
        });
      }
      if (seatsToUpdate.length > 0) {
        await prisma.$transaction(seatsToUpdate);
      }

      if (trainAction === 'skipped' && seatsToInsert.length === 0 && seatsToUpdate.length === 0) {
        skippedTrains++;
      }

    } catch (err) {
      console.error(`❌ Error seeding train ${cleanNumber}:`, err.message);
      skippedTrains++;
    }
  }

  console.log('✔ Loaded train dataset');
  console.log(`✔ Inserted trains: ${insertedTrains}`);
  console.log(`✔ Updated trains: ${updatedTrains}`);
  console.log(`✔ Skipped trains: ${skippedTrains}`);
  console.log(`✔ Generated seats: ${totalGeneratedSeats}`);
  console.log(`✔ Skipped existing seats: ${skippedSeats}`);
  console.log('✔ Completed successfully');
}

if (require.main === module) {
  seedTrains()
    .catch((err) => {
      console.error('❌ Seeding process encountered a fatal error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = seedTrains;
