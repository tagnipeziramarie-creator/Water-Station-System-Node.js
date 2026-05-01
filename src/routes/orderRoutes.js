import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
} from '../controllers/orderController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateOrder } from '../middleware/validation.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', validateOrder, createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);

export default router;
