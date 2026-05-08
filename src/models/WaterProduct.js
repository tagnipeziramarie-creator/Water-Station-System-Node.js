import pool from '../config/database.js';

// Create water product
export const createWaterProduct = async (productData) => {
  const {
    product_id,
    name,
    description,
    container_sizes,
    price,
    is_active,
  } = productData;

  let connection;

  try {
    connection = await pool.getConnection();

    const query = `
      INSERT INTO water_products
      (product_id, name, description, container_sizes, price, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(query, [
      product_id,
      name,
      description,
      typeof container_sizes === 'string'
        ? container_sizes
        : JSON.stringify(container_sizes),
      price,
      is_active !== false,
    ]);

    return {
      insertId: result.insertId,
      ...productData,
    };
  } catch (error) {
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// Find product by product_id
export const findProductById = async (productId) => {
  let connection;

  try {
    connection = await pool.getConnection();

    const query = `
      SELECT *
      FROM water_products
      WHERE product_id = ?
      LIMIT 1
    `;

    const [rows] = await connection.execute(query, [productId]);

    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// Find product by product_id
export const findProductByProductId = async (productId) => {
  let connection;

  try {
    connection = await pool.getConnection();

    const query = `
      SELECT *
      FROM water_products
      WHERE product_id = ?
      LIMIT 1
    `;

    const [rows] = await connection.execute(query, [productId]);

    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// Get all active products
export const getAllActiveProducts = async () => {
  let connection;

  try {
    connection = await pool.getConnection();

    const query = `
      SELECT *
      FROM water_products
      WHERE is_active = true
    `;

    const [rows] = await connection.execute(query);

    return rows;
  } catch (error) {
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// Get all products
export const getAllProducts = async () => {
  let connection;

  try {
    connection = await pool.getConnection();

    const query = `
      SELECT *
      FROM water_products
      ORDER BY name ASC
    `;

    const [rows] = await connection.execute(query);

    return rows;
  } catch (error) {
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// Update product using product_id
export const updateProduct = async (productId, updateData) => {
  let connection;

  try {
    connection = await pool.getConnection();

    const allowedFields = [
      'name',
      'description',
      'container_sizes',
      'price',
      'is_active',
    ];

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (!allowedFields.includes(key)) continue;

      if (key === 'container_sizes') {
        fields.push(`${key} = ?`);
        values.push(
          typeof value === 'string' ? value : JSON.stringify(value)
        );
      } else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return false;
    }

    values.push(productId);

    const query = `
      UPDATE water_products
      SET ${fields.join(', ')}
      WHERE product_id = ?
    `;

    const [result] = await connection.execute(query, values);

    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// Delete product using product_id
export const deleteProduct = async (productId) => {
  let connection;

  try {
    connection = await pool.getConnection();

    const query = `
      DELETE FROM water_products
      WHERE product_id = ?
    `;

    const [result] = await connection.execute(query, [productId]);

    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  } finally {
    if (connection) connection.release();
  }
};