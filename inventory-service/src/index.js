require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const logger = require('./config/logger');
const { config } = require('./config');

const inventoryRoutes = require('./routes/inventory.route');
const { corsMiddleware } = require('./middlewares/cors.middleware');
const errorHandler = require('./middlewares/error.middleware');
const { reqLogger } = require('./middlewares/req.middleware');
const inventoryConsumer = require('./kafka/consumer/inventory.consumer');
const { disconnectAll } = require('./config/kafka');
const { startLockExpiryJob } = require('./utils/lockExpiry');

const app = express();
app.use(corsMiddleware);
app.use(helmet({ crossOriginOpenerPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(reqLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (req, res) => {
     res.status(200).json({ success: true, message: 'Inventory Service is healthy', timestamp: new Date().toISOString() });
});

app.use('/', inventoryRoutes);
app.use(errorHandler);

async function start() {
     try {
          await inventoryConsumer.start();

          const server = app.listen(config.PORT, () => {
               logger.info(`${config.SERVICE_NAME} is running on port ${config.PORT}`);
          });

          const lockExpiryIntervalId = startLockExpiryJob();

          const shutdown = async () => {
               logger.info('Shutting down gracefully...');
               clearInterval(lockExpiryIntervalId);
               server.close(async () => {
                    await disconnectAll();
                    process.exit(0);
               });
          };
          process.on('SIGTERM', shutdown);
          process.on('SIGINT', shutdown);
     } catch (error) {
          logger.error('Failed to start Inventory Service', { error: error.message });
          process.exit(1);
     }
}

start();