import { v4 as uuidv4 } from 'uuid';
import { createOrder as createOrderDB, findOrdersByCustomerId, findOrderById } from '../models/Order.js';
import { findInventoryByProductId, decrementQuantity } from '../models/Inventory.js';

export const createOrder = async (req, res, next) => {
  try {
    const { product, quantity, delivery_address, total_price } = req.body;
    const userId = req.user.userId;

    // Check inventory
    const inventory = await findInventoryByProductId(product);
    if (!inventory || inventory.quantity_on_hand < quantity) {
      return res.status(400).json({ error: 'Insufficient inventory' });
    }

    // Create order
    const orderId = uuidv4();
    const order = await createOrderDB({
      orderId,
      customer_id: userId,
      order_date: new Date(),
      order_status: 'pending',
      product,
      quantity,
      delivery_address,
      total_price: total_price || quantity * inventory.selling_price,
      payment: 'pending',
    });

    // Decrease inventory
    await decrementQuantity(inventory.id, quantity);

    res.status(201).json({
      message: 'Order created successfully',
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
