require('dotenv').config();
const crypto = require('crypto');
const http = require('http');

const gatewayOrderId = 'order_TDkvvryG8mEzmZ';  // e.g. order_ABC123xyz
const fakePaymentId = 'pay_test_' + Date.now();

const payload = {
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        id: fakePaymentId,
        order_id: gatewayOrderId,
        status: 'captured',
       amount: 150000, // in paise, adjust to match your order
      }
    }
  }
};

const rawBody = JSON.stringify(payload);
const signature = crypto
  .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex');

const req = http.request({
  hostname: 'localhost',
  port: process.env.PORT || 4006,
  path: '/webhooks/razorpay',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(rawBody),
    'x-razorpay-signature': signature,
  },
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, '\nResponse:', data));
});

req.write(rawBody);
req.end();