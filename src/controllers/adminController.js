import pool from '../config/database.js';
import { getAllOrders } from '../models/Order.js';
import { countPendingDeliveries, getAllDeliveries } from '../models/Delivery.js';
import { getLowStockItems } from '../models/Inventory.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAdminDashboard = async (req, res, next) => {
  try {
    const connection = await pool.getConnection();

    // Total orders
    const [totalOrdersResult] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    const totalOrders = totalOrdersResult[0].count;

    // Total revenue
    const [totalRevenueResult] = await connection.execute('SELECT SUM(total_price) as total FROM orders');
    const totalRevenue = totalRevenueResult[0].total || 0;

    // Pending deliveries
    const pendingDeliveries = await countPendingDeliveries();

    // Recent orders
    const [recentOrders] = await connection.execute(
      'SELECT * FROM orders ORDER BY createdAt DESC LIMIT 10'
    );

    // Low stock items
    const [lowStockItems] = await connection.execute(
      'SELECT * FROM inventories WHERE quantity_on_hand <= reorder_level'
    );

    connection.release();

    res.json({
      dashboard: {
        totalOrders,
        totalRevenue: parseFloat(totalRevenue).toFixed(2),
        pendingDeliveries,
        recentOrders,
        lowStockItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;
    const connection = await pool.getConnection();

    if (type === 'sales') {
      let query = `
        SELECT 
          DATE(order_date) as date,
          SUM(total_price) as totalSales,
          COUNT(orderId) as orderCount
        FROM orders
      `;
      const params = [];

      if (startDate && endDate) {
        query += ' WHERE order_date BETWEEN ? AND ?';
        params.push(new Date(startDate), new Date(endDate));
      }

      query += ' GROUP BY DATE(order_date) ORDER BY DATE(order_date) ASC';

      const [orders] = await connection.execute(query, params);
      connection.release();
      return res.json({ report: 'Sales Report', data: orders });
    }

    if (type === 'delivery') {
      let query = `
        SELECT 
          DATE(delivered_date) as date,
          COUNT(id) as deliveredCount
        FROM deliveries
        WHERE delivery_status = 'delivered'
      `;
      const params = [];

      if (startDate && endDate) {
        query += ' AND delivered_date BETWEEN ? AND ?';
        params.push(new Date(startDate), new Date(endDate));
      }

      query += ' GROUP BY DATE(delivered_date)';

      const [deliveries] = await connection.execute(query, params);
      connection.release();
      return res.json({ report: 'Delivery Report', data: deliveries });
    }

    connection.release();
    res.json({ report: 'General Report' });
  } catch (error) {
    next(error);
  }
};

// ===================================
// ORDERS (list + cancel before dispatch)
// ===================================
export const listAdminOrders = async (req, res, next) => {
  let connection;
  try {
    const raw = parseInt(String(req.query.limit || '100'), 10);
    const limit = Math.min(Math.max(Number.isFinite(raw) ? raw : 100, 1), 500);
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `SELECT 
        o.orderId AS id,
        o.customer_id,
        o.order_date,
        o.order_status,
        o.total_price,
        o.total_amount,
        o.product,
        o.quantity,
        o.delivery_address,
        o.payment,
        o.createdAt,
        u.name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        (SELECT d.id FROM deliveries d WHERE d.order_id = o.orderId ORDER BY d.id DESC LIMIT 1) AS delivery_id,
        (SELECT d.delivery_status FROM deliveries d WHERE d.order_id = o.orderId ORDER BY d.id DESC LIMIT 1) AS delivery_status,
        (SELECT d.delivery_personnel_id FROM deliveries d WHERE d.order_id = o.orderId ORDER BY d.id DESC LIMIT 1) AS delivery_personnel_id
      FROM orders o
      LEFT JOIN users u ON u.userId = o.customer_id
      ORDER BY o.createdAt DESC
      LIMIT ?`,
      [limit]
    );

    res.json({ orders: rows });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

export const cancelAdminOrder = async (req, res, next) => {
  const { orderId } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [orderRows] = await connection.execute('SELECT * FROM orders WHERE orderId = ? FOR UPDATE', [orderId]);
    if (orderRows.length === 0) {
      await connection.rollback();
      throw new AppError('Order not found', 404);
    }

    const order = orderRows[0];
    if (!['pending', 'confirmed'].includes(order.order_status)) {
      await connection.rollback();
      throw new AppError('Only pending or confirmed orders can be cancelled', 400);
    }

    const [delRows] = await connection.execute(
      'SELECT * FROM deliveries WHERE order_id = ? ORDER BY id DESC LIMIT 1 FOR UPDATE',
      [orderId]
    );

    if (delRows.length > 0) {
      const d = delRows[0];
      if (d.delivery_status === 'delivered') {
        await connection.rollback();
        throw new AppError('Cannot cancel a delivered order', 400);
      }
      if (d.delivery_status === 'in_transit') {
        await connection.rollback();
        throw new AppError('Cannot cancel while delivery is in transit', 400);
      }
    }

    await connection.execute(
      `UPDATE orders SET order_status = 'cancelled', payment = 'failed', updatedAt = NOW() WHERE orderId = ?`,
      [orderId]
    );

    if (delRows.length > 0) {
      await connection.execute(
        `UPDATE deliveries SET delivery_status = 'failed', delivery_notes = CONCAT(COALESCE(delivery_notes, ''), ' — Cancelled by admin'), updatedAt = NOW() WHERE id = ?`,
        [delRows[0].id]
      );
    }

    await connection.execute(
      `UPDATE payments SET payment_status = 'failed', updatedAt = NOW() WHERE order_id = ? AND payment_status = 'pending'`,
      [orderId]
    );

    const [bins] = await connection.execute(
      'SELECT id FROM inventories WHERE product_id = ? ORDER BY id ASC LIMIT 1 FOR UPDATE',
      [order.product]
    );
    if (bins.length > 0) {
      await connection.execute(
        'UPDATE inventories SET quantity_on_hand = quantity_on_hand + ?, updatedAt = NOW() WHERE id = ?',
        [order.quantity, bins[0].id]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Order cancelled and stock restored to primary bin for this product' });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    next(error);
  } finally {
    if (connection) connection.release();
  }
};
