import pool from '../config/database.js';

// Create delivery
export const createDelivery = async (deliveryData) => {
  const { order_id, delivery_personnel_id, delivery_status, scheduled_date, delivered_date, delivery_address, delivery_notes, payment_received, payment_amount } = deliveryData;
  try {
    const connection = await pool.getConnection();
    const query = `
      INSERT INTO deliveries (order_id, delivery_personnel_id, delivery_status, scheduled_date, delivered_date, delivery_address, delivery_notes, payment_received, payment_amount, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] =     await connection.execute(query, [
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
    return { id: result.insertId, ...deliveryData };
  } catch (error) {
    throw error;
  }
};

// Find delivery by ID
export const findDeliveryById = async (id) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM deliveries WHERE id = ?';
    const [rows] = await connection.execute(query, [id]);
    connection.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Find deliveries by order ID
export const findDeliveriesByOrderId = async (orderId) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM deliveries WHERE order_id = ?';
    const [rows] = await connection.execute(query, [orderId]);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Find deliveries by personnel ID
export const findDeliveriesByPersonnelId = async (personnelId) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM deliveries WHERE delivery_personnel_id = ? ORDER BY createdAt DESC';
    const [rows] = await connection.execute(query, [personnelId]);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Get all deliveries
export const getAllDeliveries = async () => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM deliveries ORDER BY createdAt DESC';
    const [rows] = await connection.execute(query);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Count pending deliveries
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

// Update delivery
export const updateDelivery = async (id, updateData) => {
  try {
    const connection = await pool.getConnection();
    const fields = [];
    const values = [];
    
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

// Delete delivery
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
