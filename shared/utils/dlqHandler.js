const { DLQ_MAX_RETRIES } = require('../constants/kafka-topics');

// Tracks in-memory retry attempts per message, keyed by topic:partition:offset
const retryCounters = new Map();

/**
 * Wraps a Kafka message handler with retry + Dead-Letter-Queue logic.
 * Returns a function matching KafkaJS's `eachMessage` signature.
 */
function withDLQ(producer, dlqTopic, logger, handler) {
     return async ({ topic, partition, message }) => {
          const msgKey = `${topic}:${partition}:${message.offset}`;

          let parsedValue;
          try {
               parsedValue = JSON.parse(message.value.toString());
          } catch (err) {
               // Unparseable JSON — no point retrying, straight to DLQ
               logger.error(`Failed to parse message from ${topic}, sending to DLQ`, {
                    msgKey, error: err.message
               });
               await producer.send({
                    topic: dlqTopic,
                    messages: [{
                         key: message.key,
                         value: message.value,
                         headers: {
                              'dlq-original-topic': topic,
                              'dlq-error': `JSON parse failure: ${err.message}`,
                         }
                    }]
               });
               return;
          }

          try {
               await handler({ topic, partition, message, parsedValue });
               retryCounters.delete(msgKey); // success — clear any prior retry count
          } catch (err) {
               const attempts = (retryCounters.get(msgKey) || 0) + 1;
               retryCounters.set(msgKey, attempts);

               if (attempts < DLQ_MAX_RETRIES) {
                    logger.warn(`Handler failed for ${topic} (attempt ${attempts}/${DLQ_MAX_RETRIES}), will retry`, {
                         msgKey, error: err.message
                    });
                    throw err; // re-throw so KafkaJS redelivers this message
               }

               logger.error(`Handler failed ${attempts} times for ${topic}, sending to DLQ`, {
                    msgKey, error: err.message
               });
               retryCounters.delete(msgKey);
               await producer.send({
                    topic: dlqTopic,
                    messages: [{
                         key: message.key,
                         value: message.value,
                         headers: {
                              'dlq-original-topic': topic,
                              'dlq-error': err.message,
                         }
                    }]
               });
          }
     };
}

module.exports = { withDLQ };