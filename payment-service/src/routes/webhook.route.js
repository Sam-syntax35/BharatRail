const express = require('express');
const { razorpayWebhook } = require('../controllers/webhook.controller');

const router = express.Router();

router.post('/webhooks/razorpay', express.raw({ type: 'application/json' }), razorpayWebhook);

module.exports = router;