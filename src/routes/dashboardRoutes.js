import express from 'express';
import {
  getCustomerDashboard,
  getDeliveryDashboard,
  getAdminDashboard,
  updateDeliveryStatus
} from '../controllers/dashboardController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ===============================
// CUSTOMER DASHBOARD
// ===============================
router.get('/customer', authMiddleware, roleMiddleware(['customer']), getCustomerDashboard);

// ===============================
// DELIVERY PERSONNEL DASHBOARD
// ===============================
router.get('/delivery', authMiddleware, roleMiddleware(['delivery']), getDeliveryDashboard);

// ===============================
// ADMIN DASHBOARD
// ===============================
router.get('/admin', authMiddleware, roleMiddleware(['admin']), getAdminDashboard);

// ===============================
// UPDATE DELIVERY STATUS
// ===============================
router.put('/delivery/:deliveryId/status', authMiddleware, roleMiddleware(['delivery']), updateDeliveryStatus);

export default router;
