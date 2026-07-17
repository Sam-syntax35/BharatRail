const { config } = require('../../config');
const RazorpayGateway = require('./razorpay.gateway');

let gatewayInstance = null;

function getGateway() {
     if (gatewayInstance) return gatewayInstance;

     const provider = config.PAYMENT_GATEWAY;

     switch (provider) {
          case 'razorpay':
               gatewayInstance = new RazorpayGateway(config.RAZORPAY_KEY_ID, config.RAZORPAY_KEY_SECRET, config.RAZORPAY_WEBHOOK_SECRET);
               break;
          default:
               throw new Error(`Unknown payment gateway provider: ${provider}`);
     }

     return gatewayInstance;
}

module.exports = { getGateway };