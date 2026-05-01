import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import db from './config/database.js';

import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// FIX FOR __dirname (ES MODULE)
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// MIDDLEWARE
// ===============================
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// SERVE FRONTEND FILES
// ===============================
app.use(express.static(path.join(__dirname, 'public')));

// ===============================
// ROOT ROUTE
// ===============================
app.get('/', (req, res) => {
  res.send('Water Refilling Delivery System API is running');
});

// ===============================
// HEALTH CHECK
// ===============================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
  });
});

// ===============================
// API ROUTES
// ===============================
app.use('/auth', authRoutes);
app.use('/orders', orderRoutes);
app.use('/payments', paymentRoutes);
app.use('/delivery', deliveryRoutes);
app.use('/admin', adminRoutes);
app.use('/dashboard', dashboardRoutes);

// ===============================
// 404 HANDLER
// ===============================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ===============================
// ERROR HANDLER
// ===============================
app.use(errorHandler);

// ===============================
// START SERVER
// ===============================
const start = async () => {
  try {
    // Test database connection
    const connection = await db.getConnection();
    await connection.execute('SELECT 1');
    connection.release();
    
    console.log('✅ Database connection established');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📄 Open registration page: http://localhost:${PORT}/register.html`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

start();

export default app;