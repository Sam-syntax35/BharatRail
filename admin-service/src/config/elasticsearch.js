const { Client } = require('@elastic/elasticsearch');
const { config } = require('.');

const esClient = new Client({
    node: config.ELASTICSEARCH_URL,
    auth: {
        apiKey: config.ELASTICSEARCH_API_KEY,
    },
});

module.exports = { esClient };