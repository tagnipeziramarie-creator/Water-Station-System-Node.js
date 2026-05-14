import pool from '../config/database.js';

import {
  createOrder as createOrderDB,
  findOrdersByCustomerId,
  findOrderById
} from '../models/Order.js';

import {
  getTotalStockByProductId,
  decrementProductStockFifo
} from '../models/Inventory.js';

import { createDelivery } from '../models/Delivery.js';
import { createPayment } from '../models/Payment.js';

/* =========================================================
   CLEAN ORDER ID GENERATOR
   Example:
   ORD-001
   ORD-002
========================================================= */
const generateOrderId = async () => {

  const connection = await pool.getConnection();

  try {

    const [rows] = await connection.execute(
      `
        SELECT orderId
        FROM orders
        WHERE orderId LIKE 'ORD-%'
        ORDER BY orderId DESC
        LIMIT 1
      `
    );

    let nextNumber = 1;

    if (rows.length > 0) {

      const latestId = rows[0].orderId;

      const match = latestId.match(/\d+/);

      if (match) {
        nextNumber =
          parseInt(match[0], 10) + 1;
      }
    }

    return `ORD-${String(nextNumber).padStart(3, '0')}`;

  } finally {

    connection.release();
  }
};

/* =========================================================
   CREATE ORDER
   - Supports multiple gallon types
   - Checks inventory
   - Deducts inventory
========================================================= */
export const createOrder = async (req, res, next) => {

  try {

    /* =========================================
       GET LOGGED-IN USER
    ========================================= */
    const userId =
      req.user?.userId ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    /* =========================================
       GET DELIVERY ADDRESS
    ========================================= */
    const delivery_address =
      req.body.delivery_address ||
      req.body.deliveryAddress ||
      '';

    if (!delivery_address.trim()) {
      return res.status(400).json({
        error: 'Delivery address is required'
      });
    }

    /* =========================================
       GET MULTIPLE ITEMS
    ========================================= */
    const items =
      req.body.items ||
      req.body.order_items ||
      [];

    /* =========================================
       SUPPORT SINGLE PRODUCT
    ========================================= */
    const finalItems =
      Array.isArray(items) &&
      items.length > 0
        ? items
        : [
            {
              product_id:
                req.body.product_id ||
                req.body.productId ||
                req.body.product,

              product:
                req.body.product_id ||
                req.body.productId ||
                req.body.product,

              name: req.body.product,

              quantity: Number(
                req.body.quantity || 1
              ),

              price: Number(
                req.body.price || 0
              ),

              subtotal: Number(
                req.body.total_price ||
                req.body.total_amount ||
                0
              )
            }
          ];

    /* =========================================
       VALIDATE ITEMS
    ========================================= */
    if (!finalItems.length) {
      return res.status(400).json({
        error: 'Order items are required'
      });
    }

    for (const item of finalItems) {

      const productId =
        item.product_id ||
        item.product;

      const quantity =
        Number(item.quantity || 0);

      if (!productId) {
        return res.status(400).json({
          error: 'Product is required'
        });
      }

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          error: 'Valid quantity is required'
        });
      }
    }

    /* =========================================
       CHECK INVENTORY
    ========================================= */
    for (const item of finalItems) {

      const productId =
        item.product_id ||
        item.product;

      const quantity =
        Number(item.quantity || 0);

      const stock =
        await getTotalStockByProductId(
          productId
        );

      if (stock < quantity) {

        return res.status(400).json({
          error:
            `Insufficient inventory for ${
              item.name || productId
            }`
        });
      }
    }

    /* =========================================
       DEDUCT INVENTORY
    ========================================= */
    for (const item of finalItems) {

      const productId =
        item.product_id ||
        item.product;

      const quantity =
        Number(item.quantity || 0);

      const fifo =
        await decrementProductStockFifo(
          productId,
          quantity
        );

      if (!fifo.ok) {

        return res.status(400).json({
          error:
            fifo.error ||
            `Insufficient inventory for ${
              item.name || productId
            }`
        });
      }
    }

    /* =========================================
       TOTAL QUANTITY
    ========================================= */
    const totalQuantity =
      finalItems.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 0),
        0
      );

    /* =========================================
       TOTAL AMOUNT
    ========================================= */
    const totalAmount =
      finalItems.reduce((sum, item) => {

        const quantity =
          Number(item.quantity || 0);

        const price =
          Number(item.price || 0);

        const subtotal =
          Number(item.subtotal || 0);

        return sum + (
          subtotal > 0
            ? subtotal
            : quantity * price
        );

      }, 0);

    /* =========================================
       PRODUCT SUMMARY
    ========================================= */
    const productSummary =
      finalItems
        .map(item =>
          `${item.name || item.product_id} x${item.quantity}`
        )
        .join(', ');

    /* =========================================
       CLEAN ORDER ID
    ========================================= */
    const orderId =
      await generateOrderId();

    /* =========================================
       DEBUG LOG
    ========================================= */
    console.log('ORDER DATA TO SAVE:', {
      orderId,
      customer_id: userId,
      productSummary,
      totalQuantity,
      totalAmount,
      finalItems
    });

    /* =========================================
       SAVE ORDER
    ========================================= */
    const order =
      await createOrderDB({

        orderId,

        customer_id: userId,

        order_date: new Date(),

        order_status: 'pending',

        product: productSummary,

        quantity: totalQuantity,

        delivery_address,

        total_amount: totalAmount,

        total_price: totalAmount,

        payment: 'pending',

        items: finalItems,

        order_items: finalItems,

        valid_id_name:
          req.body.valid_id_name || null,

        valid_id_type:
          req.body.valid_id_type || null,

        valid_id_data:
          req.body.valid_id_data || null
      });

    /* =========================================
       CREATE DELIVERY
    ========================================= */
    await createDelivery({
      order_id: orderId,
      delivery_personnel_id: null,
      delivery_status: 'pending',
      delivery_address,
      payment_received: false,
    });

    /* =========================================
       CREATE PAYMENT
    ========================================= */
    await createPayment({
      order_id: orderId,
      payment_method: 'COD',
      payment_status: 'pending',
      amount: totalAmount,
    });

    /* =========================================
       SUCCESS RESPONSE
    ========================================= */
    res.status(201).json({
      message:
        'Order created successfully (COD).',
      order,
    });

  } catch (error) {

    console.error(
      '❌ createOrder error:',
      error
    );

    next(error);
  }
};

/* =========================================================
   GET CUSTOMER ORDERS
========================================================= */
export const getOrders = async (
  req,
  res,
  next
) => {

  try {

    const userId =
      req.user?.userId ||
      req.user?.id;

    if (!userId) {

      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    const orders =
      await findOrdersByCustomerId(
        userId
      );

    res.json({
      orders
    });

  } catch (error) {

    console.error(
      '❌ getOrders error:',
      error
    );

    next(error);
  }
};

/* =========================================================
   GET ORDER BY ID
========================================================= */
export const getOrderById = async (
  req,
  res,
  next
) => {

  try {

    const { id } = req.params;

    const userId =
      req.user?.userId ||
      req.user?.id;

    if (!userId) {

      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    const order =
      await findOrderById(id);

    if (
      !order ||
      order.customer_id !== userId
    ) {

      return res.status(404).json({
        error: 'Order not found'
      });
    }

    res.json({
      order
    });

  } catch (error) {

    console.error(
      '❌ getOrderById error:',
      error
    );

    next(error);
  }
};