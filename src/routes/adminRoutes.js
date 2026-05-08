import express from 'express';

import {
  getAdminDashboard,
  getReports,
  listAdminOrders,
  cancelAdminOrder,
  updateInventory
} from '../controllers/adminController.js';

import {
  authMiddleware,
  roleMiddleware
} from '../middleware/auth.js';

const router = express.Router();

/* =========================================================
   ADMIN AUTHENTICATION & ROLE PROTECTION
========================================================= */

/* Protect all admin routes */
router.use(authMiddleware);

/* Allow admin users only */
router.use(roleMiddleware(['admin']));

/* =========================================================
   ADMIN DASHBOARD ROUTES
========================================================= */

/* Dashboard Summary */
router.get(
  '/dashboard',
  getAdminDashboard
);

/* Reports */
router.get(
  '/reports',
  getReports
);

/* View Orders */
router.get(
  '/orders',
  listAdminOrders
);

/* Cancel Order */
router.patch(
  '/orders/:orderId/cancel',
  cancelAdminOrder
);

/* =========================================================
   INVENTORY ROUTE
========================================================= */

/* Update Inventory Quantity */
router.patch(
  '/inventory/:productId',
  updateInventory
);

export default router;