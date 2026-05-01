import pool from '../config/database.js';

// Create user
export const createUser = async (userData) => {
  const { userId, name, email, password, phone, address, barangay, role } = userData;
  try {
    const connection = await pool.getConnection();
    const query = `
      INSERT INTO users (userId, name, email, password, phone, address, barangay, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await connection.execute(query, [
      userId, name, email, password, phone, address, barangay, role || 'customer'
    ]);
    connection.release();
    return { userId, name, email, phone, role };
  } catch (error) {
    throw error;
  }
};

// Find user by email
export const findUserByEmail = async (email) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await connection.execute(query, [email]);
    connection.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Find user by ID
export const findUserById = async (userId) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM users WHERE userId = ?';
    const [rows] = await connection.execute(query, [userId]);
    connection.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Get all users
export const getAllUsers = async () => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT userId, name, email, phone, role, address, barangay, createdAt FROM users';
    const [rows] = await connection.execute(query);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Update user
export const updateUser = async (userId, updateData) => {
  try {
    const connection = await pool.getConnection();
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    
    fields.push('updatedAt = NOW()');
    values.push(userId);
    
    const query = `UPDATE users SET ${fields.join(', ')} WHERE userId = ?`;
    const [result] = await connection.execute(query, values);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Delete user
export const deleteUser = async (userId) => {
  try {
    const connection = await pool.getConnection();
    const query = 'DELETE FROM users WHERE userId = ?';
    const [result] = await connection.execute(query, [userId]);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};
