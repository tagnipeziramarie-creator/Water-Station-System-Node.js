import axios from 'axios';

export class PaymongoService {
  constructor(secretKey = process.env.PAYMONGO_SECRET_KEY) {
    this.secretKey = secretKey;
    this.baseURL = process.env.PAYMONGO_API_URL || 'https://api.paymongo.com/v1';

    if (!this.secretKey) {
      throw new Error('PayMongo secret key is not configured');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      auth: {
        username: this.secretKey,
        password: '',
      },
    });
  }

  async createCheckout(payload) {
    try {
      const response = await this.client.post('/checkout_sessions', {
        data: {
          attributes: payload,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`PayMongo checkout creation failed: ${error.message}`);
    }
  }

  async retrieveCheckout(checkoutId) {
    try {
      const response = await this.client.get(`/checkout_sessions/${checkoutId}`);
      return response.data;
    } catch (error) {
      throw new Error(`PayMongo checkout retrieval failed: ${error.message}`);
    }
  }

  async retrievePayment(paymentId) {
    try {
      const response = await this.client.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw new Error(`PayMongo payment retrieval failed: ${error.message}`);
    }
  }

  verifyWebhookSignature(payload, signature) {
    // Implementation for PayMongo webhook signature verification
    // This is a placeholder - implement actual HMAC verification
    return true;
  }
}

export default PaymongoService;
