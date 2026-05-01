import pool from '../config/database.js';

// Create delivery assignment
export const createDeliveryAssignment = async (assignmentData) => {
  const { delivery_id, delivery_personnel_id, assigned_at, status } = assignmentData;
  try {
    const connection = await pool.getConnection();
    const query = `
      INSERT INTO delivery_assignments (delivery_id, delivery_personnel_id, assigned_at, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await connection.execute(query, [delivery_id, delivery_personnel_id, assigned_at || new Date(), status || 'pending']);
    connection.release();
    return { id: result.insertId, ...assignmentData };
  } catch (error) {
    throw error;
  }
};

// Find assignment by ID
export const findAssignmentById = async (id) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM delivery_assignments WHERE id = ?';
    const [rows] = await connection.execute(query, [id]);
    connection.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Find assignments by delivery ID
export const findAssignmentsByDeliveryId = async (deliveryId) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM delivery_assignments WHERE delivery_id = ?';
    const [rows] = await connection.execute(query, [deliveryId]);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Find assignments by personnel ID
export const findAssignmentsByPersonnelId = async (personnelId) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM delivery_assignments WHERE delivery_personnel_id = ? ORDER BY createdAt DESC';
    const [rows] = await connection.execute(query, [personnelId]);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Get all assignments
export const getAllAssignments = async () => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM delivery_assignments ORDER BY createdAt DESC';
    const [rows] = await connection.execute(query);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Update assignment
export const updateAssignment = async (id, updateData) => {
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
    
    const query = `UPDATE delivery_assignments SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await connection.execute(query, values);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Delete assignment
export const deleteAssignment = async (id) => {
  try {
    const connection = await pool.getConnection();
    const query = 'DELETE FROM delivery_assignments WHERE id = ?';
    const [result] = await connection.execute(query, [id]);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};
