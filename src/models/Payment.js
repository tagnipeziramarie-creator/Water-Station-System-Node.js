import pool from '../config/database.js';

// Create payment
export const createPayment = async (paymentData) => {
  const { order_id, payment_method, payment_status, amount, receipt_url, paid_at, notes } = paymentData;
  try {
    const connection = await pool.getConnection();
    const query = `
      INSERT INTO payments (order_id, payment_method, payment_status, amount, receipt_url, paid_at, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await connection.execute(query, [
      order_id, payment_method || 'COD', payment_status || 'pending', amount, receipt_url, paid_at, notes
    ]);
    connection.release();
    return { id: result.insertId, ...paymentData };
  } catch (error) {
    throw error;
  }
};

// Find payment by ID
export const findPaymentById = async (id) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM payments WHERE id = ?';
    const [rows] = await connection.execute(query, [id]);
    connection.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Find payment by order ID
export const findPaymentByOrderId = async (orderId) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM payments WHERE order_id = ?';
    const [rows] = await connection.execute(query, [orderId]);
    connection.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Get all payments
export const getAllPayments = async () => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM payments ORDER BY createdAt DESC';
    const [rows] = await connection.execute(query);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Update payment
export const updatePayment = async (id, updateData) => {
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
    
    const query = `UPDATE payments SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await connection.execute(query, values);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Delete payment
export const deletePayment = async (id) => {
  try {
    const connection = await pool.getConnection();
    const query = 'DELETE FROM payments WHERE id = ?';
    const [result] = await connection.execute(query, [id]);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};
