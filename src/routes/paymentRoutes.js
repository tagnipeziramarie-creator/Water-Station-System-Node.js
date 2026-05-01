import express from 'express';
import {
  getPaymentStatus,
  createCheckout,
  confirmPayment,
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/:orderId/status', authMiddleware, getPaymentStatus);
router.post('/checkout', authMiddleware, createCheckout);
router.post('/:orderId/confirm', authMiddleware, confirmPayment);

export default router;
