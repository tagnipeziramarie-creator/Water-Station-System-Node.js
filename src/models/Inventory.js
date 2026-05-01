import pool from '../config/database.js';

// Create inventory
export const createInventory = async (inventoryData) => {
  const { product_id, container_size, quantity_on_hand, reorder_level, reorder_quantity, cost_per_unit, selling_price } = inventoryData;
  try {
    const connection = await pool.getConnection();
    const query = `
      INSERT INTO inventories (product_id, container_size, quantity_on_hand, reorder_level, reorder_quantity, cost_per_unit, selling_price, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await connection.execute(query, [product_id, container_size, quantity_on_hand || 0, reorder_level, reorder_quantity, cost_per_unit, selling_price]);
    connection.release();
    return { id: result.insertId, ...inventoryData };
  } catch (error) {
    throw error;
  }
};

// Find inventory by ID
export const findInventoryById = async (id) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM inventories WHERE id = ?';
    const [rows] = await connection.execute(query, [id]);
    connection.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Find inventory by product ID
export const findInventoryByProductId = async (productId) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM inventories WHERE product_id = ?';
    const [rows] = await connection.execute(query, [productId]);
    connection.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Get all inventory items
export const getAllInventory = async () => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM inventories';
    const [rows] = await connection.execute(query);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Get low stock items
export const getLowStockItems = async () => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM inventories WHERE quantity_on_hand <= reorder_level';
    const [rows] = await connection.execute(query);
    connection.release();
    return rows;
  } catch (error) {
    throw error;
  }
};

// Decrement quantity
export const decrementQuantity = async (id, quantity) => {
  try {
    const connection = await pool.getConnection();
    const query = 'UPDATE inventories SET quantity_on_hand = quantity_on_hand - ?, updatedAt = NOW() WHERE id = ?';
    const [result] = await connection.execute(query, [quantity, id]);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Increment quantity
export const incrementQuantity = async (id, quantity) => {
  try {
    const connection = await pool.getConnection();
    const query = 'UPDATE inventories SET quantity_on_hand = quantity_on_hand + ?, updatedAt = NOW() WHERE id = ?';
    const [result] = await connection.execute(query, [quantity, id]);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Update inventory
export const updateInventory = async (id, updateData) => {
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
    
    const query = `UPDATE inventories SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await connection.execute(query, values);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Delete inventory
export const deleteInventory = async (id) => {
  try {
    const connection = await pool.getConnection();
    const query = 'DELETE FROM inventories WHERE id = ?';
    const [result] = await connection.execute(query, [id]);
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};
