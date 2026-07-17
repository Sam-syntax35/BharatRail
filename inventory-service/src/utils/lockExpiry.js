const prisma = require('../config/prisma');
const logger = require('../config/logger');
const { config } = require('../config');
const { retryTransaction } = require('./retryTransaction');
const inventoryService = require('../services/inventory.service');

async function releaseExpiredLocks() {
     const expired = await prisma.seatInventory.findMany({
          where: { status: 'LOCKED', lockExpiresAt: { lt: new Date() } },
     });

     if (expired.length === 0) return;

     logger.info(`Found ${expired.length} expired lock(s), releasing...`);

     for (const seat of expired) {
          try {
               await retryTransaction(async () => {
                    return prisma.$transaction(async (tx) => {
                         const current = await tx.$queryRaw`
                              SELECT status FROM seat_inventories WHERE id = ${seat.id} FOR UPDATE NOWAIT
                         `;
                         if (current[0]?.status !== 'LOCKED') return; // already changed, skip

                         await tx.$executeRaw`
                              UPDATE seat_inventories
                              SET status = 'AVAILABLE', "lockedBy" = NULL, "lockedAt" = NULL, "lockExpiresAt" = NULL,
                                  version = version + 1, "updatedAt" = NOW()
                              WHERE id = ${seat.id}
                         `;
                    });
               });
          } catch (err) {
               logger.error(`Failed to release expired lock for seat ${seat.seatId}`, { error: err.message });
          }
     }

     const affectedScheduleIds = [...new Set(expired.map(s => s.scheduleId))];
     for (const scheduleId of affectedScheduleIds) {
          try {
               await inventoryService.recountAndPublish(scheduleId);
          } catch (err) {
               logger.error(`Failed to recount/publish after lock expiry for schedule ${scheduleId}`, { error: err.message });
          }
     }

     logger.info(`Released ${expired.length} expired lock(s) across ${affectedScheduleIds.length} schedule(s)`);
}

function startLockExpiryJob() {
     const intervalMs = config.LOCK_EXPIRY_INTERVAL_MS;
     logger.info(`Lock expiry job started, checking every ${intervalMs / 1000}s`);

     const intervalId = setInterval(() => {
          releaseExpiredLocks().catch(err => {
               logger.error('Lock expiry job run failed', { error: err.message });
          });
     }, intervalMs);

     return intervalId;
}

module.exports = { startLockExpiryJob, releaseExpiredLocks };