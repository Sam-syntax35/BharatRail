require('dotenv').config();
const express = require('express');
const emailConsumer = require('./kafka/consumer/email.consumer');
const logger = require('./config/logger');

async function startNotificationService() {
     try {
          logger.info('Starting Notification Service...');

          const requiredEnvVars = ['SENDGRID_API_KEY', 'MAIL_SEND', 'KAFKA_BROKER'];
          const missing = requiredEnvVars.filter(varName => !process.env[varName]);
          if (missing.length > 0) {
               throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
          }

          await emailConsumer.start();

          // Express health check server
          const app = express();
          const PORT = process.env.PORT || 4004;
          const HOST = process.env.HOST || '0.0.0.0';

          app.get('/health', (req, res) => {
               res.status(200).json({
                    success: true,
                    message: 'Notification Service is healthy',
                    timestamp: new Date().toISOString()
               });
          });

          app.listen(PORT, HOST, () => {
               logger.info(`✅ Health check server listening on http://${HOST}:${PORT}`);
          });

          logger.info('✅ Notification Service started successfully');
          logger.info('Service is ready to process notifications');
     } catch (error) {
          logger.error('Failed to start Notification Service', {
               error: error.message,
               stack: error.stack
          });
          process.exit(1);
     }
}

process.on('unhandledRejection', (reason, promise) => {
     logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
     logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
     process.exit(1);
});

startNotificationService();