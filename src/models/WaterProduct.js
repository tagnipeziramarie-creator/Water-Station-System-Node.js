import pool from '../config/database.js';

// Create water product
export const createWaterProduct = async (productData) => {
  const { product_id, name, description, container_sizes, price, is_active } = productData;
  try {
    const connection = await pool.getConnection();
    const query = `
      INSERT INTO water_products (product_id, name, description, container_sizes, price, is_active, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await connection.execute(query, [
      product_id, name, description, 
      typeof container_sizes === 'string' ? container_sizes : JSON.stringify(container_sizes),
      price, is_active !== false
    ]);
    connection.release();
    return { id: result.insertId, ...productData };
  } catch (error) {
    throw error;
  }
};

// Find product by ID
export const findProductById = async (id) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM water_products WHERE id = ?';
    const [rows] = await connection.execute(query, [id]);
    connection.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Find product by product ID
export const findProductByProductId = async (productId) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM water_products WHERE product_id = ?';
    const [rows] = await connection.execute(query, [productId]);
    connection.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Get all active products
export const getAllActiveProducts = async () => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM water_products WHERE is_active = true';
    const [rows] = await connection.execute(query);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Get all products
export const getAllProducts = async () => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM water_products';
    const [rows] = await connection.execute(query);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Update product
export const updateProduct = async (id, updateData) => {
  try {
    const connection = await pool.getConnection();
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (key === 'container_sizes' && typeof value === 'object') {
        fields.push(`${key} = ?`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    fields.push('updatedAt = NOW()');
    values.push(id);
    
    const query = `UPDATE water_products SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await connection.execute(query, values);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Delete product
export const deleteProduct = async (id) => {
  try {
    const connection = await pool.getConnection();
    const query = 'DELETE FROM water_products WHERE id = ?';
    const [result] = await connection.execute(query, [id]);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};
