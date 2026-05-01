import pool from '../config/database.js';

// Create notification
export const createNotification = async (notificationData) => {
  const { user_id, type, title, message, is_read, related_entity_id, read_at } = notificationData;
  try {
    const connection = await pool.getConnection();
    const query = `
      INSERT INTO notifications (user_id, type, title, message, is_read, related_entity_id, read_at, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await connection.execute(query, [user_id, type, title, message, is_read || false, related_entity_id, read_at]);
    connection.release();
    return { id: result.insertId, ...notificationData };
  } catch (error) {
    throw error;
  }
};

// Find notification by ID
export const findNotificationById = async (id) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM notifications WHERE id = ?';
    const [rows] = await connection.execute(query, [id]);
    connection.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Find notifications by user ID
export const findNotificationsByUserId = async (userId) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM notifications WHERE user_id = ? ORDER BY createdAt DESC';
    const [rows] = await connection.execute(query, [userId]);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Find unread notifications by user ID
export const findUnreadNotificationsByUserId = async (userId) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM notifications WHERE user_id = ? AND is_read = false ORDER BY createdAt DESC';
    const [rows] = await connection.execute(query, [userId]);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Get all notifications
export const getAllNotifications = async () => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM notifications ORDER BY createdAt DESC';
    const [rows] = await connection.execute(query);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Mark as read
export const markNotificationAsRead = async (id) => {
  try {
    const connection = await pool.getConnection();
    const query = 'UPDATE notifications SET is_read = true, read_at = NOW(), updatedAt = NOW() WHERE id = ?';
    const [result] = await connection.execute(query, [id]);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Update notification
export const updateNotification = async (id, updateData) => {
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
    
    const query = `UPDATE notifications SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await connection.execute(query, values);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (id) => {
  try {
    const connection = await pool.getConnection();
    const query = 'DELETE FROM notifications WHERE id = ?';
    const [result] = await connection.execute(query, [id]);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};
