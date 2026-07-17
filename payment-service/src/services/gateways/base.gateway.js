class BaseGateway {
     constructor(providerName) {
          if (new.target === BaseGateway) {
               throw new Error('BaseGateway is abstract and cannot be instantiated directly');
          }
          this.providerName = providerName;
     }

     async createOrder(amount, currency, receipt, notes = {}) {
          throw new Error('createOrder() must be implemented by gateway');
     }

     verifyPaymentSignature(orderId, paymentId, signature) {
          throw new Error('verifyPaymentSignature() must be implemented by gateway');
     }

     verifyWebhookSignature(rawBody, signature) {
          throw new Error('verifyWebhookSignature() must be implemented by gateway');
     }

     async fetchPayment(paymentId) {
          throw new Error('fetchPayment() must be implemented by gateway');
     }

     async initiateRefund(paymentId, amount, notes = {}) {
          throw new Error('initiateRefund() must be implemented by gateway');
     }

     async fetchRefund(paymentId, refundId) {
          throw new Error('fetchRefund() must be implemented by gateway');
     }
}

module.exports = BaseGateway;