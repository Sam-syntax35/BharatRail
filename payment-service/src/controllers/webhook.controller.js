const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/payment.service');
const logger = require('../config/logger');

exports.razorpayWebhook = asyncHandler(async (req, res) => {
     const signature = req.headers['x-razorpay-signature'];
     if (!signature) {
          logger.warn('Webhook received without signature header');
          return res.status(400).json({ status: 'error', message: 'Missing signature' });
     }

     const rawBody = req.body;
     const result = await paymentService.handleWebhook(rawBody, signature);

     logger.info('Webhook processed', { result });
     res.status(200).json({ status: 'ok', ...result });
});