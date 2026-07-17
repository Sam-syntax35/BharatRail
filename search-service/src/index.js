require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const logger = require('./config/logger');
const { config } = require('./config');
const { initIndices, recreateIndices, esClient } = require('./config/elasticsearch');

const searchRoutes = require('./routes/search.route');
const { corsMiddleware } = require('./middlewares/cors.middleware');
const errorHandler = require('./middlewares/error.middleware');
const { reqLogger } = require('./middlewares/req.middleware');
const searchConsumer = require('./kafka/consumer/search.consumer');
const { disconnectAll } = require('./config/kafka');

const app = express();
app.use(corsMiddleware);
app.use(helmet({ crossOriginOpenerPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(reqLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (req, res) => {
     res.status(200).json({ success: true, message: 'Search Service is healthy', timestamp: new Date().toISOString() });
});

app.use('/', searchRoutes);
app.use(errorHandler);

async function start() {
     try {
          const health = await esClient.cluster.health();
          logger.info(`Connected to Elasticsearch, cluster status: ${health.status}`);

          if (config.ES_RECREATE_INDICES) {
               await recreateIndices();
          } else {
               await initIndices();
          }

          await searchConsumer.start();

          const server = app.listen(config.PORT, () => {
               logger.info(`${config.SERVICE_NAME} is running on port ${config.PORT}`);
          });

          const shutdown = async () => {
               logger.info('Shutting down gracefully...');
               server.close(async () => {
                    await disconnectAll();
                    process.exit(0);
               });
          };
          process.on('SIGTERM', shutdown);
          process.on('SIGINT', shutdown);
     } catch (error) {
          console.error('FULL ERROR:', error);
          logger.error('Failed to start Search Service', { error: error.message });
          process.exit(1);
     }
}

start();