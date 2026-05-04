import { findDeliveriesByPersonnelId, findDeliveryById, updateDelivery } from '../models/Delivery.js';
import { createDeliveryAssignment } from '../models/DeliveryAssignment.js';
import { updateOrder } from '../models/Order.js';

export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const deliveries = await findDeliveriesByPersonnelId(userId);

    res.json({ deliveries });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Get all deliveries for this personnel and filter for delivered ones
    const allDeliveries = await findDeliveriesByPersonnelId(userId);
    const deliveries = allDeliveries.filter(d => d.delivery_status === 'delivered');

    res.json({ deliveries });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { delivery_status } = req.body;
    const userId = req.user.userId;

    const delivery = await findDeliveryById(id);

    if (!delivery || delivery.delivery_personnel_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updateData = { delivery_status };
    if (delivery_status === 'delivered') {
      updateData.delivered_date = new Date();
    }

    await updateDelivery(id, updateData);

    const updatedDelivery = await findDeliveryById(id);

    res.json({
      message: 'Delivery status updated',
      delivery: updatedDelivery,
    });
  } catch (error) {
    next(error);
  }
};

export const markPaymentReceived = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payment_amount } = req.body;
    const userId = req.user.userId;

    const delivery = await findDeliveryById(id);

    if (!delivery || delivery.delivery_personnel_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await updateDelivery(id, {
      payment_received: true,
      payment_amount,
    });

    const updatedDelivery = await findDeliveryById(id);

    res.json({
      message: 'Payment marked as received',
      delivery: updatedDelivery,
    });
  } catch (error) {
    next(error);
  }
};

export const assignPersonnel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { delivery_personnel_id } = req.body;

    const delivery = await findDeliveryById(id);
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    await updateDelivery(id, { delivery_personnel_id });

    await updateOrder(delivery.order_id, { order_status: 'confirmed' });

    // Create assignment record
    await createDeliveryAssignment({
      delivery_id: id,
      delivery_personnel_id,
      status: 'pending',
    });

    const updatedDelivery = await findDeliveryById(id);

    res.json({
      message: 'Personnel assigned',
      delivery: updatedDelivery,
    });
  } catch (error) {
    next(error);
  }
};
