'use strict';

const mongoose = require('mongoose');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const {
  clearAdminSessionCookie,
  createAdminSession,
  getAdminAuthConfiguration,
  setAdminSessionCookie,
} = require('../config/security');
const asyncHandler = require('../utils/asyncHandler');
const { verifyPassword } = require('../utils/password');
const { sendError, sendSuccess } = require('../utils/apiResponse');

function presentAdmin(admin) {
  return {
    id: admin.sub || admin._id.toString(),
    name: admin.name,
    email: admin.email,
    role: 'admin',
  };
}

function authenticationUnavailable(res, error) {
  const errorType =
    typeof error?.name === 'string' ? error.name : 'UnknownError';
  console.error(`Admin request failed (${errorType}); details omitted.`);
  return sendError(res, 503, 'Admin service is temporarily unavailable.');
}

const adminLogin = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1 || !getAdminAuthConfiguration()) {
    return sendError(res, 503, 'Admin authentication is temporarily unavailable.');
  }

  try {
    const user = await User.findOne({ email: req.body.email }).select(
      '+passwordHash name email role',
    );
    const passwordMatches = await verifyPassword(
      user?.passwordHash,
      req.body.password,
    );
    if (!user || user.role !== 'admin' || !passwordMatches) {
      return sendError(res, 401, 'Email or password is incorrect.');
    }

    const session = createAdminSession(user._id);
    if (!session) {
      return sendError(res, 503, 'Admin authentication is temporarily unavailable.');
    }
    setAdminSessionCookie(res, session);
    return sendSuccess(res, 200, 'Admin signed in.', {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: 'admin',
    });
  } catch (error) {
    return authenticationUnavailable(res, error);
  }
});

const adminLogout = asyncHandler(async (_req, res) => {
  clearAdminSessionCookie(res);
  return sendSuccess(res, 200, 'Admin signed out.');
});

const getAdminCurrentUser = asyncHandler(async (req, res) =>
  sendSuccess(res, 200, 'Admin session retrieved.', presentAdmin(req.admin)),
);

function presentRecentOrder(order) {
  return {
    id: order._id.toString(),
    reference: order.reference,
    status: order.status,
    itemCount: (order.items || []).reduce(
      (count, item) => count + item.quantity,
      0,
    ),
    subtotal: order.subtotal,
    currency: order.currency,
    createdAt: order.createdAt,
  };
}

const getAdminDashboard = asyncHandler(async (_req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return sendError(res, 503, 'Dashboard data is temporarily unavailable.');
  }

  try {
    const [products, categories, customers, orders, recentOrders] =
      await Promise.all([
        Product.countDocuments({}),
        Category.countDocuments({}),
        User.countDocuments({
          $or: [{ role: 'customer' }, { role: { $exists: false } }],
        }),
        Order.countDocuments({}),
        Order.find({})
          .sort({ createdAt: -1, _id: -1 })
          .limit(8)
          .select('reference status items.quantity subtotal currency createdAt')
          .lean(),
      ]);

    return sendSuccess(res, 200, 'Dashboard data retrieved.', {
      metrics: {
        products,
        categories,
        customers,
        orders,
        revenue: {
          amount: null,
          currency: null,
          status: 'unavailable',
          message: 'Verified paid-order records are not configured.',
        },
      },
      recentOrders: recentOrders.map(presentRecentOrder),
      inventory: {
        status: 'not_configured',
        trackedProducts: null,
        lowStockProducts: [],
        message: 'Inventory quantities are not stored in the product catalog.',
      },
    });
  } catch (error) {
    return authenticationUnavailable(res, error);
  }
});

module.exports = {
  adminLogin,
  adminLogout,
  getAdminCurrentUser,
  getAdminDashboard,
};
