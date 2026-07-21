const { Kafka, logLevel } = require('kafkajs');
const logger = require('./logger');
const { config } = require('.');


console.log("Broker:", config.KAFKA_BROKER);
console.log("SSL:", config.KAFKA_SSL);
console.log("Username:", config.KAFKA_USERNAME);
console.log("Password Length:", config.KAFKA_PASSWORD?.length);

const kafka = new Kafka({

     clientId: config.KAFKA_CLIENT_ID,
     brokers: [config.KAFKA_BROKER],

     ssl: config.KAFKA_SSL === "true",

     sasl: {
          mechanism: "scram-sha-256",
          username: config.KAFKA_USERNAME,
          password: config.KAFKA_PASSWORD,
     },

     logLevel: logLevel.ERROR,

     retry: {
          initialRetryTime: 300,
          retries: 8,
          maxRetryTime: 30000,
     },
});

const producer = kafka.producer({
     allowAutoTopicCreation: true,
     transactionTimeout: 30000,
     idempotent: true,
     maxInFlightRequests: 5,
     retry: {
          retries: 5,
     },
});

let isConnected = false;

const connectProducer = async () => {
     if (!isConnected) {
          await producer.connect();
          isConnected = true;
          logger.info('Kafka producer connected');
     }
};

const disconnectProducer = async () => {
     if (isConnected) {
          await producer.disconnect();
          isConnected = false;
          logger.info('Kafka producer disconnected');
     }
};

module.exports = { kafka, producer, connectProducer, disconnectProducer };