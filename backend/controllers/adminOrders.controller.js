'use strict';

const mongoose = require('mongoose');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const {
  buildPagination,
  sendError,
  sendSuccess,
} = require('../utils/apiResponse');
const {
  InputValidationError,
  OrderStatusTransitionError,
  allowedOrderStatusTransitions,
  parseAdminOrderListQuery,
  parseAdminOrderStatusUpdate,
  validateOrderStatusTransition,
} = require('../validators/adminOrders');

function databaseReady(res) {
  if (mongoose.connection.readyState === 1) return true;
  sendError(res, 503, 'Order records are temporarily unavailable.');
  return false;
}

function databaseError(res, error) {
  const errorType = typeof error?.name === 'string' ? error.name : 'UnknownError';
  console.error(`Admin order request failed (${errorType}); details omitted.`);
  return sendError(res, 503, 'Order records are temporarily unavailable.');
}

function parseOrderId(value) {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function customerSnapshot(order) {
  const address = order.shippingAddress || {};
  return {
    name: [address.firstName, address.lastName].filter(Boolean).join(' '),
    email: order.contactEmail,
  };
}

function presentStatusHistory(history = []) {
  return history.map((entry) => {
    const admin = entry.changedBy && typeof entry.changedBy === 'object'
      ? entry.changedBy
      : null;
    const adminId = admin?._id || entry.changedBy;
    return {
      status: entry.status,
      changedAt: entry.changedAt,
      changedBy: adminId
        ? {
            id: adminId.toString(),
            name: admin?.name || '',
          }
        : null,
    };
  });
}

function presentAdminOrder(order, includeDetails = false) {
  const result = {
    id: order._id.toString(),
    reference: order.reference,
    customer: customerSnapshot(order),
    status: order.status,
    itemCount: (order.items || []).reduce(
      (count, item) => count + item.quantity,
      0,
    ),
    currency: order.currency,
    subtotal: order.subtotal,
    shippingStatus: order.shippingStatus,
    taxStatus: order.taxStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };

  if (includeDetails) {
    result.items = order.items;
    result.shippingAddress = order.shippingAddress;
    result.statusHistory = presentStatusHistory(order.statusHistory);
    result.allowedTransitions = allowedOrderStatusTransitions(order.status);
  }
  return result;
}

function sendValidationError(res, error) {
  if (!(error instanceof InputValidationError)) return false;
  sendError(res, 400, error.message, error.errors);
  return true;
}

const listAdminOrders = asyncHandler(async (req, res) => {
  let query;
  try {
    query = parseAdminOrderListQuery(req.query);
  } catch (error) {
    if (sendValidationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;

  try {
    const filter = {};
    if (query.status !== 'all') filter.status = query.status;
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = query.from;
      if (query.to) filter.createdAt.$lt = query.to;
    }
    if (query.search) {
      const search = new RegExp(escapeRegExp(query.search), 'i');
      filter.$or = [
        { reference: search },
        { contactEmail: search },
        { 'shippingAddress.firstName': search },
        { 'shippingAddress.lastName': search },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select('reference status contactEmail shippingAddress items.quantity currency subtotal shippingStatus taxStatus createdAt updatedAt')
        .sort({ createdAt: -1, _id: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      200,
      'Orders retrieved.',
      orders.map((order) => presentAdminOrder(order)),
      buildPagination(query.page, query.limit, total),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const getAdminOrder = asyncHandler(async (req, res) => {
  if (!parseOrderId(req.params.orderId)) {
    return sendError(res, 400, 'A valid order identifier is required.');
  }
  if (!databaseReady(res)) return;

  try {
    const order = await Order.findById(req.params.orderId)
      .populate({ path: 'statusHistory.changedBy', select: 'name' })
      .lean();
    if (!order) return sendError(res, 404, 'Order record not found.');
    return sendSuccess(
      res,
      200,
      'Order retrieved.',
      presentAdminOrder(order, true),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const updateAdminOrderStatus = asyncHandler(async (req, res) => {
  if (!parseOrderId(req.params.orderId)) {
    return sendError(res, 400, 'A valid order identifier is required.');
  }

  let nextStatus;
  try {
    nextStatus = parseAdminOrderStatusUpdate(req.body);
  } catch (error) {
    if (sendValidationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;

  try {
    const currentOrder = await Order.findById(req.params.orderId)
      .select('status')
      .lean();
    if (!currentOrder) return sendError(res, 404, 'Order record not found.');

    try {
      validateOrderStatusTransition(currentOrder.status, nextStatus);
    } catch (error) {
      if (error instanceof OrderStatusTransitionError) {
        return sendError(res, error.statusCode, error.message);
      }
      throw error;
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: currentOrder._id, status: currentOrder.status },
      {
        $set: { status: nextStatus },
        $push: {
          statusHistory: {
            status: nextStatus,
            changedAt: new Date(),
            changedBy: req.admin.sub,
          },
        },
      },
      { new: true, runValidators: true },
    )
      .populate({ path: 'statusHistory.changedBy', select: 'name' })
      .lean();

    if (!updatedOrder) {
      return sendError(
        res,
        409,
        'The order status changed elsewhere. Refresh and review the current status.',
      );
    }

    return sendSuccess(
      res,
      200,
      'Order status updated.',
      presentAdminOrder(updatedOrder, true),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

module.exports = {
  getAdminOrder,
  listAdminOrders,
  updateAdminOrderStatus,
};
