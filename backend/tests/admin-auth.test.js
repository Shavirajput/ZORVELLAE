'use strict';

const assert = require('node:assert/strict');
const crypto = require('crypto');
const http = require('http');
const test = require('node:test');

process.env.NODE_ENV = 'test';
process.env.JWT_ADMIN_SECRET =
  process.env.JWT_ADMIN_SECRET || crypto.randomBytes(64).toString('hex');
process.env.JWT_SECRET =
  process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const adminRoutes = require('../routes/admin.routes');
const { adminOnly } = require('../middleware/auth');
const {
  createAdminSession,
  createSession,
  getAdminAuthConfiguration,
  setAdminSessionCookie,
} = require('../config/security');

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);
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

function request(path, cookie, method = 'GET') {
  return fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    method,
    headers: cookie ? { cookie } : {},
  });
}

test('new accounts default to customer and reject unknown roles', async () => {
  const customer = new User({
    name: 'Customer',
    email: 'customer@example.test',
    passwordHash: 'already-hashed',
  });
  assert.equal(customer.role, 'customer');
  await assert.doesNotReject(customer.validate());

  const invalidRole = new User({
    name: 'Invalid',
    email: 'invalid@example.test',
    passwordHash: 'already-hashed',
    role: 'owner',
  });
  await assert.rejects(invalidRole.validate(), { name: 'ValidationError' });
});

test('adminOnly rejects missing and customer roles', () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let nextCalled = false;
  adminOnly({ user: { role: 'admin' } }, response, () => {
    nextCalled = true;
  });
  assert.equal(response.statusCode, 403);
  assert.equal(nextCalled, false);

  const adminResponse = { ...response, body: null };
  adminOnly({ admin: { role: 'admin' } }, adminResponse, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});

test('admin and customer tokens use separate signing keys and cookie scope', () => {
  const userId = '65a000000000000000000001';
  const adminSession = createAdminSession(userId);
  const customerSession = createSession(userId);
  assert.ok(adminSession);
  assert.ok(customerSession);
  assert.equal(jwt.verify(adminSession.token, process.env.JWT_ADMIN_SECRET).typ, 'admin');
  assert.equal(jwt.verify(customerSession.token, process.env.JWT_SECRET).typ, 'customer');

  const cookie = {};
  setAdminSessionCookie({
    cookie(name, value, options) {
      cookie.name = name;
      cookie.value = value;
      cookie.options = options;
    },
  }, adminSession);
  assert.equal(cookie.name, 'zorvellae_admin_session');
  assert.equal(cookie.options.httpOnly, true);
  assert.equal(cookie.options.path, '/api/admin');

  const originalSecret = process.env.JWT_ADMIN_SECRET;
  process.env.JWT_ADMIN_SECRET = process.env.JWT_SECRET;
  assert.equal(getAdminAuthConfiguration(), null);
  process.env.JWT_ADMIN_SECRET = originalSecret;
});

test('protected admin endpoints reject unauthenticated and customer sessions', async () => {
  for (const route of ['/dashboard', '/auth/me']) {
    const response = await request(`/api/admin${route}`);
    assert.equal(response.status, 401, `${route} should require an admin session`);
  }

  const customerCookie = await request(
    '/api/admin/dashboard',
    'zorvellae_session=customer-session',
  );
  assert.equal(customerCookie.status, 401);

  const customerToken = jwt.sign(
    { sub: '65a000000000000000000001', typ: 'customer' },
    process.env.JWT_ADMIN_SECRET,
    { algorithm: 'HS256' },
  );
  const customerClaim = await request(
    '/api/admin/dashboard',
    `zorvellae_admin_session=${customerToken}`,
  );
  assert.equal(customerClaim.status, 401);

  const adminToken = jwt.sign(
    { sub: '65a000000000000000000001', typ: 'admin' },
    process.env.JWT_ADMIN_SECRET,
    { algorithm: 'HS256' },
  );
  const unverifiedAdmin = await request(
    '/api/admin/dashboard',
    `zorvellae_admin_session=${adminToken}`,
  );
  assert.equal(unverifiedAdmin.status, 503);
});

test('protected admin API namespace rejects unlisted routes before dispatch', async () => {
  const response = await request('/api/admin/not-implemented');
  assert.equal(response.status, 401);
});

test('all product and category management methods require an admin session', async () => {
  const recordId = '65a000000000000000000001';
  const protectedRequests = [
    ['GET', '/api/admin/products'],
    ['POST', '/api/admin/products'],
    ['GET', `/api/admin/products/${recordId}`],
    ['PUT', `/api/admin/products/${recordId}`],
    ['DELETE', `/api/admin/products/${recordId}`],
    ['GET', '/api/admin/categories'],
    ['POST', '/api/admin/categories'],
    ['GET', `/api/admin/categories/${recordId}`],
    ['PUT', `/api/admin/categories/${recordId}`],
    ['DELETE', `/api/admin/categories/${recordId}`],
  ];

  for (const [method, path] of protectedRequests) {
    const response = await request(path, undefined, method);
    assert.equal(response.status, 401, `${method} ${path} should require an admin session`);
    const customerResponse = await request(
      path,
      'zorvellae_session=customer-session',
      method,
    );
    assert.equal(
      customerResponse.status,
      401,
      `${method} ${path} should reject customer sessions`,
    );
  }
});
