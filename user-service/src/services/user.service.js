const { config } = require("../config");
const { redis } = require("../config/redis");
const prisma = require('../config/prisma');
const logger = require('../config/logger');

const getProfile = async (userId) => {
     logger.info("First check user in Redis");

     const storedUser = await redis.get(`user:${userId}`);
     if (storedUser) {
          logger.info("Fetched user profile from redis");
          return JSON.parse(storedUser);
     }
     logger.info("If user is not in redis, fetch user from DB");
     const userProfile = await prisma.user.findUnique({ where: { id: userId } });
     if (!userProfile) return null;

     logger.info("Exclude password field from the user");
     const { password: _password, ...safeUser } = userProfile;
     logger.info("Store user profile in redis for future lookups");
     await redis.set(`user:${userId}`, JSON.stringify(safeUser), 'EX', config.REDIS_USER_TTL);
     return safeUser;
};

const updateProfile = async (userId, updates) => {
     const allowedFields = ['firstName', 'lastName'];
     const data = {};
     for (const field of allowedFields) {
          if (updates[field] !== undefined) data[field] = updates[field];
     }

     if (Object.keys(data).length === 0) {
          return null; // signal "nothing to update" to the controller
     }

     const updatedUser = await prisma.user.update({ where: { id: userId }, data });
     const { password: _password, ...safeUser } = updatedUser;

     // Invalidate + refresh the Redis cache so stale data isn't served
     await redis.set(`user:${userId}`, JSON.stringify(safeUser), 'EX', config.REDIS_USER_TTL);
     logger.info(`Profile updated for user ${userId}`);

     return safeUser;
};

const deleteProfile = async (userId) => {
     await prisma.user.delete({ where: { id: userId } });
     await redis.del(`user:${userId}`);
     logger.info(`User ${userId} deleted`);
};

module.exports = { getProfile, updateProfile, deleteProfile };