import express from 'express';
import {
  getAdminDashboard,
  getReports,
} from '../controllers/adminController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/dashboard', getAdminDashboard);
router.get('/reports', getReports);

export default router;
