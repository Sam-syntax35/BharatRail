const prisma = require('../config/prisma');
const logger = require('../config/logger');
const inventoryProducer = require('../kafka/producer/inventory.producer');
const { retryTransaction } = require('../utils/retryTransaction');
const { BadRequestError, NotFoundError, ConflictError, ForbiddenError } = require('../utils/error');
const { config } = require('../config');

const initializeInventory = async (eventData) => {
     const { scheduleId, trainId, trainNumber, trainName, departureDate, seats } = eventData;

     if (!scheduleId || !seats || !seats.length) {
          logger.warn('Invalid SCHEDULE_CREATED event — missing scheduleId or seats');
          return;
     }

     const eventKey = `SCHEDULE_CREATED:${scheduleId}`;

     const existing = await prisma.idempotencyRecord.findUnique({ where: { eventKey } });
     if (existing) {
          logger.info(`Duplicate event skipped: ${eventKey}`);
          return;
     }

     const totalSeats = seats.length;

     await prisma.$transaction(async (tx) => {
          const schedule = await tx.scheduleInventory.create({
               data: {
                    scheduleId, trainId, trainNumber, trainName,
                    departureDate: new Date(departureDate),
                    totalSeats, available: totalSeats, locked: 0, booked: 0,
                    status: 'ACTIVE',
               },
          });

          const seatData = seats.map(seat => ({
               scheduleInventoryId: schedule.id,
               scheduleId, seatId: seat.seatId, seatNumber: seat.seatNumber,
               seatType: seat.seatType, price: seat.price, status: 'AVAILABLE',
          }));

          await tx.seatInventory.createMany({ data: seatData });

          if (eventData.route && eventData.route.length > 0) {
               const routeStopData = eventData.route.map(rs => ({
                    scheduleId, stationId: rs.stationId, stationName: rs.stationName,
                    stationCode: rs.stationCode, sequenceNumber: rs.sequenceNumber,
               }));
               await tx.routeStop.createMany({ data: routeStopData });
               logger.info(`Persisted ${routeStopData.length} route stops for schedule ${scheduleId}`);
          }

          await tx.idempotencyRecord.create({ data: { eventKey } });
     });

     logger.info(`Inventory initialized for schedule ${scheduleId} with ${totalSeats} seats`);

     try {
          await inventoryProducer.publishSeatAvailabilityUpdated(scheduleId, trainId, totalSeats, 0, 0);
     } catch (err) {
          logger.error('Failed to publish initial availability event after retries', { scheduleId, error: err.message });
     }
};

const cancelScheduleInventory = async (eventData) => {
     const data = eventData.data || eventData;
     const scheduleId = data.scheduleId || data.id;

     if (!scheduleId) {
          logger.warn('Invalid SCHEDULE_CANCELLED event — missing scheduleId');
          return;
     }

     const eventKey = `SCHEDULE_CANCELLED:${scheduleId}`;

     const existing = await prisma.idempotencyRecord.findUnique({ where: { eventKey } });
     if (existing) {
          logger.info(`Duplicate event skipped: ${eventKey}`);
          return;
     }

     const schedule = await prisma.scheduleInventory.findUnique({ where: { scheduleId } });
     if (!schedule) {
          logger.warn(`Schedule ${scheduleId} not found in inventory — skipping cancellation`);
          return;
     }

     await prisma.$transaction(async (tx) => {
          await tx.scheduleInventory.update({
               where: { scheduleId },
               data: { status: 'CANCELLED', available: 0, locked: 0, booked: 0, version: { increment: 1 } },
          });

          await tx.seatInventory.updateMany({
               where: { scheduleId },
               data: { status: 'CANCELLED' },
          });

          await tx.idempotencyRecord.create({ data: { eventKey } });
     });

     logger.info(`Inventory cancelled for schedule ${scheduleId}`);

     try {
          await inventoryProducer.publishSeatAvailabilityUpdated(scheduleId, schedule.trainId, 0, 0, 0);
     } catch (err) {
          logger.error('Failed to publish cancellation availability event after retries', { scheduleId, error: err.message });
     }
};



// ─── Segment Booking Helpers ─────────────────────────────────────────────────

