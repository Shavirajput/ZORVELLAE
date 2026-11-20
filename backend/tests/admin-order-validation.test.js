'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const {
  InputValidationError,
  OrderStatusTransitionError,
  allowedOrderStatusTransitions,
  parseAdminOrderListQuery,
  parseAdminOrderStatusUpdate,
  validateOrderStatusTransition,
} = require('../validators/adminOrders');

test('admin order list query applies defaults and inclusive date boundaries', () => {
  const parsed = parseAdminOrderListQuery({
    page: '2',
    limit: '50',
    search: '  ZV-20261119  ',
    status: 'processing',
    from: '2026-11-01',
    to: '2026-11-19',
  });

  assert.deepEqual(parsed, {
    page: 2,
    limit: 50,
    search: 'ZV-20261119',
    status: 'processing',
    from: new Date('2026-11-01T00:00:00.000Z'),
    to: new Date('2026-11-20T00:00:00.000Z'),
  });
  assert.deepEqual(parseAdminOrderListQuery({}), {
    page: 1,
    limit: 20,
    search: '',
    status: 'all',
    from: null,
    to: null,
  });
});

test('admin order list query rejects malformed filters and date ranges', () => {
  assert.throws(
    () => parseAdminOrderListQuery({
      page: '0',
      limit: '101',
      search: 'x'.repeat(101),
      status: 'paid',
      from: '2026-02-30',
      to: '2026-02-31',
    }),
    (error) => {
      assert.ok(error instanceof InputValidationError);
      const fields = error.errors.map(({ field }) => field);
      assert.ok(fields.includes('page'));
      assert.ok(fields.includes('limit'));
      assert.ok(fields.includes('search'));
      assert.ok(fields.includes('status'));
      assert.ok(fields.includes('from'));
      assert.ok(fields.includes('to'));
      return true;
    },
  );

  assert.throws(
    () => parseAdminOrderListQuery({
      from: '2026-02-02',
      to: '2026-02-01',
    }),
    (error) => error instanceof InputValidationError &&
      error.errors.some(({ field }) => field === 'from'),
  );
});

test('admin status update accepts only a supported status field', () => {
  assert.equal(parseAdminOrderStatusUpdate({ status: 'processing' }), 'processing');
  assert.throws(
    () => parseAdminOrderStatusUpdate({ status: 'paid' }),
    InputValidationError,
  );
  assert.throws(
    () => parseAdminOrderStatusUpdate({
      status: 'processing',
      subtotal: 0,
      shippingAddress: {},
    }),
    (error) => error instanceof InputValidationError &&
      error.errors.some(({ field }) => field === 'body'),
  );
});

test('order status transitions advance only through permitted states', () => {
  assert.deepEqual(allowedOrderStatusTransitions('placed'), ['processing', 'cancelled']);
  assert.deepEqual(allowedOrderStatusTransitions('processing'), ['shipped', 'cancelled']);
  assert.deepEqual(allowedOrderStatusTransitions('shipped'), ['delivered']);
  assert.deepEqual(allowedOrderStatusTransitions('delivered'), []);
  assert.deepEqual(allowedOrderStatusTransitions('cancelled'), []);

  assert.doesNotThrow(() => validateOrderStatusTransition('placed', 'processing'));
  assert.doesNotThrow(() => validateOrderStatusTransition('processing', 'cancelled'));
  assert.throws(
    () => validateOrderStatusTransition('placed', 'delivered'),
    OrderStatusTransitionError,
  );
  assert.throws(
    () => validateOrderStatusTransition('delivered', 'processing'),
    OrderStatusTransitionError,
  );
  assert.throws(
    () => validateOrderStatusTransition('placed', 'placed'),
    OrderStatusTransitionError,
  );
});

test('order history can reference an admin without making order snapshots mutable', async () => {
  const adminId = new mongoose.Types.ObjectId();
  const order = new Order({
    customer: new mongoose.Types.ObjectId(),
    reference: 'ZV-20261119-ABCDEF0123',
    idempotencyKey: 'test-idempotency-key',
    contactEmail: 'customer@example.test',
    items: [{
      productId: 'test-product',
      productSlug: 'test-product',
      productName: 'Test Product',
      variantId: 'default',
      variantLabel: 'Default',
      quantity: 1,
      unitPrice: 10,
      lineTotal: 10,
    }],
    shippingAddress: {
      firstName: 'Test',
      lastName: 'Customer',
      addressLine1: '1 Test Street',
      city: 'Test City',
      region: 'Test Region',
      postalCode: '00000',
      country: 'Test Country',
    },
    currency: 'USD',
    subtotal: 10,
  });

  assert.equal(
    Order.schema.path('statusHistory').schema.path('changedBy').options.ref,
    'User',
  );
  assert.equal(Order.schema.path('items').options.immutable, true);
  assert.equal(Order.schema.path('shippingAddress').options.immutable, true);
  assert.equal(Order.schema.path('subtotal').options.immutable, true);
  order.statusHistory.push({
    status: 'processing',
    changedAt: new Date(),
    changedBy: adminId,
  });
  await assert.doesNotReject(() => order.validate());
  assert.equal(order.statusHistory[1].changedBy.toString(), adminId.toString());
});
