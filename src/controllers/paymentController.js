import { findOrderById, updateOrder } from '../models/Order.js';
import { findPaymentByOrderId, createPayment, updatePayment } from '../models/Payment.js';

export const getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const payment = await findPaymentByOrderId(orderId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    next(error);
  }
};

export const createCheckout = async (req, res, next) => {
  try {
    const { orderId, amount, description } = req.body;

    // Create COD payment record
    const payment = await createPayment({
      order_id: orderId,
      payment_method: 'COD',
      payment_status: 'pending',
      amount,
    });

    res.json({
      message: 'COD payment initialized',
      payment,
    });
  } catch (error) {
    next(error);
  }
};

export const confirmPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Find payment record
    const payment = await findPaymentByOrderId(orderId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    // Mark as completed (for COD, payment is marked as completed upon delivery)
    await updatePayment(payment.id, {
      payment_status: 'completed',
      paid_at: new Date(),
    });

    // Update order status
    await updateOrder(orderId, {
      order_status: 'confirmed',
      payment: 'paid'
    });

    res.json({
      message: 'Payment confirmed',
      payment,
    });
  } catch (error) {
    next(error);
  }
};



