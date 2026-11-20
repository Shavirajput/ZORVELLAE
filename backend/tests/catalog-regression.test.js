'use strict';

const assert = require('node:assert/strict');
const http = require('http');
const test = require('node:test');
const express = require('express');
const categoryRoutes = require('../routes/categories.routes');
const productRoutes = require('../routes/products.routes');
const { presentProduct } = require('../controllers/catalog.controller');

const app = express();
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
const server = http.createServer(app);

test.before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
});

test.after(async () => {
  server.closeAllConnections();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

async function get(path) {
  return fetch(`http://127.0.0.1:${server.address().port}${path}`);
}

test('public catalog routes remain reachable without admin credentials', async () => {
  const [products, categories] = await Promise.all([
    get('/api/products?page=1&limit=12'),
    get('/api/categories'),
  ]);
  assert.equal(products.status, 503);
  assert.equal(categories.status, 503);
  assert.equal((await products.json()).success, false);
  assert.equal((await categories.json()).success, false);
});

test('existing public catalog input validation still runs before database access', async () => {
  const invalidProducts = await get('/api/products?page=0');
  const invalidCategory = await get('/api/categories/not_a_valid_slug');
  assert.equal(invalidProducts.status, 400);
  assert.equal(invalidCategory.status, 400);
});

test('public product response keeps private admin SKU metadata out of the catalog contract', () => {
  const product = presentProduct({
    id: 'public-product',
    slug: 'public-product',
    name: 'Public product',
    description: 'Existing public response shape.',
    category: { slug: 'serums', name: 'Serums' },
    images: [],
    price: 40,
    currency: 'USD',
    variants: [{
      id: '30ml',
      label: '30 ml',
      price: 40,
      sku: 'PRIVATE-30',
      stockQuantity: 17,
    }],
  });
  assert.deepEqual(product.variants, [{ id: '30ml', label: '30 ml', price: 40 }]);
  assert.equal(Object.hasOwn(product, 'compareAtPrice'), false);
  assert.equal(Object.hasOwn(product.variants[0], 'stockQuantity'), false);
});