async function recomputeSegmentSeatStatuses(tx, scheduleId, seatIds) {
     const statusChanges = { nowAvailable: 0, nowOccupied: 0, lockedToBooked: 0, bookedToLocked: 0 };

     for (const seatId of seatIds) {
          const locks = await tx.seatSegmentLock.findMany({
               where: { scheduleId, seatId, status: { in: ['LOCKED', 'BOOKED'] } },
               select: { status: true },
          });

          let newStatus;
          if (locks.length === 0) newStatus = 'AVAILABLE';
          else if (locks.some(l => l.status === 'LOCKED')) newStatus = 'LOCKED';
          else newStatus = 'BOOKED';

          const current = await tx.$queryRaw`
               SELECT status FROM seat_inventories
               WHERE "scheduleId" = ${scheduleId} AND "seatId" = ${seatId}
               FOR UPDATE NOWAIT
          `;
          const oldStatus = current[0]?.status;
          if (oldStatus === newStatus) continue;

          if (oldStatus === 'AVAILABLE' && newStatus !== 'AVAILABLE') statusChanges.nowOccupied++;
          if (oldStatus !== 'AVAILABLE' && newStatus === 'AVAILABLE') statusChanges.nowAvailable++;
          if (oldStatus === 'LOCKED' && newStatus === 'BOOKED') statusChanges.lockedToBooked++;
          if (oldStatus === 'BOOKED' && newStatus === 'LOCKED') statusChanges.bookedToLocked++;

          await tx.$executeRaw`
               UPDATE seat_inventories
               SET status = ${newStatus}::"SeatStatus",
                   "lockedBy" = CASE WHEN ${newStatus} = 'AVAILABLE' THEN NULL ELSE "lockedBy" END,
                   "lockedAt" = CASE WHEN ${newStatus} = 'AVAILABLE' THEN NULL ELSE "lockedAt" END,
                   "lockExpiresAt" = CASE WHEN ${newStatus} = 'AVAILABLE' THEN NULL ELSE "lockExpiresAt" END,
                   "bookingId" = CASE WHEN ${newStatus} = 'AVAILABLE' THEN NULL ELSE "bookingId" END,
                   version = version + 1, "updatedAt" = NOW()
               WHERE "scheduleId" = ${scheduleId} AND "seatId" = ${seatId}
          `;
     }
     return statusChanges;
}

async function recountScheduleAggregates(tx, scheduleId) {
     const counts = await tx.$queryRaw`
          SELECT
               COUNT(*) FILTER (WHERE status = 'AVAILABLE')::int AS available,
               COUNT(*) FILTER (WHERE status = 'LOCKED')::int AS locked,
               COUNT(*) FILTER (WHERE status = 'BOOKED')::int AS booked
          FROM seat_inventories
          WHERE "scheduleId" = ${scheduleId}
     `;
     const { available, locked, booked } = counts[0];
     await tx.$executeRaw`
          UPDATE schedule_inventories
          SET available = ${available}, locked = ${locked}, booked = ${booked},
              version = version + 1, "updatedAt" = NOW()
          WHERE "scheduleId" = ${scheduleId}
     `;
     return { available, locked, booked };
}

// ─── REST API Handlers ──────────────────────────────────────────────────────

const getAvailability = async (scheduleId) => {
     const schedule = await prisma.scheduleInventory.findUnique({ where: { scheduleId } });
     if (!schedule) throw new NotFoundError('Schedule not found in inventory');
     return {
          scheduleId: schedule.scheduleId, trainId: schedule.trainId,
          trainNumber: schedule.trainNumber, trainName: schedule.trainName,
          departureDate: schedule.departureDate, status: schedule.status,
          totalSeats: schedule.totalSeats, available: schedule.available,
          locked: schedule.locked, booked: schedule.booked,
     };
};

