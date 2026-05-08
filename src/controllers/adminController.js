import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

const hasColumn = async (connection, tableName, columnName) => {
  const [rows] = await connection.execute(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [tableName, columnName]
  );

  return rows.length > 0;
};

export const getAdminDashboard = async (req, res, next) => {
  let connection;

  try {
    connection = await pool.getConnection();

    const [totalOrdersResult] = await connection.execute(
      'SELECT COUNT(*) AS count FROM orders'
    );

    const [totalRevenueResult] = await connection.execute(
      "SELECT SUM(COALESCE(total_amount, total_price)) AS total FROM orders WHERE order_status = 'delivered'"
    );

    const [pendingDeliveriesResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM deliveries WHERE delivery_status = 'pending'"
    );

    const [recentOrders] = await connection.execute(
      'SELECT * FROM orders ORDER BY createdAt DESC LIMIT 10'
    );

    const [lowStockItems] = await connection.execute(
      'SELECT * FROM inventories WHERE quantity_on_hand <= reorder_level'
    );

    res.json({
      dashboard: {
        totalOrders: totalOrdersResult[0].count,
        totalRevenue: parseFloat(totalRevenueResult[0].total || 0).toFixed(2),
        pendingDeliveries: pendingDeliveriesResult[0].count,
        recentOrders,
        lowStockItems,
      },
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

export const getReports = async (req, res, next) => {
  let connection;

  try {
    const { startDate, endDate, type } = req.query;
    connection = await pool.getConnection();

    if (type === 'sales') {
      let query = `
        SELECT 
          DATE(order_date) AS date,
          SUM(COALESCE(total_amount, total_price)) AS totalSales,
          COUNT(orderId) AS orderCount
        FROM orders
      `;

      const params = [];

      if (startDate && endDate) {
        query += ' WHERE order_date BETWEEN ? AND ?';
        params.push(new Date(startDate), new Date(endDate));
      }

      query += ' GROUP BY DATE(order_date) ORDER BY DATE(order_date) ASC';

      const [orders] = await connection.execute(query, params);

      return res.json({
        report: 'Sales Report',
        data: orders,
      });
    }

    if (type === 'delivery') {
      let query = `
        SELECT 
          DATE(delivered_date) AS date,
          COUNT(id) AS deliveredCount
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

      return res.json({
        report: 'Delivery Report',
        data: deliveries,
      });
    }

    res.json({ report: 'General Report' });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

// ===================================
// ORDERS LIST
// ===================================
export const listAdminOrders = async (req, res, next) => {
  let connection;

  try {
    const rawLimit = parseInt(String(req.query.limit || '100'), 10);
    const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 100, 1), 500);

    connection = await pool.getConnection();

    const hasProductColumn = await hasColumn(connection, 'orders', 'product');
    const hasQuantityColumn = await hasColumn(connection, 'orders', 'quantity');
    const hasTotalAmountColumn = await hasColumn(connection, 'orders', 'total_amount');
    const hasTotalPriceColumn = await hasColumn(connection, 'orders', 'total_price');
    const hasPaymentColumn = await hasColumn(connection, 'orders', 'payment');
    const hasDeliveryAddressColumn = await hasColumn(connection, 'orders', 'delivery_address');

    const totalExpression =
      hasTotalAmountColumn && hasTotalPriceColumn
        ? 'COALESCE(o.total_amount, o.total_price)'
        : hasTotalAmountColumn
          ? 'o.total_amount'
          : hasTotalPriceColumn
            ? 'o.total_price'
            : '0';

    const productExpression = hasProductColumn ? 'o.product' : "'Water Product'";
    const quantityExpression = hasQuantityColumn ? 'o.quantity' : '1';
    const paymentExpression = hasPaymentColumn ? 'o.payment' : "'pending'";
    const deliveryAddressExpression = hasDeliveryAddressColumn ? 'o.delivery_address' : "''";

    const [rows] = await connection.query(
      `
        SELECT 
          o.orderId AS id,
          o.customer_id,
          o.order_date,
          o.order_status,
          ${totalExpression} AS total_price,
          ${totalExpression} AS total_amount,
          ${productExpression} AS product,
          ${quantityExpression} AS quantity,
          ${deliveryAddressExpression} AS delivery_address,
          ${paymentExpression} AS payment,
          o.createdAt,
          u.name AS customer_name,
          u.email AS customer_email,
          u.phone AS customer_phone,
          (
            SELECT d.id 
            FROM deliveries d 
            WHERE d.order_id = o.orderId 
            ORDER BY d.id DESC 
            LIMIT 1
          ) AS delivery_id,
          (
            SELECT d.delivery_status 
            FROM deliveries d 
            WHERE d.order_id = o.orderId 
            ORDER BY d.id DESC 
            LIMIT 1
          ) AS delivery_status,
          (
            SELECT d.delivery_personnel_id 
            FROM deliveries d 
            WHERE d.order_id = o.orderId 
            ORDER BY d.id DESC 
            LIMIT 1
          ) AS delivery_personnel_id
        FROM orders o
        LEFT JOIN users u ON u.userId = o.customer_id
        ORDER BY o.createdAt DESC
        LIMIT ${limit}
      `
    );

    res.json({ orders: rows });
  } catch (error) {
    console.error('❌ listAdminOrders error:', error);
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

// ===================================
// CANCEL ORDER
// ===================================
export const cancelAdminOrder = async (req, res, next) => {
  const { orderId } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [orderRows] = await connection.execute(
      'SELECT * FROM orders WHERE orderId = ? FOR UPDATE',
      [orderId]
    );

    if (orderRows.length === 0) {
      await connection.rollback();
      throw new AppError('Order not found', 404);
    }

    const order = orderRows[0];

    if (!['pending', 'confirmed'].includes(order.order_status)) {
      await connection.rollback();
      throw new AppError('Only pending or confirmed orders can be cancelled', 400);
    }

    const [deliveryRows] = await connection.execute(
      'SELECT * FROM deliveries WHERE order_id = ? ORDER BY id DESC LIMIT 1 FOR UPDATE',
      [orderId]
    );

    if (deliveryRows.length > 0) {
      const delivery = deliveryRows[0];

      if (delivery.delivery_status === 'delivered') {
        await connection.rollback();
        throw new AppError('Cannot cancel a delivered order', 400);
      }

      if (delivery.delivery_status === 'in_transit') {
        await connection.rollback();
        throw new AppError('Cannot cancel while delivery is in transit', 400);
      }
    }

    await connection.execute(
      `
        UPDATE orders
        SET order_status = 'cancelled',
            payment = 'failed',
            updatedAt = NOW()
        WHERE orderId = ?
      `,
      [orderId]
    );

    if (deliveryRows.length > 0) {
      await connection.execute(
        `
          UPDATE deliveries
          SET delivery_status = 'failed',
              delivery_notes = CONCAT(COALESCE(delivery_notes, ''), ' — Cancelled by admin'),
              updatedAt = NOW()
          WHERE id = ?
        `,
        [deliveryRows[0].id]
      );
    }

    await connection.execute(
      `
        UPDATE payments
        SET payment_status = 'failed',
            updatedAt = NOW()
        WHERE order_id = ?
          AND payment_status = 'pending'
      `,
      [orderId]
    );

    const hasProductColumn = await hasColumn(connection, 'orders', 'product');
    const hasQuantityColumn = await hasColumn(connection, 'orders', 'quantity');

    if (hasProductColumn && hasQuantityColumn && order.product && order.quantity) {
      const [bins] = await connection.execute(
        'SELECT id FROM inventories WHERE product_id = ? ORDER BY id ASC LIMIT 1 FOR UPDATE',
        [order.product]
      );

      if (bins.length > 0) {
        await connection.execute(
          `
            UPDATE inventories
            SET quantity_on_hand = quantity_on_hand + ?,
                updatedAt = NOW()
            WHERE id = ?
          `,
          [order.quantity, bins[0].id]
        );
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    next(error);
  } finally {
    if (connection) connection.release();
  }
};