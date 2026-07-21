const config = {
  SERVICE_NAME: require('../../package.json').name,
  PORT: Number(process.env.PORT) || 4001,
  NODE_ENV: process.env.NODE_ENV || "development",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,

  OTP_TTL: process.env.OTP_TTL || 300,
  OTP_RATE_MAX_PER_HOUR: process.env.OTP_RATE_MAX_PER_HOUR || 5,
  OTP_MAX_VERIFY_ATTEMPTS: process.env.OTP_MAX_VERIFY_ATTEMPTS || 5,
  OTP_HMAC_SECRET: process.env.OTP_HMAC_SECRET,


  KAFKA_BROKER: process.env.KAFKA_BROKER,
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID,

  KAFKA_USERNAME: process.env.KAFKA_USERNAME,
  KAFKA_PASSWORD: process.env.KAFKA_PASSWORD,
  KAFKA_SSL: process.env.KAFKA_SSL,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXP: process.env.ACCESS_TOKEN_EXP || '15m',
  REFRESH_TOKEN_EXP: process.env.REFRESH_TOKEN_EXP || '7d',
  ACCESS_TOKEN_EXP_SEC: parseInt(process.env.ACCESS_TOKEN_EXP_SEC || '900', 10),
  REFRESH_TOKEN_EXP_SEC: parseInt(process.env.REFRESH_TOKEN_EXP_SEC || '604800', 10),
  REDIS_USER_TTL: parseInt(process.env.REDIS_USER_TTL || '86400', 10),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  INTERNAL_SERVICE_KEY: process.env.INTERNAL_SERVICE_KEY,
};

module.exports = { config };