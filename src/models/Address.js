import pool from '../config/database.js';

// Create address
export const createAddress = async (addressData) => {
  const { user_id, street_address, barangay, city, province, zip_code, is_default } = addressData;
  try {
    const connection = await pool.getConnection();
    const query = `
      INSERT INTO addresses (user_id, street_address, barangay, city, province, zip_code, is_default, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await connection.execute(query, [user_id, street_address, barangay, city, province, zip_code, is_default || false]);
    connection.release();
    return { id: result.insertId, ...addressData };
  } catch (error) {
    throw error;
  }
};

// Find address by ID
export const findAddressById = async (id) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM addresses WHERE id = ?';
    const [rows] = await connection.execute(query, [id]);
    connection.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Find addresses by user ID
export const findAddressesByUserId = async (userId) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM addresses WHERE user_id = ?';
    const [rows] = await connection.execute(query, [userId]);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Find default address for user
export const findDefaultAddressByUserId = async (userId) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM addresses WHERE user_id = ? AND is_default = true LIMIT 1';
    const [rows] = await connection.execute(query, [userId]);
    connection.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Get all addresses
export const getAllAddresses = async () => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM addresses';
    const [rows] = await connection.execute(query);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Update address
export const updateAddress = async (id, updateData) => {
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
    
    const query = `UPDATE addresses SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await connection.execute(query, values);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Delete address
export const deleteAddress = async (id) => {
  try {
    const connection = await pool.getConnection();
    const query = 'DELETE FROM addresses WHERE id = ?';
    const [result] = await connection.execute(query, [id]);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};
