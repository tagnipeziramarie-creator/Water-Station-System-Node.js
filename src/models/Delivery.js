import pool from '../config/database.js';

// ===================================
// CREATE DELIVERY
// ===================================
export const createDelivery = async (deliveryData) => {
  const {
    order_id,
    delivery_personnel_id,
    delivery_status,
    scheduled_date,
    delivered_date,
    delivery_address,
    delivery_notes,
    payment_received,
    payment_amount,
  } = deliveryData;

  try {
    const connection = await pool.getConnection();

    // Insert new delivery record
    const query = `
      INSERT INTO deliveries (
        order_id,
        delivery_personnel_id,
        delivery_status,
        scheduled_date,
        delivered_date,
        delivery_address,
        delivery_notes,
        payment_received,
        payment_amount,
        createdAt,
        updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await connection.execute(query, [
      order_id,
      delivery_personnel_id ?? null,
      delivery_status || 'pending',
      scheduled_date ?? null,
      delivered_date ?? null,
      delivery_address ?? null,
      delivery_notes ?? null,
      payment_received || false,
      payment_amount ?? null,
    ]);

    connection.release();

    return {
      id: result.insertId,
      ...deliveryData,
    };
  } catch (error) {
    throw error;
  }
};

// ===================================
// FIND DELIVERY BY ID
// Includes order, customer, and valid ID details
// ===================================
export const findDeliveryById = async (id) => {
  try {
    const connection = await pool.getConnection();

    // Get delivery with related order and customer details
    const query = `
      SELECT
        d.*,

        o.orderId AS order_orderId,
        o.customer_id AS order_customer_id,
        o.product AS order_product,
        o.quantity AS order_quantity,
        o.total_amount AS order_total_amount,
        o.total_price AS order_total_price,
        o.order_status AS order_status,
        o.delivery_address AS order_delivery_address,

        -- Valid ID fields attached by customer
        o.valid_id_name AS valid_id_name,
        o.valid_id_type AS valid_id_type,
        o.valid_id_data AS valid_id_data,

        u.name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        u.address AS customer_address,
        u.barangay AS customer_barangay

      FROM deliveries d
      LEFT JOIN orders o ON o.orderId = d.order_id
      LEFT JOIN users u ON u.userId = o.customer_id
      WHERE d.id = ?
      LIMIT 1
    `;

    const [rows] = await connection.execute(query, [id]);

    connection.release();

    if (rows.length === 0) {
      return null;
    }

    return formatDeliveryRow(rows[0]);
  } catch (error) {
    throw error;
  }
};

// ===================================
// FIND DELIVERIES BY ORDER ID
// Includes valid ID details
// ===================================
export const findDeliveriesByOrderId = async (orderId) => {
  try {
    const connection = await pool.getConnection();

    const query = `
      SELECT
        d.*,

        o.orderId AS order_orderId,
        o.customer_id AS order_customer_id,
        o.product AS order_product,
        o.quantity AS order_quantity,
        o.total_amount AS order_total_amount,
        o.total_price AS order_total_price,
        o.order_status AS order_status,
        o.delivery_address AS order_delivery_address,

        -- Valid ID fields attached by customer
        o.valid_id_name AS valid_id_name,
        o.valid_id_type AS valid_id_type,
        o.valid_id_data AS valid_id_data,

        u.name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        u.address AS customer_address,
        u.barangay AS customer_barangay

      FROM deliveries d
      LEFT JOIN orders o ON o.orderId = d.order_id
      LEFT JOIN users u ON u.userId = o.customer_id
      WHERE d.order_id = ?
      ORDER BY d.createdAt DESC
    `;

    const [rows] = await connection.execute(query, [orderId]);

    connection.release();

    return rows.map(formatDeliveryRow);
  } catch (error) {
    throw error;
  }
};

// ===================================
// FIND DELIVERIES BY PERSONNEL ID
// Includes valid ID details for delivery dashboard
// ===================================
export const findDeliveriesByPersonnelId = async (personnelId) => {
  try {
    const connection = await pool.getConnection();

    const query = `
      SELECT
        d.*,

        o.orderId AS order_orderId,
        o.customer_id AS order_customer_id,
        o.product AS order_product,
        o.quantity AS order_quantity,
        o.total_amount AS order_total_amount,
        o.total_price AS order_total_price,
        o.order_status AS order_status,
        o.delivery_address AS order_delivery_address,

        -- Valid ID fields attached by customer
        o.valid_id_name AS valid_id_name,
        o.valid_id_type AS valid_id_type,
        o.valid_id_data AS valid_id_data,

        u.name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        u.address AS customer_address,
        u.barangay AS customer_barangay

      FROM deliveries d
      LEFT JOIN orders o ON o.orderId = d.order_id
      LEFT JOIN users u ON u.userId = o.customer_id
      WHERE d.delivery_personnel_id = ?
      ORDER BY d.createdAt DESC
    `;

    const [rows] = await connection.execute(query, [personnelId]);

    connection.release();

    return rows.map(formatDeliveryRow);
  } catch (error) {
    throw error;
  }
};

// ===================================
// GET ALL DELIVERIES
// Includes valid ID details
// ===================================
export const getAllDeliveries = async () => {
  try {
    const connection = await pool.getConnection();

    const query = `
      SELECT
        d.*,

        o.orderId AS order_orderId,
        o.customer_id AS order_customer_id,
        o.product AS order_product,
        o.quantity AS order_quantity,
        o.total_amount AS order_total_amount,
        o.total_price AS order_total_price,
        o.order_status AS order_status,
        o.delivery_address AS order_delivery_address,

        -- Valid ID fields attached by customer
        o.valid_id_name AS valid_id_name,
        o.valid_id_type AS valid_id_type,
        o.valid_id_data AS valid_id_data,

        u.name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        u.address AS customer_address,
        u.barangay AS customer_barangay

      FROM deliveries d
      LEFT JOIN orders o ON o.orderId = d.order_id
      LEFT JOIN users u ON u.userId = o.customer_id
      ORDER BY d.createdAt DESC
    `;

    const [rows] = await connection.execute(query);

    connection.release();

    return rows.map(formatDeliveryRow);
  } catch (error) {
    throw error;
  }
};

// ===================================
// COUNT PENDING DELIVERIES
// ===================================
export const countPendingDeliveries = async () => {
  try {
    const connection = await pool.getConnection();

    const query = "SELECT COUNT(*) as count FROM deliveries WHERE delivery_status = 'pending'";

    const [rows] = await connection.execute(query);

    connection.release();

    return rows[0].count;
  } catch (error) {
    throw error;
  }
};

// ===================================
// UPDATE DELIVERY
// ===================================
export const updateDelivery = async (id, updateData) => {
  try {
    const connection = await pool.getConnection();

    const fields = [];
    const values = [];

    // Build dynamic update query
    for (const [key, value] of Object.entries(updateData)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    fields.push('updatedAt = NOW()');
    values.push(id);

    const query = `UPDATE deliveries SET ${fields.join(', ')} WHERE id = ?`;

    const [result] = await connection.execute(query, values);

    connection.release();

    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// ===================================
// DELETE DELIVERY
// ===================================
export const deleteDelivery = async (id) => {
  try {
    const connection = await pool.getConnection();

    const query = 'DELETE FROM deliveries WHERE id = ?';

    const [result] = await connection.execute(query, [id]);

    connection.release();

    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// ===================================
// FORMAT DELIVERY ROW
// Converts SQL result into the structure
// expected by delivery-dashboard.html
// ===================================
const formatDeliveryRow = (row) => {
  return {
    ...row,

    // For frontend status compatibility
    status: row.delivery_status,

    // Nested order object for delivery dashboard
    order: {
      id: row.order_orderId || row.order_id,
      orderId: row.order_orderId || row.order_id,
      order_id: row.order_orderId || row.order_id,

      product: row.order_product,
      quantity: row.order_quantity,
      total_amount: row.order_total_amount,
      total_price: row.order_total_price,
      order_status: row.order_status,
      delivery_address: row.order_delivery_address,

      // Valid ID fields included here
      valid_id_name: row.valid_id_name,
      valid_id_type: row.valid_id_type,
      valid_id_data: row.valid_id_data,

      // Customer details
      customer: {
        name: row.customer_name,
        email: row.customer_email,
        phone: row.customer_phone,
        address: row.customer_address || row.order_delivery_address,
        barangay: row.customer_barangay,
      },

      customer_name: row.customer_name,
      customer_email: row.customer_email,
      customer_phone: row.customer_phone,
      barangay: row.customer_barangay,
    },
  };
};