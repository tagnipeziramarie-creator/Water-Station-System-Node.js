import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// ===================================
// CUSTOMER DASHBOARD
// ===================================
export const getCustomerDashboard = async (req, res, next) => {
  let connection;

  try {
    const userId = req.user.userId;
    connection = await pool.getConnection();

    const [customerResult] = await connection.execute(
      'SELECT id, name, email, phone, address, barangay FROM users WHERE id = ? AND role = ?',
      [userId, 'customer']
    );

    if (customerResult.length === 0) {
      throw new AppError('Customer not found', 404);
    }

    const customer = customerResult[0];

    const [totalOrdersResult] = await connection.execute(
      'SELECT COUNT(*) AS count FROM orders WHERE customer_id = ?',
      [userId]
    );

    const [pendingOrdersResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM orders WHERE customer_id = ? AND order_status = 'pending'",
      [userId]
    );

    const [completedOrdersResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM orders WHERE customer_id = ? AND order_status = 'delivered'",
      [userId]
    );

    const [totalSpentResult] = await connection.execute(
      "SELECT SUM(total_price) AS total FROM orders WHERE customer_id = ? AND order_status = 'delivered'",
      [userId]
    );

    const [recentOrders] = await connection.execute(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY createdAt DESC LIMIT 5',
      [userId]
    );

    const [availableProducts] = await connection.execute(
      'SELECT * FROM water_products WHERE is_active = 1'
    );

    res.status(200).json({
      success: true,
      data: {
        customer,
        statistics: {
          totalOrders: totalOrdersResult[0].count,
          pendingOrders: pendingOrdersResult[0].count,
          completedOrders: completedOrdersResult[0].count,
          totalSpent: parseFloat(totalSpentResult[0].total || 0).toFixed(2)
        },
        recentOrders,
        availableProducts
      }
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

// ===================================
// DELIVERY DASHBOARD
// ===================================
export const getDeliveryDashboard = async (req, res, next) => {
  let connection;

  try {
    const userId = req.user.userId;
    connection = await pool.getConnection();

    const [personnelResult] = await connection.execute(
      'SELECT id, name, email, phone FROM users WHERE id = ? AND role = ?',
      [userId, 'delivery']
    );

    if (personnelResult.length === 0) {
      throw new AppError('Delivery personnel not found', 404);
    }

    const deliveryPersonnel = personnelResult[0];

    const [totalDeliveriesResult] = await connection.execute(
      'SELECT COUNT(*) AS count FROM deliveries WHERE delivery_personnel_id = ?',
      [userId]
    );

    const [completedDeliveriesResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM deliveries WHERE delivery_personnel_id = ? AND delivery_status = 'delivered'",
      [userId]
    );

    const [pendingDeliveriesResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM deliveries WHERE delivery_personnel_id = ? AND delivery_status = 'pending'",
      [userId]
    );

    const [activeDeliveries] = await connection.execute(
      "SELECT * FROM deliveries WHERE delivery_personnel_id = ? AND delivery_status IN ('pending', 'in_transit') ORDER BY createdAt DESC",
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        deliveryPersonnel,
        statistics: {
          totalDeliveries: totalDeliveriesResult[0].count,
          completedDeliveries: completedDeliveriesResult[0].count,
          pendingDeliveries: pendingDeliveriesResult[0].count
        },
        activeDeliveries
      }
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

// ===================================
// ADMIN DASHBOARD
// ===================================
export const getAdminDashboard = async (req, res, next) => {
  let connection;

  try {
    connection = await pool.getConnection();

    const [totalUsersResult] = await connection.execute(
      'SELECT COUNT(*) AS count FROM users'
    );

    const [customersResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'customer'"
    );

    const [deliveryPersonnelResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'delivery'"
    );

    const [totalOrdersResult] = await connection.execute(
      'SELECT COUNT(*) AS count FROM orders'
    );

    const [pendingOrdersResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM orders WHERE order_status = 'pending'"
    );

    const [completedOrdersResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM orders WHERE order_status = 'delivered'"
    );

    const [cancelledOrdersResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM orders WHERE order_status = 'cancelled'"
    );

    const [totalRevenueResult] = await connection.execute(
      "SELECT SUM(total_price) AS total FROM orders WHERE order_status = 'delivered'"
    );

    const [totalDeliveriesResult] = await connection.execute(
      'SELECT COUNT(*) AS count FROM deliveries'
    );

    const [successfulDeliveriesResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM deliveries WHERE delivery_status = 'delivered'"
    );

    const [recentOrders] = await connection.execute(
      `SELECT 
        orders.*, 
        users.name AS customer_name, 
        users.email AS customer_email
       FROM orders
       LEFT JOIN users ON orders.customer_id = users.id
       ORDER BY orders.createdAt DESC
       LIMIT 10`
    );

    res.status(200).json({
      success: true,
      data: {
        systemStatistics: {
          totalUsers: totalUsersResult[0].count,
          totalCustomers: customersResult[0].count,
          totalDeliveryPersonnel: deliveryPersonnelResult[0].count,
          totalOrders: totalOrdersResult[0].count,
          pendingOrders: pendingOrdersResult[0].count,
          completedOrders: completedOrdersResult[0].count,
          cancelledOrders: cancelledOrdersResult[0].count,
          totalRevenue: parseFloat(totalRevenueResult[0].total || 0).toFixed(2),
          totalDeliveries: totalDeliveriesResult[0].count,
          successfulDeliveries: successfulDeliveriesResult[0].count
        },
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

// ===================================
// UPDATE DELIVERY STATUS
// ===================================
export const updateDeliveryStatus = async (req, res, next) => {
  let connection;

  try {
    const { deliveryId } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    const validStatuses = ['pending', 'in_transit', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid delivery status', 400);
    }

    connection = await pool.getConnection();

    const [deliveryResult] = await connection.execute(
      'SELECT * FROM deliveries WHERE id = ? AND delivery_personnel_id = ?',
      [deliveryId, userId]
    );

    if (deliveryResult.length === 0) {
      throw new AppError('Delivery not found or unauthorized', 404);
    }

    await connection.execute(
      'UPDATE deliveries SET delivery_status = ?, updatedAt = NOW() WHERE id = ?',
      [status, deliveryId]
    );

    if (status === 'delivered') {
      const orderId = deliveryResult[0].order_id;

      await connection.execute(
        "UPDATE orders SET order_status = 'delivered', updatedAt = NOW() WHERE id = ?",
        [orderId]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Delivery status updated successfully'
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};