const getSeats = async (scheduleId, filters = {}) => {
     const schedule = await prisma.scheduleInventory.findUnique({ where: { scheduleId } });
     if (!schedule) throw new NotFoundError('Schedule not found in inventory');

     const where = { scheduleId };
     if (filters.status) where.status = filters.status;
     if (filters.seatType) where.seatType = filters.seatType;

     let seats = await prisma.seatInventory.findMany({
          where, orderBy: { seatNumber: 'asc' },
          select: { seatId: true, seatNumber: true, seatType: true, price: true, status: true, lockedBy: true, lockExpiresAt: true, bookingId: true },
     });

     if (filters.fromSeq && filters.toSeq) {
          const fromSeq = parseInt(filters.fromSeq);
          const toSeq = parseInt(filters.toSeq);

          const overlappingLocks = await prisma.seatSegmentLock.findMany({
               where: { scheduleId, status: { in: ['LOCKED', 'BOOKED'] }, fromSeq: { lt: toSeq }, toSeq: { gt: fromSeq } },
               select: { seatId: true, status: true },
          });
          const blockedSeatIds = new Set(overlappingLocks.map(l => l.seatId));

          const seatsWithAnyLock = await prisma.seatSegmentLock.findMany({
               where: { scheduleId, status: { in: ['LOCKED', 'BOOKED'] } },
               select: { seatId: true }, distinct: ['seatId'],
          });
          const seatsWithLocks = new Set(seatsWithAnyLock.map(l => l.seatId));

          seats = seats.map(seat => {
               if (blockedSeatIds.has(seat.seatId)) return { ...seat, segmentStatus: 'UNAVAILABLE' };
               if ((seat.status === 'BOOKED' || seat.status === 'LOCKED') && !seatsWithLocks.has(seat.seatId)) {
                    return { ...seat, segmentStatus: 'UNAVAILABLE' };
               }
               return { ...seat, segmentStatus: 'AVAILABLE' };
          });
     }

     return { scheduleId, totalSeats: schedule.totalSeats, seats };
};

