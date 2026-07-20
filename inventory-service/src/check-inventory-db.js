require('dotenv').config();
const prisma = require('./config/prisma');

async function main() {
  const inventories = await prisma.scheduleInventory.findMany();
  console.log('SCHEDULE INVENTORIES:', inventories.length);
  if (inventories.length > 0) {
    console.log(inventories);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
