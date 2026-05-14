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
      `SELECT userId AS id, name, email, phone, address, barangay 
       FROM users 
       WHERE userId = ? AND role = ?`,
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
      "SELECT SUM(COALESCE(total_amount, total_price)) AS total FROM orders WHERE customer_id = ? AND order_status = 'delivered'",
      [userId]
    );

    const [activeRows] = await connection.execute(
      `SELECT 
        o.orderId AS id,
        o.order_status,
        o.createdAt,
        COALESCE(o.total_amount, o.total_price) AS total_price,
        d.delivery_status,
        dp.name AS personnel_name
      FROM orders o
      LEFT JOIN deliveries d ON d.order_id = o.orderId
      LEFT JOIN users dp ON dp.userId = d.delivery_personnel_id
      WHERE o.customer_id = ?
        AND o.order_status NOT IN ('delivered', 'cancelled')
      ORDER BY o.createdAt DESC`,
      [userId]
    );

    const activeOrders = activeRows.map((row) => {
      let status = row.order_status;
      if (row.delivery_status === 'in_transit') status = 'in_transit';

      return {
        id: row.id,
        status,
        total_amount: parseFloat(row.total_price || 0),
        total_items: 1,
        delivery: row.personnel_name
          ? { delivery_personnel: { name: row.personnel_name } }
          : null,
      };
    });

    const [recentRows] = await connection.execute(
      `SELECT 
        orderId AS id,
        order_status AS status,
        createdAt,
        COALESCE(total_amount, total_price) AS total_amount
       FROM orders 
       WHERE customer_id = ? 
       ORDER BY createdAt DESC 
       LIMIT 5`,
      [userId]
    );

    const recentOrders = recentRows.map((row) => ({
      ...row,
      total_amount: parseFloat(row.total_amount || 0),
      createdAt: row.createdAt,
    }));

    const [availableProducts] = await connection.execute(
      `SELECT 
        wp.product_id AS id,
        wp.product_id,
        wp.name,
        wp.description,
        wp.price,
        COALESCE(SUM(i.quantity_on_hand), 0) AS quantity
      FROM water_products wp
      LEFT JOIN inventories i ON i.product_id = wp.product_id
      WHERE wp.is_active = 1
      GROUP BY wp.product_id, wp.name, wp.description, wp.price`
    );

    res.status(200).json({
      success: true,
      data: {
        customer,
        statistics: {
          totalOrders: totalOrdersResult[0].count,
          pendingOrders: pendingOrdersResult[0].count,
          completedOrders: completedOrdersResult[0].count,
          totalSpent: parseFloat(totalSpentResult[0].total || 0).toFixed(2),
        },
        activeOrders,
        recentOrders,
        availableProducts,
      },
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
      `SELECT userId AS id, name, email, phone 
       FROM users 
       WHERE userId = ? AND role = ?`,
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

    const [inTransitResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM deliveries WHERE delivery_personnel_id = ? AND delivery_status = 'in_transit'",
      [userId]
    );

    // ===================================
    // ACTIVE DELIVERIES
    // Added valid_id fields so delivery personnel can see customer uploaded ID.
    // ===================================
    const [activeRows] = await connection.execute(
      `SELECT 
        d.id,
        d.order_id,
        d.delivery_status,
        d.createdAt,

        o.orderId,
        COALESCE(o.total_amount, o.total_price) AS total_amount,
        o.delivery_address AS order_address,
        o.product,
        o.quantity,
        o.total_price,

        o.valid_id_name,
        o.valid_id_type,
        o.valid_id_data,

        c.name AS customer_name,
        c.phone AS customer_phone,
        c.address AS customer_address,
        c.barangay AS customer_barangay

      FROM deliveries d
      INNER JOIN orders o ON o.orderId = d.order_id
      INNER JOIN users c ON c.userId = o.customer_id
      WHERE d.delivery_personnel_id = ?
        AND d.delivery_status IN ('pending', 'in_transit')
      ORDER BY d.createdAt DESC`,
      [userId]
    );

    const activeDeliveries = activeRows.map((row) => ({
      id: row.id,
      status: row.delivery_status,
      delivery_status: row.delivery_status,
      order_id: row.order_id,

      order: {
        id: row.orderId,
        orderId: row.orderId,
        total_amount: parseFloat(row.total_amount || 0),
        total_price: parseFloat(row.total_price || row.total_amount || 0),
        product: row.product,
        quantity: row.quantity,
        delivery_address: row.order_address,

        // IMPORTANT: valid ID data sent to delivery dashboard frontend
        valid_id_name: row.valid_id_name,
        valid_id_type: row.valid_id_type,
        valid_id_data: row.valid_id_data,

        customer: {
          name: row.customer_name,
          phone: row.customer_phone,
          address: row.customer_address || row.order_address,
          barangay: row.customer_barangay,
        },
      },
    }));

    // ===================================
    // TODAY DELIVERIES
    // Added valid_id fields here also.
    // ===================================
    const [todayRows] = await connection.execute(
      `SELECT 
        d.id,
        d.order_id,
        d.delivery_status,
        d.createdAt,

        o.orderId,
        COALESCE(o.total_amount, o.total_price) AS total_amount,
        o.delivery_address AS order_address,
        o.product,
        o.quantity,
        o.total_price,

        o.valid_id_name,
        o.valid_id_type,
        o.valid_id_data,

        c.name AS customer_name,
        c.phone AS customer_phone,
        c.address AS customer_address,
        c.barangay AS customer_barangay

      FROM deliveries d
      INNER JOIN orders o ON o.orderId = d.order_id
      INNER JOIN users c ON c.userId = o.customer_id
      WHERE d.delivery_personnel_id = ?
        AND (
          DATE(COALESCE(d.scheduled_date, d.createdAt)) = CURDATE()
          OR DATE(d.createdAt) = CURDATE()
        )
      ORDER BY d.createdAt DESC`,
      [userId]
    );

    const todayDeliveries = todayRows.map((row) => ({
      id: row.id,
      status: row.delivery_status,
      delivery_status: row.delivery_status,
      order_id: row.order_id,

      order: {
        id: row.orderId,
        orderId: row.orderId,
        total_amount: parseFloat(row.total_amount || 0),
        total_price: parseFloat(row.total_price || row.total_amount || 0),
        product: row.product,
        quantity: row.quantity,
        delivery_address: row.order_address,

        // IMPORTANT: valid ID data sent to delivery dashboard frontend
        valid_id_name: row.valid_id_name,
        valid_id_type: row.valid_id_type,
        valid_id_data: row.valid_id_data,

        customer: {
          name: row.customer_name,
          phone: row.customer_phone,
          address: row.customer_address || row.order_address,
          barangay: row.customer_barangay,
        },
      },
    }));

    res.status(200).json({
      success: true,
      data: {
        deliveryPersonnel,
        statistics: {
          totalDeliveries: totalDeliveriesResult[0].count,
          completedDeliveries: completedDeliveriesResult[0].count,
          pendingDeliveries: pendingDeliveriesResult[0].count,
          inTransitDeliveries: inTransitResult[0].count,
        },
        activeDeliveries,
        todayDeliveries,
      },
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
      "SELECT SUM(COALESCE(total_amount, total_price)) AS total FROM orders WHERE order_status = 'delivered'"
    );

    const [totalDeliveriesResult] = await connection.execute(
      'SELECT COUNT(*) AS count FROM deliveries'
    );

    const [successfulDeliveriesResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM deliveries WHERE delivery_status = 'delivered'"
    );

    const [pendingDeliveriesResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM deliveries WHERE delivery_status = 'pending'"
    );

    const [inTransitDeliveriesResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM deliveries WHERE delivery_status = 'in_transit'"
    );

    const [failedDeliveriesResult] = await connection.execute(
      "SELECT COUNT(*) AS count FROM deliveries WHERE delivery_status = 'failed'"
    );

    const [todayOrdersResult] = await connection.execute(
      'SELECT COUNT(*) AS count FROM orders WHERE DATE(COALESCE(order_date, createdAt)) = CURDATE()'
    );

    const [recentOrderRows] = await connection.execute(
      `SELECT 
        o.orderId AS id,
        o.order_status AS status,
        o.createdAt,
        COALESCE(o.total_amount, o.total_price) AS total_amount,
        u.name AS customer_name,
        u.email AS customer_email
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.userId
      ORDER BY o.createdAt DESC
      LIMIT 10`
    );

    const recentOrders = recentOrderRows.map((row) => ({
      id: row.id,
      status: row.status,
      total_amount: parseFloat(row.total_amount || 0),
      createdAt: row.createdAt,
      customer: row.customer_name
        ? { name: row.customer_name, email: row.customer_email }
        : null,
    }));

    const [topCustomerRows] = await connection.execute(
      `SELECT 
        u.name,
        u.email,
        u.phone,
        COUNT(o.orderId) AS orderCount,
        COALESCE(SUM(COALESCE(o.total_amount, o.total_price)), 0) AS totalSpent
      FROM users u
      INNER JOIN orders o ON o.customer_id = u.userId
      WHERE u.role = 'customer'
      GROUP BY u.userId, u.name, u.email, u.phone
      ORDER BY totalSpent DESC
      LIMIT 5`
    );

    const topCustomers = topCustomerRows.map((row) => ({
      dataValues: {
        orderCount: row.orderCount,
        totalSpent: parseFloat(row.totalSpent || 0),
      },
      customer: {
        name: row.name,
        email: row.email,
        phone: row.phone,
      },
    }));

    const [deliveryPerfRows] = await connection.execute(
      `SELECT 
        u.name,
        u.email,
        u.phone,
        COUNT(d.id) AS assignmentCount,
        SUM(CASE WHEN d.delivery_status = 'delivered' THEN 1 ELSE 0 END) AS completedCount
      FROM users u
      LEFT JOIN deliveries d ON d.delivery_personnel_id = u.userId
      WHERE u.role = 'delivery'
      GROUP BY u.userId, u.name, u.email, u.phone`
    );

    const deliveryPerformance = deliveryPerfRows.map((row) => ({
      dataValues: {
        assignmentCount: row.assignmentCount || 0,
        completedCount: row.completedCount || 0,
      },
      delivery_personnel: {
        name: row.name,
        email: row.email,
        phone: row.phone,
      },
    }));

    const [inventoryRows] = await connection.execute(
      `SELECT 
        wp.product_id,
        wp.name,
        wp.price,
        COALESCE(SUM(i.quantity_on_hand), 0) AS quantity
      FROM water_products wp
      LEFT JOIN inventories i ON i.product_id = wp.product_id
      WHERE wp.is_active = 1
      GROUP BY wp.product_id, wp.name, wp.price
      ORDER BY wp.name ASC`
    );

    const inventoryStatus = inventoryRows.map((row) => ({
      product_id: row.product_id,
      name: row.name,
      price: parseFloat(row.price || 0),
      quantity: Number(row.quantity || 0),
    }));

    const [unassignedRows] = await connection.execute(
      `SELECT 
        d.id AS delivery_id,
        d.order_id,
        o.delivery_address,
        c.name AS customer_name,
        c.phone AS customer_phone
      FROM deliveries d
      INNER JOIN orders o ON o.orderId = d.order_id
      INNER JOIN users c ON c.userId = o.customer_id
      WHERE d.delivery_personnel_id IS NULL
        AND d.delivery_status = 'pending'
      ORDER BY d.createdAt DESC`
    );

    const [deliveryStaffRows] = await connection.execute(
      `SELECT userId AS id, name, email 
       FROM users 
       WHERE role = 'delivery' 
       ORDER BY name ASC`
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
          successfulDeliveries: successfulDeliveriesResult[0].count,
          pendingDeliveries: pendingDeliveriesResult[0].count,
          inTransitDeliveries: inTransitDeliveriesResult[0].count,
          failedDeliveries: failedDeliveriesResult[0].count,
          todayOrders: todayOrdersResult[0].count,
        },
        recentOrders,
        topCustomers,
        deliveryPerformance,
        inventoryStatus,
        unassignedDeliveries: unassignedRows,
        deliveryStaff: deliveryStaffRows,
      },
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
    let { status } = req.body;
    const userId = req.user.userId;

    if (status === 'completed') {
      status = 'delivered';
    }

    const validStatuses = [
      'pending',
      'in_transit',
      'delivered',
      'cancelled',
      'failed',
      'rescheduled',
    ];

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

    const deliveryRow = deliveryResult[0];
    const orderId = deliveryRow.order_id;

    await connection.execute(
      'UPDATE deliveries SET delivery_status = ?, updatedAt = NOW() WHERE id = ?',
      [status, deliveryId]
    );

    if (status === 'delivered') {
      await connection.execute(
        'UPDATE deliveries SET delivered_date = NOW() WHERE id = ?',
        [deliveryId]
      );

      await connection.execute(
        `UPDATE orders 
         SET order_status = 'delivered', payment = 'paid', updatedAt = NOW() 
         WHERE orderId = ?`,
        [orderId]
      );

      await connection.execute(
        `UPDATE payments 
         SET payment_status = 'completed', paid_at = NOW(), updatedAt = NOW()
         WHERE order_id = ? AND payment_method IN ('COD', 'cash_on_delivery')`,
        [orderId]
      );
    } else if (status === 'in_transit') {
      await connection.execute(
        `UPDATE orders 
         SET order_status = 'confirmed', updatedAt = NOW() 
         WHERE orderId = ? AND order_status = 'pending'`,
        [orderId]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Delivery status updated successfully',
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};