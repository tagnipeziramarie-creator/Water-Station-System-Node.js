import { v4 as uuidv4 } from 'uuid';
import { createOrder as createOrderDB, findOrdersByCustomerId, findOrderById } from '../models/Order.js';
import { getTotalStockByProductId, decrementProductStockFifo } from '../models/Inventory.js';
import { createDelivery } from '../models/Delivery.js';
import { createPayment } from '../models/Payment.js';

export const createOrder = async (req, res, next) => {
  try {
    const { product, quantity, delivery_address, total_price } = req.body;
    const userId = req.user.userId;

    const stock = await getTotalStockByProductId(product);
    if (stock < quantity) {
      return res.status(400).json({ error: 'Insufficient inventory' });
    }

    const fifo = await decrementProductStockFifo(product, quantity);
    if (!fifo.ok) {
      return res.status(400).json({ error: fifo.error || 'Insufficient inventory' });
    }

    const lineTotal = Number(total_price ?? fifo.lineTotal);

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
      message: 'Order created successfully (COD). Pay when the order is delivered.',
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const orders = await findOrdersByCustomerId(userId);

    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const order = await findOrderById(id);

    if (!order || order.customer_id !== userId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
};
