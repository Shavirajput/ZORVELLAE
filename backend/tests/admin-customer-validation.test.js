'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');
const {
  ADDRESS_SAFE_SELECT,
  CUSTOMER_DETAIL_SELECT,
  CUSTOMER_LIST_SELECT,
  ORDER_HISTORY_SAFE_SELECT,
  presentAdminAddress,
  presentAdminCustomer,
  presentAdminCustomerOrder,
} = require('../controllers/adminCustomers.controller');
const {
  InputValidationError,
  parseAdminCustomerHistoryQuery,
  parseAdminCustomerListQuery,
} = require('../validators/adminCustomers');

test('admin customer list query validates search and pagination', () => {
  assert.deepEqual(parseAdminCustomerListQuery({
    page: '3',
    limit: '50',
    search: '  customer@example.test  ',
  }), {
    page: 3,
    limit: 50,
    search: 'customer@example.test',
  });
  assert.deepEqual(parseAdminCustomerListQuery({}), {
    page: 1,
    limit: 20,
    search: '',
  });

  assert.throws(
    () => parseAdminCustomerListQuery({
      page: '0',
      limit: '101',
      search: 'x'.repeat(101),
    }),
    (error) => {
      assert.ok(error instanceof InputValidationError);
      assert.deepEqual(
        error.errors.map(({ field }) => field),
        ['page', 'limit', 'search'],
      );
      return true;
    },
  );
});

test('customer order history pagination is bounded and validated', () => {
  assert.deepEqual(parseAdminCustomerHistoryQuery({
    ordersPage: '2',
    ordersLimit: '25',
  }), { page: 2, limit: 25 });
  assert.deepEqual(parseAdminCustomerHistoryQuery({}), { page: 1, limit: 10 });
  assert.throws(
    () => parseAdminCustomerHistoryQuery({
      ordersPage: '0',
      ordersLimit: '100',
    }),
    InputValidationError,
  );
});

test('customer database projections and API presenters exclude private fields', () => {
  assert.equal(CUSTOMER_LIST_SELECT, 'name email createdAt');
  assert.equal(
    CUSTOMER_DETAIL_SELECT,
    'name email createdAt defaultShippingAddress',
  );
  assert.equal(
    ADDRESS_SAFE_SELECT,
    'firstName lastName addressLine1 addressLine2 city region postalCode country createdAt updatedAt',
  );
  assert.equal(
    ORDER_HISTORY_SAFE_SELECT,
    'reference status subtotal currency createdAt items.quantity',
  );
  for (const projection of [
    CUSTOMER_LIST_SELECT,
    CUSTOMER_DETAIL_SELECT,
    ADDRESS_SAFE_SELECT,
    ORDER_HISTORY_SAFE_SELECT,
  ]) {
    assert.doesNotMatch(projection, /passwordHash|token|cookie|secret/i);
  }

  const customerId = new mongoose.Types.ObjectId();
  const customer = presentAdminCustomer({
    _id: customerId,
    name: 'Customer Example',
    email: 'customer@example.test',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    passwordHash: 'must-not-leak',
    role: 'customer',
    token: 'must-not-leak',
    cookie: 'must-not-leak',
    defaultShippingAddress: new mongoose.Types.ObjectId(),
  }, 4);
  assert.deepEqual(Object.keys(customer).sort(), [
    'email',
    'id',
    'name',
    'orderCount',
    'registeredAt',
  ]);
  assert.equal(customer.orderCount, 4);

  const addressId = new mongoose.Types.ObjectId();
  const address = presentAdminAddress({
    _id: addressId,
    firstName: 'Customer',
    lastName: 'Example',
    addressLine1: '1 Test Street',
    addressLine2: '',
    city: 'Test City',
    region: 'Test Region',
    postalCode: '00000',
    country: 'Test Country',
    customer: customerId,
    token: 'must-not-leak',
  }, addressId.toString());
  assert.equal(address.isDefault, true);
  assert.equal(Object.hasOwn(address, 'customer'), false);
  assert.equal(Object.hasOwn(address, 'token'), false);

  const order = presentAdminCustomerOrder({
    _id: new mongoose.Types.ObjectId(),
    reference: 'ZV-TEST-ORDER',
    status: 'placed',
    subtotal: 50,
    currency: 'USD',
    createdAt: new Date(),
    items: [{ quantity: 2 }],
    contactEmail: 'private@example.test',
    idempotencyKey: 'must-not-leak',
  });
  assert.equal(order.itemCount, 2);
  assert.equal(Object.hasOwn(order, 'contactEmail'), false);
  assert.equal(Object.hasOwn(order, 'idempotencyKey'), false);
});
