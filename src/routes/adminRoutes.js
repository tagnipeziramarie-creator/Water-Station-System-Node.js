import express from 'express';

import {
  getAdminDashboard,
  getReports,
  listAdminOrders,
  cancelAdminOrder,
  updateInventory,

  // Delivery Staff Management
  getDeliveryStaff,
  createDeliveryStaff,
  updateDeliveryStaff,
  deleteDeliveryStaff

} from '../controllers/adminController.js';

import {
  authMiddleware,
  roleMiddleware
} from '../middleware/auth.js';

/* =========================================================
   EXPRESS ROUTER
========================================================= */
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
   INVENTORY ROUTES
========================================================= */

/* Update Inventory Quantity */
router.patch(
  '/inventory/:productId',
  updateInventory
);

/* =========================================================
   DELIVERY STAFF MANAGEMENT ROUTES
========================================================= */

/* Get all delivery staff */
router.get(
  '/delivery-staff',
  getDeliveryStaff
);

/* Create delivery staff */
router.post(
  '/delivery-staff',
  createDeliveryStaff
);

/* Update delivery staff */
router.patch(
  '/delivery-staff/:userId',
  updateDeliveryStaff
);

/* Delete delivery staff */
router.delete(
  '/delivery-staff/:userId',
  deleteDeliveryStaff
);

/* =========================================================
   EXPORT ROUTER
========================================================= */
export default router;