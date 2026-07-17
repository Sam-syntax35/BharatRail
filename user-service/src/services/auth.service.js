const { ConflictError, BadRequestError, ForbiddenError, UnauthorizedError } = require("../utils/error");
const { generateAndStoreOtp, verifyOtp } = require('../utils/otp');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/auth');
const notificationProducer = require('../kafka/producer/notification.producer');
const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const { redis } = require('../config/redis');
const { config } = require("../config");
const logger = require('../config/logger');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);


const sendOTP = async (firstName, lastName, email, password) => {
     const existingUser = await prisma.user.findUnique({ where: { email } });
     if (existingUser) {
          throw new ConflictError("user already exists");
     }
     const hashedPassword = await bcrypt.hash(password, 12);
     const meta = { firstName, lastName, email, hashedPassword };
     const { otp, otpSessionId } = await generateAndStoreOtp(meta);
     await notificationProducer.sendOtpEmail(email, otp, (config.OTP_TTL) / 60);
     logger.info(`OTP email queued for : ${email}`);
     return { otpSessionId };
};

const verifyOTP = async (otp, otpSessionId) => {
     const meta = await verifyOtp(otp, otpSessionId);
     if (meta === null) {
          throw new BadRequestError("Invalid or expired OTP", "OTP_INVALID");
     }
     const user = await prisma.user.create({
          data: {
               firstName: meta.firstName,
               lastName: meta.lastName,
               email: meta.email,
               password: meta.hashedPassword,
               emailVerified: true
          }
     });
     await notificationProducer.sendWelcomeEmail(meta.email, meta.firstName);
     logger.info(`Welcome email queued for ${meta.email}`);
     return user;
};

const login = async (email, password, deviceId) => {
     const existingUser = await prisma.user.findUnique({ where: { email } });
     if (!existingUser) {
          throw new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS");
     }
     if (!existingUser.password) {
          throw new BadRequestError(
               "This account was created with Google. Please sign in with Google.",
               "OAUTH_ONLY_ACCOUNT"
          );
     }
     const doesPasswordMatch = await bcrypt.compare(password, existingUser.password);
     if (!doesPasswordMatch) {
          throw new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS");
     }
     const accessToken = generateAccessToken(existingUser.id, existingUser.role);
     const refreshToken = generateRefreshToken(existingUser.id);
     const { jti } = jwt.decode(refreshToken);
     await redis.set(`refresh:${existingUser.id}:${deviceId}`, jti, 'EX', config.REFRESH_TOKEN_EXP_SEC);
     const { password: _password, ...safeUser } = existingUser;
     await redis.set(`user:${existingUser.id}`, JSON.stringify(safeUser), 'EX', config.REDIS_USER_TTL);
     return { accessToken, refreshToken, loggedInUser: safeUser };
};

const rotateRefreshToken = async (refreshToken, deviceId) => {
     let payload;
     try {
          payload = verifyRefreshToken(refreshToken);
     } catch (err) {
          throw new UnauthorizedError('Invalid or expired refresh token', 'LOGIN_AGAIN');
     }

     const { id: userId, jti } = payload;

     const storedJti = await redis.get(`refresh:${userId}:${deviceId}`);
     if (!storedJti) {
          throw new ForbiddenError("Session Expired", "Login AGAIN");
     }

     if (storedJti !== jti) {
          // Check if the requested JTI was rotated within the 10-second grace window
          const inGrace = await redis.get(`refresh_grace:${userId}:${deviceId}:${jti}`);
          if (inGrace) {
               logger.info(`Allowing concurrent refresh token rotation for user ${userId} within grace period`);
          } else {
               await redis.del(`refresh:${userId}:${deviceId}`);
               throw new ForbiddenError("Refresh token reused", "LOGIN AGAIN");
          }
     }

     const currentUser = await prisma.user.findUnique({ where: { id: userId } });
     if (!currentUser) {
          throw new UnauthorizedError('User no longer exists', 'LOGIN_AGAIN');
     }

     const newAccessToken = generateAccessToken(currentUser.id, currentUser.role);
     const newRefreshToken = generateRefreshToken(currentUser.id);
     const { jti: newJti } = jwt.decode(newRefreshToken);

     // Set the new active refresh token JTI
     await redis.set(`refresh:${currentUser.id}:${deviceId}`, newJti, 'EX', config.REFRESH_TOKEN_EXP_SEC);
     // Store the rotated JTI in the grace period list for 10 seconds to allow concurrent requests to succeed
     await redis.set(`refresh_grace:${currentUser.id}:${deviceId}:${jti}`, '1', 'EX', 10);

     return { newAccessToken, newRefreshToken };
};




const verifyGoogleIdToken = async (idToken, deviceId) => {
     const ticket = await client.verifyIdToken({
          idToken,
          audience: config.GOOGLE_CLIENT_ID
     });
     const payload = ticket.getPayload();

     if (!payload.sub || !payload.email) {
          throw new UnauthorizedError("Invalid Google Token Payload");
     }

     const googleUser = {
          provider: "google",
          providerId: payload.sub,
          email: payload.email,
          firstName: payload.given_name,
          lastName: payload.family_name,
          emailVerified: payload.email_verified || false
     };

     const user = await prisma.$transaction(async (tx) => {
          let googleAuth = await tx.authProvider.findUnique({
               where: {
                    provider_providerId: {
                         provider: googleUser.provider,
                         providerId: googleUser.providerId
                    }
               },
               include: { user: true }
          });

          if (googleAuth) {
               return googleAuth.user;
          }

          let existingUser = await tx.user.findUnique({ where: { email: googleUser.email } });

          if (existingUser) {
               await tx.authProvider.create({
                    data: {
                         provider: googleUser.provider,
                         providerId: googleUser.providerId,
                         userId: existingUser.id
                    }
               });
               return existingUser;
          }

          return await tx.user.create({
               data: {
                    email: googleUser.email,
                    firstName: googleUser.firstName,
                    lastName: googleUser.lastName,
                    emailVerified: googleUser.emailVerified,
                    AuthProviders: {
                         create: {
                              provider: googleUser.provider,
                              providerId: googleUser.providerId
                         }
                    }
               }
          });
     });

     const accessToken = generateAccessToken(user.id, user.role);
     const refreshToken = generateRefreshToken(user.id);
     const { jti } = jwt.decode(refreshToken);
     await redis.set(`refresh:${user.id}:${deviceId}`, jti, 'EX', config.REFRESH_TOKEN_EXP_SEC);
     const { password: _password, ...safeUser } = user;
     await redis.set(`user:${user.id}`, JSON.stringify(safeUser), 'EX', config.REDIS_USER_TTL);
     return { accessToken, refreshToken, loggedInUser: safeUser };
};

module.exports = { sendOTP, verifyOTP, login, rotateRefreshToken, verifyGoogleIdToken };