import pool from '../config/database.js';
import { getAllOrders } from '../models/Order.js';
import { countPendingDeliveries, getAllDeliveries } from '../models/Delivery.js';
import { getLowStockItems } from '../models/Inventory.js';

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
