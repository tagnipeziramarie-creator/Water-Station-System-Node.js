import { v4 as uuidv4 } from 'uuid';

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
   CREATE ORDER
========================================================= */
export const createOrder = async (req, res, next) => {
  try {
    /*
      Accept both naming styles:
      - product / product_id / productId
      - delivery_address / deliveryAddress
      - total_price / totalAmount / total_amount
    */
    const product =
      req.body.product ||
      req.body.product_id ||
      req.body.productId;

    const quantity =
      Number(req.body.quantity || 1);

    const delivery_address =
      req.body.delivery_address ||
      req.body.deliveryAddress ||
      '';

    const total_price =
      req.body.total_price ??
      req.body.total_amount ??
      req.body.totalAmount ??
      null;

    const userId =
      req.user?.userId ||
      req.user?.id;

    /*
      This prevents MySQL error:
      "Bind parameters must not contain undefined"
    */
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    if (!product) {
      return res.status(400).json({
        error: 'Product is required'
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'Valid quantity is required'
      });
    }

    if (!delivery_address.trim()) {
      return res.status(400).json({
        error: 'Delivery address is required'
      });
    }

    const stock = await getTotalStockByProductId(product);

    if (stock < quantity) {
      return res.status(400).json({
        error: 'Insufficient inventory'
      });
    }

    const fifo = await decrementProductStockFifo(
      product,
      quantity
    );

    if (!fifo.ok) {
      return res.status(400).json({
        error: fifo.error || 'Insufficient inventory'
      });
    }

    const lineTotal =
      Number(total_price ?? fifo.lineTotal ?? 0);

    const orderId = uuidv4();

    const order = await createOrderDB({
      orderId,
      customer_id: userId,
      order_date: new Date(),
      order_status: 'pending',
      product,
      quantity,
      delivery_address,
      total_amount: lineTotal,
      total_price: lineTotal,
      payment: 'pending',
    });

    await createDelivery({
      order_id: orderId,
      delivery_personnel_id: null,
      delivery_status: 'pending',
      delivery_address,
      payment_received: false,
    });

    await createPayment({
      order_id: orderId,
      payment_method: 'COD',
      payment_status: 'pending',
      amount: lineTotal,
    });

    res.status(201).json({
      message:
        'Order created successfully (COD). Pay when the order is delivered.',
      order,
    });

  } catch (error) {
    console.error('❌ createOrder error:', error);
    next(error);
  }
};

/* =========================================================
   GET CUSTOMER ORDERS
========================================================= */
export const getOrders = async (req, res, next) => {
  try {
    const userId =
      req.user?.userId ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    const orders = await findOrdersByCustomerId(userId);

    res.json({
      orders
    });

  } catch (error) {
    console.error('❌ getOrders error:', error);
    next(error);
  }
};

/* =========================================================
   GET SINGLE ORDER BY ID
========================================================= */
export const getOrderById = async (req, res, next) => {
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

    const order = await findOrderById(id);

    if (!order || order.customer_id !== userId) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    res.json({
      order
    });

  } catch (error) {
    console.error('❌ getOrderById error:', error);
    next(error);
  }
};