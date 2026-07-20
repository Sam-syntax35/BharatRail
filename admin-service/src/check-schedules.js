require('dotenv').config();
const prisma = require('./config/prisma');

async function main() {
  const schedules = await prisma.schedule.findMany({
    include: {
      train: true
    }
  });
  console.log('SCHEDULES IN DATABASE:', JSON.stringify(schedules, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
