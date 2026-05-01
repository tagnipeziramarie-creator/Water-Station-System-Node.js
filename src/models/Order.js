import pool from '../config/database.js';

// Create order
export const createOrder = async (orderData) => {
  const { orderId, customer_id, order_date, order_status, total_amount, delivery_address, product, quantity, payment, total_price } = orderData;
  try {
    const connection = await pool.getConnection();
    const query = `
      INSERT INTO orders (orderId, customer_id, order_date, order_status, total_amount, delivery_address, product, quantity, payment, total_price, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    await connection.execute(query, [
      orderId, customer_id, order_date || new Date(), order_status || 'pending', total_amount, delivery_address, product, quantity, payment || 'pending', total_price
    ]);
    connection.release();
    return orderData;
  } catch (error) {
    throw error;
  }
};

// Find order by ID
export const findOrderById = async (orderId) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM orders WHERE orderId = ?';
    const [rows] = await connection.execute(query, [orderId]);
    connection.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Find orders by customer ID
export const findOrdersByCustomerId = async (customerId) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM orders WHERE customer_id = ? ORDER BY createdAt DESC';
    const [rows] = await connection.execute(query, [customerId]);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Get all orders
export const getAllOrders = async () => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM orders ORDER BY createdAt DESC';
    const [rows] = await connection.execute(query);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Update order
export const updateOrder = async (orderId, updateData) => {
  try {
    const connection = await pool.getConnection();
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    
    fields.push('updatedAt = NOW()');
    values.push(orderId);
    
    const query = `UPDATE orders SET ${fields.join(', ')} WHERE orderId = ?`;
    const [result] = await connection.execute(query, values);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Delete order
export const deleteOrder = async (orderId) => {
  try {
    const connection = await pool.getConnection();
    const query = 'DELETE FROM orders WHERE orderId = ?';
    const [result] = await connection.execute(query, [orderId]);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};
