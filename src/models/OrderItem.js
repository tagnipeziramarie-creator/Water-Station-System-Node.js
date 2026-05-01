import pool from '../config/database.js';

// Create order item
export const createOrderItem = async (itemData) => {
  const { order_id, product_id, quantity, unit_price, total_price } = itemData;
  try {
    const connection = await pool.getConnection();
    const query = `
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await connection.execute(query, [order_id, product_id, quantity, unit_price, total_price]);
    connection.release();
    return { id: result.insertId, ...itemData };
  } catch (error) {
    throw error;
  }
};

// Find order items by order ID
export const findOrderItemsByOrderId = async (orderId) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM order_items WHERE order_id = ?';
    const [rows] = await connection.execute(query, [orderId]);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Get all order items
export const getAllOrderItems = async () => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM order_items';
    const [rows] = await connection.execute(query);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Update order item
export const updateOrderItem = async (id, updateData) => {
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
    
    const query = `UPDATE order_items SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await connection.execute(query, values);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Delete order item
export const deleteOrderItem = async (id) => {
  try {
    const connection = await pool.getConnection();
    const query = 'DELETE FROM order_items WHERE id = ?';
    const [result] = await connection.execute(query, [id]);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};
