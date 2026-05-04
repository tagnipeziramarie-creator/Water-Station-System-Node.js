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

// Find inventory by product ID (first row — prefer aggregate/total helpers for stock checks)
export const findInventoryByProductId = async (productId) => {
  try {
    const connection = await pool.getConnection();
    const query = 'SELECT * FROM inventories WHERE product_id = ? ORDER BY id ASC';
    const [rows] = await connection.execute(query, [productId]);
    connection.release();
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

/** Total sellable units across all container rows for a product */
export const getTotalStockByProductId = async (productId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT COALESCE(SUM(quantity_on_hand), 0) AS total FROM inventories WHERE product_id = ?',
      [productId]
    );
    return Number(rows[0]?.total || 0);
  } finally {
    connection.release();
  }
};

/**
 * Decrement stock FIFO across container rows; line total uses each row's selling_price.
 * Runs in a single transaction.
 */
export const decrementProductStockFifo = async (productId, quantity) => {
  const connection = await pool.getConnection();
  let txStarted = false;
  try {
    await connection.beginTransaction();
    txStarted = true;
    const [rows] = await connection.execute(
      'SELECT * FROM inventories WHERE product_id = ? AND quantity_on_hand > 0 ORDER BY id ASC FOR UPDATE',
      [productId]
    );

    let remaining = Number(quantity);
    let lineTotal = 0;

    for (const row of rows) {
      if (remaining <= 0) break;
      const take = Math.min(Number(row.quantity_on_hand), remaining);
      if (take <= 0) continue;
      await connection.execute(
        'UPDATE inventories SET quantity_on_hand = quantity_on_hand - ?, updatedAt = NOW() WHERE id = ?',
        [take, row.id]
      );
      lineTotal += take * Number(row.selling_price);
      remaining -= take;
    }

    if (remaining > 0) {
      await connection.rollback();
      txStarted = false;
      return { ok: false, error: 'Insufficient inventory' };
    }

    await connection.commit();
    txStarted = false;
    return { ok: true, lineTotal };
  } catch (err) {
    if (txStarted) await connection.rollback().catch(() => {});
    throw err;
  } finally {
    connection.release();
  }
};

/** Restock cancelled orders onto the primary (lowest id) bin for that product_id */
export const incrementPrimaryStockForProduct = async (productId, quantity) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id FROM inventories WHERE product_id = ? ORDER BY id ASC LIMIT 1',
      [productId]
    );
    if (rows.length === 0) return false;
    await connection.execute(
      'UPDATE inventories SET quantity_on_hand = quantity_on_hand + ?, updatedAt = NOW() WHERE id = ?',
      [quantity, rows[0].id]
    );
    return true;
  } finally {
    connection.release();
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
