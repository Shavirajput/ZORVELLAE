'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const Address = require('../models/Address');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { clearSessionCookie } = require('../config/security');
const asyncHandler = require('../utils/asyncHandler');
const {
  buildPagination,
  sendError,
  sendSuccess,
} = require('../utils/apiResponse');

function databaseReady(res) {
  if (mongoose.connection.readyState === 1) return true;
  sendError(res, 503, 'Order records are temporarily unavailable.');
  return false;
}

function databaseError(res, error) {
  const errorType = typeof error?.name === 'string' ? error.name : 'UnknownError';
  console.error(`Order request failed (${errorType}); details omitted.`);
  return sendError(res, 503, 'Order records are temporarily unavailable.');
}

async function findCustomer(customerId, res) {
  const customer = await User.findById(customerId).select('email').lean();
  if (customer) return customer;
  clearSessionCookie(res);
  sendError(res, 401, 'Authentication is required.');
  return null;
}

function generateOrderReference() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = crypto.randomBytes(5).toString('hex').toUpperCase();
  return `ZV-${date}-${suffix}`;
}

function roundAmount(amount) {
  return Number(amount.toFixed(2));
}

function presentOrder(order, includeItems = false) {
  const result = {
    id: order._id.toString(),
    reference: order.reference,
    status: order.status,
    statusHistory: order.statusHistory,
    contactEmail: order.contactEmail,
    itemCount: order.items.reduce((count, item) => count + item.quantity, 0),
    currency: order.currency,
    subtotal: order.subtotal,
    shippingStatus: order.shippingStatus,
    taxStatus: order.taxStatus,
    shippingAddress: order.shippingAddress,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
  if (includeItems) result.items = order.items;
  return result;
}

const createOrder = asyncHandler(async (req, res) => {
  if (!databaseReady(res)) return;
  try {
    await Order.init();
    const customer = await findCustomer(req.user.sub, res);
    if (!customer) return;

    const idempotencyKey = req.get('Idempotency-Key');
    const previousOrder = await Order.findOne({
      customer: req.user.sub,
      idempotencyKey,
    }).lean();
    if (previousOrder) {
      return sendSuccess(
        res,
        200,
        'The existing order for this submission was retrieved.',
        presentOrder(previousOrder),
      );
    }

    const [address, cart] = await Promise.all([
      Address.findOne({
        _id: req.body.addressId,
        customer: req.user.sub,
      }).lean(),
      Cart.findOne({ customer: req.user.sub }).lean(),
    ]);
    if (!address) return sendError(res, 404, 'Saved shipping address not found.');
    if (!cart?.items?.length) {
      return sendError(res, 400, 'Add items to your cart before creating an order.');
    }

    const productIds = [...new Set(cart.items.map((item) => item.productId))];
    const products = await Product.find({
      id: { $in: productIds },
      isActive: true,
      isPublished: true,
      isDemo: false,
      purchaseAvailable: true,
    }).lean();
    const productsById = new Map(products.map((product) => [product.id, product]));
    const orderItems = [];

    for (const cartItem of cart.items) {
      const product = productsById.get(cartItem.productId);
      if (!product) {
        return sendError(
          res,
          409,
          'One or more cart items are not available for purchase.',
        );
      }
      const variant = product.variants.find(
        (entry) => entry.id === cartItem.variantId,
      );
      if (!variant) {
        return sendError(
          res,
          409,
          'One or more cart items have an unavailable variant.',
        );
      }
      const lineTotal = roundAmount(variant.price * cartItem.quantity);
      orderItems.push({
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        imageUrl: product.images[0]?.url || '',
        imageAlt: product.images[0]?.alt || '',
        variantId: variant.id,
        variantLabel: variant.label,
        quantity: cartItem.quantity,
        unitPrice: variant.price,
        lineTotal,
      });
    }

    const currencies = new Set(
      products.map((product) => product.currency.toUpperCase()),
    );
    if (currencies.size !== 1) {
      return sendError(res, 409, 'Cart items must use one currency.');
    }
    const subtotal = roundAmount(
      orderItems.reduce((total, item) => total + item.lineTotal, 0),
    );
    const orderValues = {
      customer: req.user.sub,
      idempotencyKey,
      contactEmail: customer.email,
      items: orderItems,
      shippingAddress: {
        firstName: address.firstName,
        lastName: address.lastName,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        region: address.region,
        postalCode: address.postalCode,
        country: address.country,
      },
      currency: [...currencies][0],
      subtotal,
      status: 'placed',
      statusHistory: [{ status: 'placed', changedAt: new Date() }],
    };

    let order;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        order = await Order.create({
          ...orderValues,
          reference: generateOrderReference(),
        });
        break;
      } catch (error) {
        if (error?.code !== 11000) throw error;
        const duplicateOrder = await Order.findOne({
          customer: req.user.sub,
          idempotencyKey,
        }).lean();
        if (duplicateOrder) {
          return sendSuccess(
            res,
            200,
            'The existing order for this submission was retrieved.',
            presentOrder(duplicateOrder),
          );
        }
        if (!error.keyPattern?.reference || attempt === 2) throw error;
      }
    }

    return sendSuccess(res, 201, 'Order record created.', presentOrder(order));
  } catch (error) {
    return databaseError(res, error);
  }
});

const listCustomerOrders = asyncHandler(async (req, res) => {
  if (!databaseReady(res)) return;
  try {
    if (!(await findCustomer(req.user.sub, res))) return;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const query = { customer: req.user.sub };
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);
    return sendSuccess(
      res,
      200,
      'Order history retrieved.',
      orders.map((order) => presentOrder(order)),
      buildPagination(page, limit, total),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const getCustomerOrder = asyncHandler(async (req, res) => {
  if (!databaseReady(res)) return;
  try {
    if (!(await findCustomer(req.user.sub, res))) return;
    const order = await Order.findOne({
      _id: req.params.orderId,
      customer: req.user.sub,
    }).lean();
    if (!order) return sendError(res, 404, 'Order record not found.');
    return sendSuccess(
      res,
      200,
      'Order record retrieved.',
      presentOrder(order, true),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

module.exports = {
  createOrder,
  getCustomerOrder,
  listCustomerOrders,
};
