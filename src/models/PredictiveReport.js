import pool from '../config/database.js';

// Create predictive report
export const createPredictiveReport = async (reportData) => {
  const { report_type, title, description, data, predictions, generated_at, is_archived } = reportData;
  try {
    const connection = await pool.getConnection();
    const query = `
      INSERT INTO predictive_reports (report_type, title, description, data, predictions, generated_at, is_archived, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await connection.execute(query, [
      report_type, title, description,
      typeof data === 'string' ? data : JSON.stringify(data),
      typeof predictions === 'string' ? predictions : JSON.stringify(predictions),
      generated_at || new Date(), is_archived || false
    ]);
    connection.release();
    return { id: result.insertId, ...reportData };
  } catch (error) {
    throw error;
  }
};

// Find report by ID
export const findReportById = async (id) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM predictive_reports WHERE id = ?';
    const [rows] = await connection.execute(query, [id]);
    connection.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Find reports by type
export const findReportsByType = async (reportType) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM predictive_reports WHERE report_type = ? AND is_archived = false ORDER BY generated_at DESC';
    const [rows] = await connection.execute(query, [reportType]);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Get all active reports
export const getAllActiveReports = async () => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM predictive_reports WHERE is_archived = false ORDER BY generated_at DESC';
    const [rows] = await connection.execute(query);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Get all reports
export const getAllReports = async () => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM predictive_reports ORDER BY generated_at DESC';
    const [rows] = await connection.execute(query);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Archive report
export const archiveReport = async (id) => {
  try {
    const connection = await pool.getConnection();
    const query = 'UPDATE predictive_reports SET is_archived = true, updatedAt = NOW() WHERE id = ?';
    const [result] = await connection.execute(query, [id]);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Update report
export const updateReport = async (id, updateData) => {
  try {
    const connection = await pool.getConnection();
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if ((key === 'data' || key === 'predictions') && typeof value === 'object') {
        fields.push(`${key} = ?`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    fields.push('updatedAt = NOW()');
    values.push(id);
    
    const query = `UPDATE predictive_reports SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await connection.execute(query, values);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Delete report
export const deleteReport = async (id) => {
  try {
    const connection = await pool.getConnection();
    const query = 'DELETE FROM predictive_reports WHERE id = ?';
    const [result] = await connection.execute(query, [id]);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};
