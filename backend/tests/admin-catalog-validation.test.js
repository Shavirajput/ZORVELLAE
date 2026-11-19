'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { parseListQuery } = require('../controllers/adminCatalog.controller');
const {
  InputValidationError,
  parseCategoryPayload,
  parseProductPayload,
} = require('../validators/adminCatalog');

const categoryId = new mongoose.Types.ObjectId().toString();

function validProduct(overrides = {}) {
  return {
    name: 'Barrier Serum',
    slug: 'barrier-serum',
    description: 'Development copy pending approved content.',
    categoryId,
    currency: 'USD',
    compareAtPrice: '90.00',
    variants: [
      { id: '30ml', label: '30 ml', sku: 'serum-30', price: '68.00' },
      { id: '', label: '50 ml', sku: 'serum-50', price: '82.00' },
    ],
    images: [
      { url: 'https://images.example.test/serum.jpg', alt: 'Serum bottle' },
    ],
    status: 'draft',
    ...overrides,
  };
}

test('product payload normalizes prices and variant identifiers', () => {
  const parsed = parseProductPayload(validProduct());
  assert.equal(parsed.slug, 'barrier-serum');
  assert.equal(parsed.variants[0].price, 68);
  assert.equal(parsed.variants[0].sku, 'SERUM-30');
  assert.equal(parsed.variants[1].id, '');
  assert.equal(parsed.compareAtPrice, 90);
  assert.equal(parsed.purchaseAvailable, undefined);
  assert.equal(parsed.isActive, true);
  assert.equal(parsed.isPublished, false);
});

test('product payload rejects invalid price, duplicate SKU, bad category and unsupported purchase fields', () => {
  assert.throws(
    () => parseProductPayload(validProduct({
      categoryId: 'not-an-object-id',
      variants: [
        { id: 'one', label: 'One', sku: 'shared', price: '5.999' },
        { id: 'two', label: 'Two', sku: 'SHARED', price: '10' },
      ],
      purchaseAvailable: true,
    })),
    (error) => {
      assert.ok(error instanceof InputValidationError);
      const fields = error.errors.map(({ field }) => field);
      assert.ok(fields.includes('categoryId'));
      assert.ok(fields.includes('variants.0.price'));
      assert.ok(fields.includes('variants.1.sku'));
      assert.ok(fields.includes('purchaseAvailable'));
      return true;
    },
  );
});

test('product payload rejects invalid compare-at prices and local image paths', () => {
  assert.throws(
    () => parseProductPayload(validProduct({
      compareAtPrice: '60',
      images: [{ url: '/uploads/image.jpg', alt: 'Local path' }],
    })),
    (error) => {
      const fields = error.errors.map(({ field }) => field);
      assert.ok(fields.includes('compareAtPrice'));
      assert.ok(fields.includes('images.0.url'));
      return true;
    },
  );
});

test('category payload validates slug, sort order, and HTTPS image references', () => {
  const category = parseCategoryPayload({
    name: 'Barrier Care',
    slug: 'barrier-care',
    description: 'Development category.',
    bannerImage: 'https://images.example.test/category.jpg',
    sortOrder: '2',
    status: 'published',
  });
  assert.equal(category.sortOrder, 2);
  assert.equal(category.isActive, true);
  assert.equal(category.isPublished, true);

  assert.throws(
    () => parseCategoryPayload({
      name: 'Bad category',
      slug: 'Invalid Slug',
      bannerImage: 'file:///temporary/banner.png',
      sortOrder: -1,
      status: 'published',
    }),
    (error) => {
      assert.ok(error instanceof InputValidationError);
      assert.ok(error.errors.some(({ field }) => field === 'slug'));
      assert.ok(error.errors.some(({ field }) => field === 'bannerImage'));
      assert.ok(error.errors.some(({ field }) => field === 'sortOrder'));
      return true;
    },
  );
});

test('admin catalog list query validates search, category, status, and pagination inputs', () => {
  const parsed = parseListQuery({
    page: '2',
    limit: '50',
    search: 'serum[',
    status: 'published',
    categoryId,
  }, true);
  assert.deepEqual(parsed, {
    page: 2,
    limit: 50,
    search: 'serum[',
    status: 'published',
    categoryId,
  });

  assert.throws(
    () => parseListQuery({ page: '0', limit: '1000', status: 'deleted' }, true),
    (error) => error instanceof InputValidationError && error.errors.length === 3,
  );
});

test('product model supports per-variant SKU and optional compare-at price', async () => {
  const product = new Product({
    id: 'unit-test-product',
    name: 'Barrier Serum',
    slug: 'unit-test-barrier-serum',
    description: 'Test fixture.',
    category: new mongoose.Types.ObjectId(),
    categoryLabel: 'Serums',
    variants: [{ id: '30ml', label: '30 ml', price: 68, sku: 'SERUM-30' }],
    compareAtPrice: 90,
  });
  await product.validate();
  assert.equal(product.price, 68);
  assert.equal(product.variants[0].sku, 'SERUM-30');
  assert.equal(product.compareAtPrice, 90);

  const category = new Category({
    name: 'Category',
    slug: 'unit-test-category',
  });
  await category.validate();
  assert.equal(category.slug, 'unit-test-category');

  assert.equal(Product.schema.path('slug').options.unique, true);
  assert.equal(Category.schema.path('slug').options.unique, true);
  const skuIndex = Product.schema.indexes().find(([keys]) => keys['variants.sku']);
  assert.equal(skuIndex[1].unique, true);
  assert.deepEqual(skuIndex[1].partialFilterExpression, {
    'variants.sku': { $type: 'string', $gt: '' },
  });
});
