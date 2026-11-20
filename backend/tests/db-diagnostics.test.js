'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  configurationSummary,
  connectionErrorDetails,
} = require('../config/db');

test('connection diagnostics identify TLS failures without including messages or hosts', () => {
  const tlsError = Object.assign(
    new Error('TLS failure for mongodb+srv://user:secret@private.example'),
    { code: 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR' },
  );
  const networkError = Object.assign(new Error('network error'), {
    name: 'MongoNetworkError',
    cause: tlsError,
  });
  const selectionError = Object.assign(new Error('selection failed'), {
    name: 'MongooseServerSelectionError',
    reason: {
      servers: new Map([['private.example:27017', { error: networkError }]]),
    },
  });

  const details = connectionErrorDetails(selectionError);
  const serialized = JSON.stringify(details);
  assert.equal(details.stage, 'tls-handshake');
  assert.ok(details.errors.some((entry) => entry.code === 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR'));
  assert.equal(serialized.includes('secret'), false);
  assert.equal(serialized.includes('private.example'), false);
  assert.equal(serialized.includes('mongodb+srv'), false);
});

test('configuration summary reports safe metadata, never URI values', () => {
  const summary = configurationSummary(
    'mongodb+srv://user:secret@cluster.example/?retryWrites=true&w=majority',
    'environment',
  );
  const serialized = JSON.stringify(summary);

  assert.equal(summary.scheme, 'mongodb+srv');
  assert.equal(summary.credentialsPresent, true);
  assert.deepEqual(summary.optionNames, ['retryWrites', 'w']);
  assert.equal(summary.database, 'zorvellae');
  assert.equal(summary.tlsVerification, 'strict-default');
  assert.equal(serialized.includes('secret'), false);
  assert.equal(serialized.includes('cluster.example'), false);
});
