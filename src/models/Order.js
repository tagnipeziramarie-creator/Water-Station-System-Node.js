import pool from '../config/database.js';

// Create order
export const createOrder = async (orderData) => {
  const {
    orderId,
    customer_id,
    order_date,
    order_status,
    total_amount,
    delivery_address,
    product,
    quantity,
    payment,
    total_price,
    items,
    order_items,
    valid_id_name,
    valid_id_type,
    valid_id_data,
  } = orderData;

  try {
    const connection = await pool.getConnection();

    // Convert multiple order items into JSON text for storage
    const finalItems = items || order_items || [];

    // If multiple products are ordered, save readable product summary
    const productSummary =
      finalItems.length > 0
        ? finalItems.map((item) => `${item.name} x${item.quantity}`).join(', ')
        : product;

    // Total quantity for all ordered gallons
    const totalQuantity =
      finalItems.length > 0
        ? finalItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
        : quantity;

    // Total amount for all ordered gallons
    const finalTotalAmount =
      total_amount ||
      total_price ||
      (finalItems.length > 0
        ? finalItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0)
        : 0);

    const query = `
      INSERT INTO orders (
        orderId,
        customer_id,
        order_date,
        order_status,
        total_amount,
        delivery_address,
        product,
        quantity,
        payment,
        total_price,
        order_items,
        valid_id_name,
        valid_id_type,
        valid_id_data,
        createdAt,
        updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    await connection.execute(query, [
      orderId,
      customer_id,
      order_date || new Date(),
      order_status || 'pending',
      finalTotalAmount,
      delivery_address,
      productSummary,
      totalQuantity,
      payment || 'pending',
      finalTotalAmount,
      JSON.stringify(finalItems),
      valid_id_name || null,
      valid_id_type || null,
      valid_id_data || null,
    ]);

    connection.release();

    return {
      ...orderData,
      product: productSummary,
      quantity: totalQuantity,
      total_amount: finalTotalAmount,
      total_price: finalTotalAmount,
      order_items: finalItems,
    };
  } catch (error) {
    throw error;
  }
};

// Find order by ID
export const findOrderById = async (orderId) => {
  try {
    const connection = await pool.getConnection();

    const query = 'SELECT * FROM orders WHERE orderId = ?';
    const [rows] = await connection.execute(query, [orderId]);

    connection.release();

    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Find orders by customer ID
export const findOrdersByCustomerId = async (customerId) => {
  try {
    const connection = await pool.getConnection();

    const query = 'SELECT * FROM orders WHERE customer_id = ? ORDER BY createdAt DESC';
    const [rows] = await connection.execute(query, [customerId]);

    connection.release();

    return rows;
  } catch (error) {
    throw error;
  }
};

// Get all orders
export const getAllOrders = async () => {
  try {
    const connection = await pool.getConnection();

    const query = 'SELECT * FROM orders ORDER BY createdAt DESC';
    const [rows] = await connection.execute(query);

    connection.release();

    return rows;
  } catch (error) {
    throw error;
  }
};

// Update order
export const updateOrder = async (orderId, updateData) => {
  try {
    const connection = await pool.getConnection();

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    fields.push('updatedAt = NOW()');
    values.push(orderId);

    const query = `UPDATE orders SET ${fields.join(', ')} WHERE orderId = ?`;
    const [result] = await connection.execute(query, values);

    connection.release();

    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Delete order
export const deleteOrder = async (orderId) => {
  try {
    const connection = await pool.getConnection();

    const query = 'DELETE FROM orders WHERE orderId = ?';
    const [result] = await connection.execute(query, [orderId]);

    connection.release();

    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};