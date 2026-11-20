'use strict';

const mongoose = require('mongoose');
const Address = require('../models/Address');
const Order = require('../models/Order');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const {
  buildPagination,
  sendError,
  sendSuccess,
} = require('../utils/apiResponse');
const {
  InputValidationError,
  parseAdminCustomerHistoryQuery,
  parseAdminCustomerListQuery,
} = require('../validators/adminCustomers');

const CUSTOMER_LIST_SELECT = 'name email createdAt';
const CUSTOMER_DETAIL_SELECT = 'name email createdAt defaultShippingAddress';
const ADDRESS_SAFE_SELECT = 'firstName lastName addressLine1 addressLine2 city region postalCode country createdAt updatedAt';
const ORDER_HISTORY_SAFE_SELECT = 'reference status subtotal currency createdAt items.quantity';

function databaseReady(res) {
  if (mongoose.connection.readyState === 1) return true;
  sendError(res, 503, 'Customer records are temporarily unavailable.');
  return false;
}

function databaseError(res, error) {
  const errorType = typeof error?.name === 'string' ? error.name : 'UnknownError';
  console.error(`Admin customer request failed (${errorType}); details omitted.`);
  return sendError(res, 503, 'Customer records are temporarily unavailable.');
}

function sendValidationError(res, error) {
  if (!(error instanceof InputValidationError)) return false;
  sendError(res, 400, error.message, error.errors);
  return true;
}

function parseCustomerId(value) {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function customerRoleFilter() {
  return { $or: [{ role: 'customer' }, { role: { $exists: false } }] };
}

function presentAdminCustomer(customer, orderCount = 0) {
  return {
    id: customer._id.toString(),
    name: customer.name,
    email: customer.email,
    registeredAt: customer.createdAt,
    orderCount,
  };
}

function presentAdminAddress(address, defaultAddressId) {
  const id = address._id.toString();
  return {
    id,
    firstName: address.firstName,
    lastName: address.lastName,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 || '',
    city: address.city,
    region: address.region,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: Boolean(defaultAddressId && id === defaultAddressId),
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}

function presentAdminCustomerOrder(order) {
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

const listAdminCustomers = asyncHandler(async (req, res) => {
  let query;
  try {
    query = parseAdminCustomerListQuery(req.query);
  } catch (error) {
    if (sendValidationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;

  try {
    const criteria = [customerRoleFilter()];
    if (query.search) {
      const search = new RegExp(escapeRegExp(query.search), 'i');
      criteria.push({
        $or: [{ name: search }, { email: search }],
      });
    }
    const filter = { $and: criteria };
    const [customers, total] = await Promise.all([
      User.find(filter)
        .select(CUSTOMER_LIST_SELECT)
        .sort({ createdAt: -1, _id: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const customerIds = customers.map((customer) => customer._id);
    const orderCounts = customerIds.length
      ? await Order.aggregate([
          { $match: { customer: { $in: customerIds } } },
          { $group: { _id: '$customer', count: { $sum: 1 } } },
        ])
      : [];
    const countsByCustomer = new Map(
      orderCounts.map((entry) => [entry._id.toString(), entry.count]),
    );

    return sendSuccess(
      res,
      200,
      'Customers retrieved.',
      customers.map((customer) =>
        presentAdminCustomer(
          customer,
          countsByCustomer.get(customer._id.toString()) || 0,
        ),
      ),
      buildPagination(query.page, query.limit, total),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const getAdminCustomer = asyncHandler(async (req, res) => {
  if (!parseCustomerId(req.params.customerId)) {
    return sendError(res, 400, 'A valid customer identifier is required.');
  }

  let historyQuery;
  try {
    historyQuery = parseAdminCustomerHistoryQuery(req.query);
  } catch (error) {
    if (sendValidationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;

  try {
    const customer = await User.findOne({
      $and: [
        { _id: req.params.customerId },
        customerRoleFilter(),
      ],
    })
      .select(CUSTOMER_DETAIL_SELECT)
      .lean();
    if (!customer) return sendError(res, 404, 'Customer record not found.');

    const [addresses, orders, orderCount] = await Promise.all([
      Address.find({ customer: customer._id })
        .select(ADDRESS_SAFE_SELECT)
        .sort({ createdAt: 1, _id: 1 })
        .lean(),
      Order.find({ customer: customer._id })
        .select(ORDER_HISTORY_SAFE_SELECT)
        .sort({ createdAt: -1, _id: -1 })
        .skip((historyQuery.page - 1) * historyQuery.limit)
        .limit(historyQuery.limit)
        .lean(),
      Order.countDocuments({ customer: customer._id }),
    ]);
    const defaultAddressId = customer.defaultShippingAddress
      ? customer.defaultShippingAddress.toString()
      : null;

    return sendSuccess(res, 200, 'Customer retrieved.', {
      customer: presentAdminCustomer(customer, orderCount),
      addresses: addresses.map((address) =>
        presentAdminAddress(address, defaultAddressId),
      ),
      orders: orders.map(presentAdminCustomerOrder),
      orderHistoryPagination: buildPagination(
        historyQuery.page,
        historyQuery.limit,
        orderCount,
      ),
    });
  } catch (error) {
    return databaseError(res, error);
  }
});

module.exports = {
  ADDRESS_SAFE_SELECT,
  CUSTOMER_DETAIL_SELECT,
  CUSTOMER_LIST_SELECT,
  ORDER_HISTORY_SAFE_SELECT,
  getAdminCustomer,
  listAdminCustomers,
  presentAdminAddress,
  presentAdminCustomer,
  presentAdminCustomerOrder,
};
