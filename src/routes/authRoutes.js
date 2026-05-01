import express from 'express';
import {
  register,
  login,
  logout,
} from '../controllers/authController.js';

import {
  validateRegister,
  validateLogin,
} from '../middleware/validation.js';

const router = express.Router();

// ===============================
// OPTIONAL: TEST ROUTE (FOR BROWSER)
// ===============================
router.get('/register', (req, res) => {
  res.send('Use POST method to register user');
});

router.get('/login', (req, res) => {
  res.send('Use POST method to login');
});

// ===============================
// AUTH ROUTES
// ===============================

// Register
router.post('/register', validateRegister, register);

// Login
router.post('/login', validateLogin, login);

// Logout
router.post('/logout', logout);

export default router;