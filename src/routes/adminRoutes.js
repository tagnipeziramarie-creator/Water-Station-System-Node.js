import express from 'express';
import {
  getAdminDashboard,
  getReports,
  listAdminOrders,
  cancelAdminOrder,
} from '../controllers/adminController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/dashboard', getAdminDashboard);
router.get('/reports', getReports);
router.get('/orders', listAdminOrders);
router.patch('/orders/:orderId/cancel', cancelAdminOrder);

export default router;
