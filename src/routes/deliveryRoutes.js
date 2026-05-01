import express from 'express';
import {
  getDashboard,
  getHistory,
  updateStatus,
  markPaymentReceived,
  assignPersonnel,
} from '../controllers/deliveryController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(['delivery', 'admin']));

router.get('/dashboard', getDashboard);
router.get('/history', getHistory);
router.patch('/update/:id', updateStatus);
router.patch('/payment/:id', markPaymentReceived);
router.patch('/assign/:id', roleMiddleware(['admin']), assignPersonnel);

export default router;
