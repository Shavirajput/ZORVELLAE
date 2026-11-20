'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');
const InventoryAdjustment = require('../models/InventoryAdjustment');
const Product = require('../models/Product');
const {
  INVENTORY_LOW_STOCK_THRESHOLD,
  InputValidationError,
  InventoryRuleError,
  calculateStockAdjustment,
  inventoryStatus,
  parseAdminInventoryListQuery,
  parseStockAdjustment,
} = require('../validators/adminInventory');
const {
  InputValidationError: CatalogInputValidationError,
  parseProductPayload,
} = require('../validators/adminCatalog');

function validProduct(overrides = {}) {
  return {
    name: 'Barrier Serum',
    slug: 'barrier-serum',
    description: 'Development copy pending approved content.',
    categoryId: new mongoose.Types.ObjectId().toString(),
    currency: 'USD',
    variants: [{ id: '30ml', label: '30 ml', sku: 'SERUM-30', price: 68 }],
    status: 'draft',
    ...overrides,
  };
}

test('inventory query validates pagination, search, and stock filters', () => {
  assert.deepEqual(parseAdminInventoryListQuery({
    page: '2',
    limit: '50',
    search: '  serum[  ',
    status: 'low_stock',
  }), {
    page: 2,
    limit: 50,
    search: 'serum[',
    status: 'low_stock',
  });
  assert.deepEqual(parseAdminInventoryListQuery({}), {
    page: 1,
    limit: 20,
    search: '',
    status: 'all',
  });

  assert.throws(
    () => parseAdminInventoryListQuery({
      page: '0',
      limit: '101',
      search: 'x'.repeat(101),
      status: 'unknown',
    }),
    (error) => error instanceof InputValidationError && error.errors.length === 4,
  );
});

test('stock adjustment validates actions, whole quantities, reasons, and extra fields', () => {
  assert.deepEqual(parseStockAdjustment({
    action: 'set',
    quantity: '0',
    reason: 'Physical count confirmed.',
  }), {
    action: 'set',
    quantity: 0,
    reason: 'Physical count confirmed.',
  });
  assert.deepEqual(parseStockAdjustment({
    action: 'decrement',
    quantity: 2,
    reason: 'Damaged units removed.',
  }), {
    action: 'decrement',
    quantity: 2,
    reason: 'Damaged units removed.',
  });

  for (const payload of [
    { action: 'set', quantity: -1, reason: 'Counted' },
    { action: 'increment', quantity: 0, reason: 'Received' },
    { action: 'decrement', quantity: 1.5, reason: 'Damaged' },
    { action: 'set', quantity: 3, reason: '  ' },
    { action: 'set', quantity: 3, reason: 'Counted', adminId: 'spoofed' },
  ]) {
    assert.throws(() => parseStockAdjustment(payload), InputValidationError);
  }
});

test('stock rule preserves untracked quantities until set and prevents negative stock', () => {
  assert.equal(INVENTORY_LOW_STOCK_THRESHOLD, 5);
  assert.equal(inventoryStatus(null), 'untracked');
  assert.equal(inventoryStatus(0), 'out_of_stock');
  assert.equal(inventoryStatus(1), 'low_stock');
  assert.equal(inventoryStatus(5), 'low_stock');
  assert.equal(inventoryStatus(6), 'in_stock');

  assert.deepEqual(calculateStockAdjustment(null, {
    action: 'set',
    quantity: 0,
  }), {
    previousQuantity: null,
    newQuantity: 0,
    adjustmentAmount: 0,
  });
  assert.deepEqual(calculateStockAdjustment(5, {
    action: 'increment',
    quantity: 3,
  }), {
    previousQuantity: 5,
    newQuantity: 8,
    adjustmentAmount: 3,
  });
  assert.deepEqual(calculateStockAdjustment(5, {
    action: 'decrement',
    quantity: 2,
  }), {
    previousQuantity: 5,
    newQuantity: 3,
    adjustmentAmount: 2,
  });
  assert.throws(
    () => calculateStockAdjustment(null, { action: 'increment', quantity: 1 }),
    InventoryRuleError,
  );
  assert.throws(
    () => calculateStockAdjustment(1, { action: 'decrement', quantity: 2 }),
    /cannot be negative/,
  );
});

test('product variants remain untracked by default and catalog payloads cannot set stock', async () => {
  const product = new Product({
    id: 'inventory-test-product',
    name: 'Barrier Serum',
    slug: 'inventory-test-barrier-serum',
    description: 'Test fixture.',
    category: new mongoose.Types.ObjectId(),
    categoryLabel: 'Serums',
    variants: [{ id: '30ml', label: '30 ml', price: 68, sku: 'SERUM-30' }],
  });
  await product.validate();
  assert.equal(product.variants[0].stockQuantity, undefined);

  product.variants[0].stockQuantity = 1.5;
  await assert.rejects(product.validate(), { name: 'ValidationError' });

  assert.throws(
    () => parseProductPayload(validProduct({
      variants: [{
        id: '30ml',
        label: '30 ml',
        sku: 'SERUM-30',
        price: 68,
        stockQuantity: 99,
      }],
    })),
    (error) => error instanceof CatalogInputValidationError &&
      error.errors.some(({ field }) => field === 'variants.0.stockQuantity'),
  );
});

test('inventory adjustment records require an admin, reason, quantities, and audit metadata', async () => {
  const entry = new InventoryAdjustment({
    product: new mongoose.Types.ObjectId(),
    productName: 'Barrier Serum',
    variantId: '30ml',
    variantLabel: '30 ml',
    sku: 'SERUM-30',
    action: 'set',
    previousQuantity: null,
    newQuantity: 12,
    adjustmentAmount: 12,
    reason: 'Physical count confirmed.',
    admin: new mongoose.Types.ObjectId(),
    adjustedAt: new Date(),
  });
  await entry.validate();
  assert.equal(entry.previousQuantity, null);
  assert.ok(entry.adjustedAt instanceof Date);
  assert.equal(InventoryAdjustment.schema.options.timestamps.createdAt, 'adjustedAt');
  assert.equal(InventoryAdjustment.schema.path('admin').options.ref, 'User');
  assert.equal(InventoryAdjustment.schema.path('action').options.immutable, true);
  assert.equal(InventoryAdjustment.schema.path('reason').options.immutable, true);

  entry.reason = '';
  await assert.rejects(entry.validate(), { name: 'ValidationError' });
});
