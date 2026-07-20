const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../admin-service/.env') });
const prisma = require('../../../admin-service/src/config/prisma');
const stations = require('./stations.json');

async function seedStations() {
  console.log('--- STARTING STATION SEEDER ---');

  if (!Array.isArray(stations)) {
    console.error('❌ Failed: Station dataset is not an array.');
    process.exit(1);
  }

  console.log(`✔ Loaded station dataset containing ${stations.length} records.`);

  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const seenCodes = new Set();
  const seenNames = new Set();

  for (const s of stations) {
    // 1. Validation: check required fields
    if (!s.code || !s.name || !s.city) {
      console.warn(`⚠️ Skipped malformed record: ${JSON.stringify(s)}`);
      skippedCount++;
      continue;
    }

    const cleanCode = s.code.trim().toUpperCase();
    const cleanName = s.name.trim();
    const cleanCity = s.city.trim();
    const cleanState = s.state ? s.state.trim() : null;

    // Validate code length or format if needed
    if (cleanCode.length === 0 || cleanName.length === 0 || cleanCity.length === 0) {
      console.warn(`⚠️ Skipped invalid empty-field record: Code: "${cleanCode}", Name: "${cleanName}", City: "${cleanCity}"`);
      skippedCount++;
      continue;
    }

    // 2. Reject duplicate codes in the source dataset
    if (seenCodes.has(cleanCode)) {
      console.warn(`⚠️ Skipped duplicate code in source dataset: ${cleanCode}`);
      skippedCount++;
      continue;
    }
    seenCodes.add(cleanCode);

    // 3. Reject duplicate names in the source dataset (since name is @unique in schema)
    const normalizedName = cleanName.toLowerCase();
    if (seenNames.has(normalizedName)) {
      console.warn(`⚠️ Skipped duplicate name in source dataset: "${cleanName}"`);
      skippedCount++;
      continue;
    }
    seenNames.add(normalizedName);

    try {
      // 4. Idempotent Upsert (using Prisma Client)
      const existing = await prisma.station.findUnique({
        where: { code: cleanCode }
      });

      if (existing) {
        // Check if anything has changed to decide if we should update or treat it as a no-op
        const needsUpdate = 
          existing.name !== cleanName || 
          existing.city !== cleanCity || 
          existing.state !== cleanState;

        if (needsUpdate) {
          // Check if updating the name would violate unique constraint with another station
          const nameConflict = await prisma.station.findFirst({
            where: {
              name: cleanName,
              NOT: { code: cleanCode }
            }
          });

          if (nameConflict) {
            console.warn(`⚠️ Skipped update for station ${cleanCode}: Name "${cleanName}" already belongs to another station ${nameConflict.code}`);
            skippedCount++;
            continue;
          }

          await prisma.station.update({
            where: { code: cleanCode },
            data: { name: cleanName, city: cleanCity, state: cleanState }
          });
          updatedCount++;
        }
      } else {
        // Check if creating this station would violate name uniqueness
        const nameConflict = await prisma.station.findUnique({
          where: { name: cleanName }
        });

        if (nameConflict) {
          console.warn(`⚠️ Skipped insertion for station ${cleanCode}: Name "${cleanName}" already exists for station ${nameConflict.code}`);
          skippedCount++;
          continue;
        }

        await prisma.station.create({
          data: { code: cleanCode, name: cleanName, city: cleanCity, state: cleanState }
        });
        insertedCount++;
      }
    } catch (err) {
      console.error(`❌ Error seeding station ${cleanCode}:`, err.message);
      skippedCount++;
    }
  }

  console.log('✔ Loaded station dataset');
  console.log(`✔ Inserted ${insertedCount} stations`);
  console.log(`✔ Updated ${updatedCount} stations`);
  console.log(`✔ Skipped ${skippedCount} duplicates`);
  console.log('✔ Completed successfully');
}

if (require.main === module) {
  seedStations()
    .catch((err) => {
      console.error('❌ Seeding process encountered a fatal error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = seedStations;
