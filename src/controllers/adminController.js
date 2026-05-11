import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// ===================================
// CUSTOM USER ID GENERATOR
// Avoids crypto/uuid issues on Render
// ===================================
const generateUserId = () => {
  return `USR-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
};

// ===================================
// CHECK IF COLUMN EXISTS
// ===================================
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

// ===================================
// ADMIN DASHBOARD
// ===================================
export const getAdminDashboard = async (req, res, next) => {
  let connection;

  try {
    connection = await pool.getConnection();

    // Total orders
    const [totalOrdersResult] = await connection.execute(
      'SELECT COUNT(*) AS count FROM orders'
    );

    // Total users
    const [totalUsersResult] = await connection.execute(
      'SELECT COUNT(*) AS count FROM users'
    );

    // Total customers
    const [totalCustomersResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'customer'"
    );

    // Total delivered revenue
    const [totalRevenueResult] = await connection.execute(
      "SELECT SUM(COALESCE(total_amount, total_price)) AS total FROM orders WHERE order_status IN ('delivered', 'completed')"
    );

    // Pending deliveries
    const [pendingDeliveriesResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM deliveries WHERE delivery_status = 'pending'"
    );

    // Recent orders
    const [recentOrders] = await connection.execute(
      `
        SELECT 
          o.*,
          u.name AS customer_name,
          u.email AS customer_email
        FROM orders o
        LEFT JOIN users u ON u.userId = o.customer_id
        ORDER BY o.createdAt DESC
        LIMIT 10
      `
    );

    // Inventory records
    const [inventoryStatus] = await connection.execute(
      `
        SELECT 
          product_id,
          container_size AS name,
          quantity_on_hand,
          selling_price,
          createdAt,
          updatedAt
        FROM inventories
        ORDER BY product_id ASC
      `
    );

    // Delivery staff list
    const [deliveryStaff] = await connection.execute(
      `
        SELECT 
          userId,
          name,
          email,
          phone,
          address,
          barangay,
          createdAt
        FROM users
        WHERE role = 'delivery'
        ORDER BY name ASC
      `
    );

    // Unassigned deliveries
    const [unassignedDeliveries] = await connection.execute(
      `
        SELECT
          d.id AS delivery_id,
          d.order_id,
          d.delivery_status,
          d.delivery_address,
          d.createdAt,
          o.product,
          o.quantity,
          o.total_amount,
          o.total_price,
          u.name AS customer_name,
          u.email AS customer_email,
          u.phone AS customer_phone
        FROM deliveries d
        LEFT JOIN orders o ON o.orderId = d.order_id
        LEFT JOIN users u ON u.userId = o.customer_id
        WHERE d.delivery_personnel_id IS NULL
          AND d.delivery_status = 'pending'
        ORDER BY d.createdAt ASC
      `
    );

    // Delivery performance
    const [deliveryPerformance] = await connection.execute(
      `
        SELECT
          u.userId,
          u.name,
          u.email,
          u.phone,
          COUNT(d.id) AS assignmentCount,
          SUM(CASE WHEN d.delivery_status IN ('delivered', 'completed') THEN 1 ELSE 0 END) AS completedCount
        FROM users u
        LEFT JOIN deliveries d ON d.delivery_personnel_id = u.userId
        WHERE u.role = 'delivery'
        GROUP BY u.userId, u.name, u.email, u.phone
        ORDER BY u.name ASC
      `
    );

    res.json({
      success: true,
      data: {
        systemStatistics: {
          totalUsers: totalUsersResult[0].count,
          totalCustomers: totalCustomersResult[0].count,
          totalOrders: totalOrdersResult[0].count,
          totalRevenue: Number(totalRevenueResult[0].total || 0),
          pendingDeliveries: pendingDeliveriesResult[0].count,
        },
        recentOrders,
        inventoryStatus,
        unassignedDeliveries,
        deliveryStaff,
        deliveryPerformance,
        topCustomers: [],
      },
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

// ===================================
// REPORTS
// ===================================
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
// LIST ADMIN ORDERS
// FIXED:
// - Oldest order first for priority
// - Cleaner order ID support
// - Includes delivery staff name
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
          o.orderId AS orderId,
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

          d.id AS delivery_id,
          d.delivery_status,
          d.delivery_personnel_id,

          staff.name AS delivery_personnel_name,
          staff.email AS delivery_personnel_email,
          staff.phone AS delivery_personnel_phone

        FROM orders o
        LEFT JOIN users u ON u.userId = o.customer_id
        LEFT JOIN deliveries d ON d.order_id = o.orderId
        LEFT JOIN users staff ON staff.userId = d.delivery_personnel_id

        -- Priority: first customer who ordered appears first
        ORDER BY o.createdAt ASC

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

// ===================================
// UPDATE INVENTORY
// ===================================
export const updateInventory = async (req, res, next) => {
  let connection;

  try {
    const { productId } = req.params;

    const {
      product_id,
      name,
      price,
      selling_price,
      quantity,
      quantity_on_hand,
    } = req.body;

    const finalProductId = product_id || productId;
    const finalName = name || finalProductId;
    const finalPrice = Number(price || selling_price || 0);
    const finalQuantity = Number(quantity_on_hand ?? quantity ?? 0);

    connection = await pool.getConnection();

    const [existingRows] = await connection.execute(
      'SELECT id FROM inventories WHERE product_id = ? LIMIT 1',
      [finalProductId]
    );

    if (existingRows.length > 0) {
      await connection.execute(
        `
          UPDATE inventories
          SET container_size = ?,
              quantity_on_hand = ?,
              selling_price = ?,
              updatedAt = NOW()
          WHERE product_id = ?
        `,
        [finalName, finalQuantity, finalPrice, finalProductId]
      );
    } else {
      await connection.execute(
        `
          INSERT INTO inventories (
            product_id,
            container_size,
            quantity_on_hand,
            reorder_level,
            reorder_quantity,
            cost_per_unit,
            selling_price,
            createdAt,
            updatedAt
          )
          VALUES (?, ?, ?, 10, 10, 0, ?, NOW(), NOW())
        `,
        [finalProductId, finalName, finalQuantity, finalPrice]
      );
    }

    await connection.execute(
      `
        INSERT INTO water_products (
          product_id,
          name,
          price,
          quantity,
          is_active,
          createdAt,
          updatedAt
        )
        VALUES (?, ?, ?, ?, 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          price = VALUES(price),
          quantity = VALUES(quantity),
          is_active = 1,
          updatedAt = NOW()
      `,
      [finalProductId, finalName, finalPrice, finalQuantity]
    );

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      product: {
        product_id: finalProductId,
        name: finalName,
        price: finalPrice,
        quantity: finalQuantity,
        quantity_on_hand: finalQuantity,
      },
    });
  } catch (error) {
    console.error('❌ updateInventory error:', error);
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

// ===================================
// GET DELIVERY STAFF
// ===================================
export const getDeliveryStaff = async (req, res, next) => {
  let connection;

  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `
        SELECT
          userId,
          name,
          email,
          phone,
          address,
          barangay,
          role,
          createdAt
        FROM users
        WHERE role = 'delivery'
        ORDER BY name ASC
      `
    );

    res.json({
      success: true,
      staff: rows,
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

// ===================================
// CREATE DELIVERY STAFF
// ===================================
export const createDeliveryStaff = async (req, res, next) => {
  let connection;

  try {
    const { name, email, password, phone, address, barangay } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required', 400);
    }

    connection = await pool.getConnection();

    const [existing] = await connection.execute(
      'SELECT userId FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (existing.length > 0) {
      throw new AppError('Email already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateUserId();

    await connection.execute(
      `
        INSERT INTO users (
          userId,
          name,
          email,
          password,
          phone,
          address,
          barangay,
          role,
          createdAt,
          updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'delivery', NOW(), NOW())
      `,
      [
        userId,
        name,
        email,
        hashedPassword,
        phone || null,
        address || null,
        barangay || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Delivery personnel added successfully',
      staff: {
        userId,
        name,
        email,
        phone,
        address,
        barangay,
        role: 'delivery',
      },
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

// ===================================
// UPDATE DELIVERY STAFF
// ===================================
export const updateDeliveryStaff = async (req, res, next) => {
  let connection;

  try {
    const { userId } = req.params;
    const { name, email, password, phone, address, barangay } = req.body;

    connection = await pool.getConnection();

    const [existing] = await connection.execute(
      "SELECT * FROM users WHERE userId = ? AND role = 'delivery' LIMIT 1",
      [userId]
    );

    if (existing.length === 0) {
      throw new AppError('Delivery personnel not found', 404);
    }

    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }

    if (email !== undefined) {
      fields.push('email = ?');
      values.push(email);
    }

    if (phone !== undefined) {
      fields.push('phone = ?');
      values.push(phone);
    }

    if (address !== undefined) {
      fields.push('address = ?');
      values.push(address);
    }

    if (barangay !== undefined) {
      fields.push('barangay = ?');
      values.push(barangay);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push('password = ?');
      values.push(hashedPassword);
    }

    if (fields.length === 0) {
      throw new AppError('No update data provided', 400);
    }

    fields.push('updatedAt = NOW()');
    values.push(userId);

    await connection.execute(
      `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE userId = ?
          AND role = 'delivery'
      `,
      values
    );

    res.json({
      success: true,
      message: 'Delivery personnel updated successfully',
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

// ===================================
// DELETE DELIVERY STAFF
// ===================================
export const deleteDeliveryStaff = async (req, res, next) => {
  let connection;

  try {
    const { userId } = req.params;

    connection = await pool.getConnection();

    const [existing] = await connection.execute(
      "SELECT * FROM users WHERE userId = ? AND role = 'delivery' LIMIT 1",
      [userId]
    );

    if (existing.length === 0) {
      throw new AppError('Delivery personnel not found', 404);
    }

    const [activeDeliveries] = await connection.execute(
      `
        SELECT id
        FROM deliveries
        WHERE delivery_personnel_id = ?
          AND delivery_status IN ('pending', 'in_transit')
        LIMIT 1
      `,
      [userId]
    );

    if (activeDeliveries.length > 0) {
      throw new AppError('Cannot delete staff with active deliveries', 400);
    }

    await connection.execute(
      "DELETE FROM users WHERE userId = ? AND role = 'delivery'",
      [userId]
    );

    res.json({
      success: true,
      message: 'Delivery personnel deleted successfully',
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};