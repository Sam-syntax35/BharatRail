require('dotenv').config();
const prisma = require('./config/prisma');

async function main() {
  const stations = await prisma.station.findMany();
  console.log('STATIONS IN DATABASE:', stations.length);
  if (stations.length > 0) {
    console.log(stations.slice(0, 5));
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
