require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const logger = require('./config/logger');
const { config } = require('./config');
const cookieParser = require('cookie-parser');

const stationRoutes = require('./routes/station.route');

const { corsMiddleware } = require('./middlewares/cors.middleware');
const errorHandler = require('./middlewares/error.middleware');
const { reqLogger } = require('./middlewares/req.middleware');
const {
     connectProducer,
     disconnectProducer,
} = require('./config/kafka');
const trainRoutes = require('./routes/train.route');
const scheduleRoutes = require('./routes/schedule.route');

const app = express();

app.use(corsMiddleware);
app.use(helmet({
     crossOriginOpenerPolicy: false,
     crossOriginEmbedderPolicy: false
}));
app.use(reqLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
     res.send("Hello from index.js of admin-service");
});

app.get('/health', (req, res) => {
     res.status(200).json({
          success: true,
          message: 'Admin Service is healthy',
          timestamp: new Date().toISOString()
     });
});

app.use("/stations", stationRoutes);
app.use("/trains", trainRoutes);
app.use("/schedules", scheduleRoutes);
app.use(errorHandler);

const startServer = async () => {
     try {
          await connectProducer();
          const server = app.listen(config.PORT, () => {
               logger.info(`${config.SERVICE_NAME} is running on port ${config.PORT}`);
          });

          const shutdown = async () => {
               logger.info('Shutting down gracefully...');
               server.close(async () => {
                    await disconnectProducer();
                    logger.info('Server closed');
                    process.exit(0);
               });
          };

          process.on('SIGTERM', shutdown);
          process.on('SIGINT', shutdown);
     } catch (error) {
          logger.error('Failed to start server', error);
          process.exit(1);
     }
};

startServer();

module.exports = app;