const lockSeats = async (scheduleId, seatIds, userId, ttlSeconds, fromSeq, toSeq) => {
     const ttl = Math.min(Math.max(ttlSeconds || config.LOCK_TTL_SECONDS, 60), 600);
     const lockExpiresAt = new Date(Date.now() + ttl * 1000);

     const result = await retryTransaction(async () => {
          return prisma.$transaction(async (tx) => {
               const schedule = await tx.scheduleInventory.findUnique({ where: { scheduleId } });
               if (!schedule) throw new NotFoundError('Schedule not found in inventory');
               if (schedule.status !== 'ACTIVE') throw new BadRequestError('Schedule is not active');

               const seats = await tx.$queryRaw`
                    SELECT id, "seatId", "seatNumber", status, "lockedBy"
                    FROM seat_inventories
                    WHERE "scheduleId" = ${scheduleId} AND "seatId" = ANY(${seatIds}::text[])
                    FOR UPDATE NOWAIT
               `;

               if (seats.length !== seatIds.length) {
                    const foundIds = new Set(seats.map(s => s.seatId));
                    const missing = seatIds.filter(id => !foundIds.has(id));
                    throw new NotFoundError(`Seats not found: ${missing.join(', ')}`);
               }

               if (fromSeq && toSeq) {
                    const overlapping = await tx.$queryRaw`
                         SELECT "seatId" FROM seat_segment_locks
                         WHERE "scheduleId" = ${scheduleId} AND "seatId" = ANY(${seatIds}::text[])
                         AND status IN ('LOCKED', 'BOOKED') AND "fromSeq" < ${toSeq} AND "toSeq" > ${fromSeq}
                         FOR UPDATE NOWAIT
                    `;
                    if (overlapping.length > 0) {
                         const blockedIds = [...new Set(overlapping.map(r => r.seatId))];
                         throw new ConflictError(`Seats already locked/booked for overlapping segment: ${blockedIds.join(', ')}`, 'SEATS_UNAVAILABLE');
                    }
                    for (const seat of seats) {
                         await tx.seatSegmentLock.create({
                              data: { scheduleId, seatId: seat.seatId, fromSeq, toSeq, status: 'LOCKED', lockedBy: userId, lockedAt: new Date(), lockExpiresAt },
                         });
                    }
               } else {
                    const unavailable = seats.filter(s => s.status !== 'AVAILABLE');
                    if (unavailable.length > 0) {
                         throw new ConflictError(`Seats not available: ${unavailable.map(s => `seat #${s.seatNumber} is ${s.status}`).join(', ')}`, 'SEATS_UNAVAILABLE');
                    }
               }

               if (fromSeq && toSeq) {
                    const seatPkIds = seats.map(s => s.id);
                    await tx.$executeRaw`
                         UPDATE seat_inventories
                         SET "lockedBy" = COALESCE("lockedBy", ${userId}), "lockedAt" = COALESCE("lockedAt", NOW()),
                             "lockExpiresAt" = ${lockExpiresAt}::timestamp, "updatedAt" = NOW()
                         WHERE id = ANY(${seatPkIds}::text[])
                    `;
                    const affectedSeatIds = seats.map(s => s.seatId);
                    await recomputeSegmentSeatStatuses(tx, scheduleId, affectedSeatIds);
                    const counts = await recountScheduleAggregates(tx, scheduleId);
                    return {
                         scheduleId, trainId: schedule.trainId,
                         lockedSeats: seats.map(s => ({ seatId: s.seatId, seatNumber: s.seatNumber, lockExpiresAt })),
                         lockExpiresAt, counts,
                    };
               }

               const seatPkIds = seats.map(s => s.id);
               await tx.$executeRaw`
                    UPDATE seat_inventories
                    SET status = 'LOCKED', "lockedBy" = ${userId}, "lockedAt" = NOW(),
                        "lockExpiresAt" = ${lockExpiresAt}::timestamp, version = version + 1, "updatedAt" = NOW()
                    WHERE id = ANY(${seatPkIds}::text[])
               `;
               await tx.$executeRaw`
                    UPDATE schedule_inventories
                    SET available = available - ${seats.length}, locked = locked + ${seats.length}, version = version + 1, "updatedAt" = NOW()
                    WHERE "scheduleId" = ${scheduleId}
               `;

               return {
                    scheduleId, trainId: schedule.trainId,
                    lockedSeats: seats.map(s => ({ seatId: s.seatId, seatNumber: s.seatNumber, lockExpiresAt })),
                    lockExpiresAt,
                    counts: { available: schedule.available - seats.length, locked: schedule.locked + seats.length, booked: schedule.booked },
               };
          }, { timeout: 10000 });
     });

     try {
          await inventoryProducer.publishSeatAvailabilityUpdated(result.scheduleId, result.trainId, result.counts.available, result.counts.locked, result.counts.booked);
     } catch (err) {
          logger.error('Failed to publish availability after lock', { scheduleId: result.scheduleId, error: err.message });
     }
     return result;
};

const unlockSeats = async (scheduleId, seatIds, userId, fromSeq, toSeq) => {
     const result = await retryTransaction(async () => {
          return prisma.$transaction(async (tx) => {
               const seats = await tx.$queryRaw`
                    SELECT id, "seatId", "seatNumber", status, "lockedBy"
                    FROM seat_inventories
                    WHERE "scheduleId" = ${scheduleId} AND "seatId" = ANY(${seatIds}::text[])
                    FOR UPDATE NOWAIT
               `;
               if (seats.length !== seatIds.length) throw new NotFoundError('One or more seats not found');

               if (fromSeq && toSeq) {
                    await tx.$executeRaw`
                         DELETE FROM seat_segment_locks
                         WHERE "scheduleId" = ${scheduleId} AND "seatId" = ANY(${seatIds}::text[])
                         AND "lockedBy" = ${userId} AND "fromSeq" = ${fromSeq} AND "toSeq" = ${toSeq} AND status = 'LOCKED'
                    `;
                    const affectedSeatIds = seats.map(s => s.seatId);
                    await recomputeSegmentSeatStatuses(tx, scheduleId, affectedSeatIds);
                    const counts = await recountScheduleAggregates(tx, scheduleId);
                    const schedule = await tx.scheduleInventory.findUnique({ where: { scheduleId } });
                    return { scheduleId, trainId: schedule.trainId, unlockedSeats: seats.map(s => s.seatId), counts };
               }

               const notLocked = seats.filter(s => s.status !== 'LOCKED');
               if (notLocked.length > 0) throw new ConflictError(`Seats not in LOCKED status: ${notLocked.map(s => `seat #${s.seatNumber} is ${s.status}`).join(', ')}`);

               const notOwnedByUser = seats.filter(s => s.lockedBy !== userId);
               if (notOwnedByUser.length > 0) throw new ForbiddenError('Some seats are not locked by you');

               const seatPkIds = seats.map(s => s.id);
               await tx.$executeRaw`
                    UPDATE seat_inventories
                    SET status = 'AVAILABLE', "lockedBy" = NULL, "lockedAt" = NULL, "lockExpiresAt" = NULL, version = version + 1, "updatedAt" = NOW()
                    WHERE id = ANY(${seatPkIds}::text[])
               `;
               const schedule = await tx.scheduleInventory.findUnique({ where: { scheduleId } });
               await tx.$executeRaw`
                    UPDATE schedule_inventories
                    SET available = available + ${seats.length}, locked = locked - ${seats.length}, version = version + 1, "updatedAt" = NOW()
                    WHERE "scheduleId" = ${scheduleId}
               `;
               return {
                    scheduleId, trainId: schedule.trainId, unlockedSeats: seats.map(s => s.seatId),
                    counts: { available: schedule.available + seats.length, locked: schedule.locked - seats.length, booked: schedule.booked },
               };
          }, { timeout: 10000 });
     });

     try {
          await inventoryProducer.publishSeatAvailabilityUpdated(result.scheduleId, result.trainId, result.counts.available, result.counts.locked, result.counts.booked);
     } catch (err) {
          logger.error('Failed to publish availability after unlock', { scheduleId: result.scheduleId, error: err.message });
     }
     return result;
};

const confirmSeats = async (scheduleId, seatIds, userId, bookingId, fromSeq, toSeq) => {
     const result = await retryTransaction(async () => {
          return prisma.$transaction(async (tx) => {
               const seats = await tx.$queryRaw`
                    SELECT id, "seatId", "seatNumber", status, "lockedBy"
                    FROM seat_inventories
                    WHERE "scheduleId" = ${scheduleId} AND "seatId" = ANY(${seatIds}::text[])
                    FOR UPDATE NOWAIT
               `;
               if (seats.length !== seatIds.length) throw new NotFoundError('One or more seats not found');

               if (fromSeq && toSeq) {
                    const updated = await tx.$executeRaw`
                         UPDATE seat_segment_locks
                         SET status = 'BOOKED', "bookingId" = ${bookingId}, "lockExpiresAt" = NULL, version = version + 1, "updatedAt" = NOW()
                         WHERE "scheduleId" = ${scheduleId} AND "seatId" = ANY(${seatIds}::text[])
                         AND "lockedBy" = ${userId} AND "fromSeq" = ${fromSeq} AND "toSeq" = ${toSeq} AND status = 'LOCKED'
                    `;
                    if (updated === 0) throw new ConflictError('Segment lock expired or not found. Please lock seats again.', 'LOCK_EXPIRED');
               } else {
                    const notLocked = seats.filter(s => s.status !== 'LOCKED');
                    if (notLocked.length > 0) throw new ConflictError('Lock expired or seats not in LOCKED status. Please lock seats again.', 'LOCK_EXPIRED');
                    const notOwnedByUser = seats.filter(s => s.lockedBy !== userId);
                    if (notOwnedByUser.length > 0) throw new ForbiddenError('Some seats are not locked by you');
               }

               if (fromSeq && toSeq) {
                    const affectedSeatIds = seats.map(s => s.seatId);
                    await recomputeSegmentSeatStatuses(tx, scheduleId, affectedSeatIds);
                    const counts = await recountScheduleAggregates(tx, scheduleId);
                    const schedule = await tx.scheduleInventory.findUnique({ where: { scheduleId } });
                    return {
                         scheduleId, trainId: schedule.trainId, bookingId,
                         confirmedSeats: seats.map(s => ({ seatId: s.seatId, seatNumber: s.seatNumber, status: 'BOOKED' })),
                         counts,
                    };
               }

               const seatPkIds = seats.map(s => s.id);
               await tx.$executeRaw`
                    UPDATE seat_inventories
                    SET status = 'BOOKED', "bookingId" = ${bookingId}, "lockExpiresAt" = NULL, version = version + 1, "updatedAt" = NOW()
                    WHERE id = ANY(${seatPkIds}::text[])
               `;
               const schedule = await tx.scheduleInventory.findUnique({ where: { scheduleId } });
               await tx.$executeRaw`
                    UPDATE schedule_inventories
                    SET locked = locked - ${seats.length}, booked = booked + ${seats.length}, version = version + 1, "updatedAt" = NOW()
                    WHERE "scheduleId" = ${scheduleId}
               `;
               return {
                    scheduleId, trainId: schedule.trainId, bookingId,
                    confirmedSeats: seats.map(s => ({ seatId: s.seatId, seatNumber: s.seatNumber, status: 'BOOKED' })),
                    counts: { available: schedule.available, locked: schedule.locked - seats.length, booked: schedule.booked + seats.length },
               };
          }, { timeout: 10000 });
     });

     try {
          await inventoryProducer.publishSeatAvailabilityUpdated(result.scheduleId, result.trainId, result.counts.available, result.counts.locked, result.counts.booked);
     } catch (err) {
          logger.error('Failed to publish availability after confirm', { scheduleId: result.scheduleId, error: err.message });
     }
     return result;
};

const cancelBooking = async (scheduleId, bookingId, userId) => {
     const result = await retryTransaction(async () => {
          return prisma.$transaction(async (tx) => {
               const segmentLocks = await tx.seatSegmentLock.findMany({ where: { scheduleId, bookingId, status: 'BOOKED' } });

               if (segmentLocks.length > 0) {
                    await tx.$executeRaw`DELETE FROM seat_segment_locks WHERE "scheduleId" = ${scheduleId} AND "bookingId" = ${bookingId}`;
                    const affectedSeatIds = [...new Set(segmentLocks.map(l => l.seatId))];
                    await recomputeSegmentSeatStatuses(tx, scheduleId, affectedSeatIds);
                    const counts = await recountScheduleAggregates(tx, scheduleId);
                    const schedule = await tx.scheduleInventory.findUnique({ where: { scheduleId } });
                    return { scheduleId, trainId: schedule.trainId, bookingId, releasedSeats: affectedSeatIds, counts };
               }

               const seats = await tx.$queryRaw`
                    SELECT id, "seatId", "seatNumber", status, "lockedBy"
                    FROM seat_inventories
                    WHERE "scheduleId" = ${scheduleId} AND "bookingId" = ${bookingId} AND status = 'BOOKED'
                    FOR UPDATE NOWAIT
               `;
               if (seats.length === 0) throw new NotFoundError('No booked seats found for this booking');

               const seatPkIds = seats.map(s => s.id);
               await tx.$executeRaw`
                    UPDATE seat_inventories
                    SET status = 'AVAILABLE', "lockedBy" = NULL, "lockedAt" = NULL, "lockExpiresAt" = NULL, "bookingId" = NULL, version = version + 1, "updatedAt" = NOW()
                    WHERE id = ANY(${seatPkIds}::text[])
               `;
               const schedule = await tx.scheduleInventory.findUnique({ where: { scheduleId } });
               await tx.$executeRaw`
                    UPDATE schedule_inventories
                    SET available = available + ${seats.length}, booked = booked - ${seats.length}, version = version + 1, "updatedAt" = NOW()
                    WHERE "scheduleId" = ${scheduleId}
               `;
               return {
                    scheduleId, trainId: schedule.trainId, bookingId, releasedSeats: seats.map(s => s.seatId),
                    counts: { available: schedule.available + seats.length, locked: schedule.locked, booked: schedule.booked - seats.length },
               };
          }, { timeout: 10000 });
     });

     try {
          await inventoryProducer.publishSeatAvailabilityUpdated(result.scheduleId, result.trainId, result.counts.available, result.counts.locked, result.counts.booked);
     } catch (err) {
          logger.error('Failed to publish availability after cancel-booking', { scheduleId: result.scheduleId, error: err.message });
     }
     return result;
};

const recountAndPublish = async (scheduleId) => {
     const counts = await prisma.$queryRaw`
          SELECT COUNT(*) FILTER (WHERE status = 'AVAILABLE')::int AS available,
                 COUNT(*) FILTER (WHERE status = 'LOCKED')::int AS locked,
                 COUNT(*) FILTER (WHERE status = 'BOOKED')::int AS booked
          FROM seat_inventories WHERE "scheduleId" = ${scheduleId}
     `;
     const { available, locked, booked } = counts[0];
     const schedule = await prisma.scheduleInventory.update({
          where: { scheduleId },
          data: { available, locked, booked, version: { increment: 1 } },
     });
     try {
          await inventoryProducer.publishSeatAvailabilityUpdated(scheduleId, schedule.trainId, available, locked, booked);
     } catch (err) {
          logger.error('Failed to publish availability after recount', { scheduleId, error: err.message });
     }
     return { available, locked, booked };
};

module.exports = {
     initializeInventory, cancelScheduleInventory,
     getAvailability, getSeats, lockSeats, unlockSeats, confirmSeats, cancelBooking,
     recountAndPublish, recomputeSegmentSeatStatuses,
};