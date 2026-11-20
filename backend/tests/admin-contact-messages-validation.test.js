'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const ContactMessage = require('../models/ContactMessage');
const {
  InputValidationError,
  parseAdminContactMessageListQuery,
  parseAdminContactMessageStatus,
} = require('../validators/adminContent');

test('contact message list supports bounded search and status pagination', () => {
  assert.deepEqual(parseAdminContactMessageListQuery({
    search: '  support@example.test ',
    status: 'unread',
    page: '3',
    limit: '10',
  }), {
    page: 3,
    limit: 10,
    search: 'support@example.test',
    status: 'unread',
  });
  assert.throws(
    () => parseAdminContactMessageListQuery({ status: 'deleted' }),
    InputValidationError,
  );
});

test('message status updates allow only read or resolved with no extra fields', () => {
  assert.equal(parseAdminContactMessageStatus({ status: 'read' }), 'read');
  assert.equal(parseAdminContactMessageStatus({ status: 'resolved' }), 'resolved');
  assert.throws(
    () => parseAdminContactMessageStatus({ status: 'unread' }),
    InputValidationError,
  );
  assert.throws(
    () => parseAdminContactMessageStatus({ status: 'read', message: 'modified' }),
    InputValidationError,
  );
});

test('contact message records contain no auth fields and preserve sender fields', async () => {
  const message = new ContactMessage({
    name: 'Customer',
    email: 'CUSTOMER@example.test',
    subject: 'Question',
    message: 'Message content',
  });
  await assert.doesNotReject(message.validate());
  assert.equal(message.email, 'customer@example.test');
  assert.equal(message.status, 'unread');
  assert.equal(ContactMessage.schema.path('message').options.immutable, true);
  assert.equal(ContactMessage.schema.path('passwordHash'), undefined);
  assert.equal(ContactMessage.schema.path('token'), undefined);

  const invalidMessage = new ContactMessage({
    name: 'Customer',
    email: 'not-an-email',
    subject: 'Question',
    message: 'Message content',
  });
  await assert.rejects(invalidMessage.validate(), { name: 'ValidationError' });
});
