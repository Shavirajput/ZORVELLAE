'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const StoreSettings = require('../models/StoreSettings');
const { presentStoreSettings } = require('../controllers/adminStoreSettings.controller');
const {
  InputValidationError,
  parseAdminStoreSettings,
} = require('../validators/adminStoreSettings');

function validSettings(overrides = {}) {
  return {
    storeName: '',
    storeLogoUrl: '',
    supportEmail: '',
    supportPhone: '',
    storeAddress: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      region: '',
      postalCode: '',
      country: '',
    },
    currencyCode: '',
    taxConfiguration: {
      enabled: false,
      ratePercent: null,
      isInclusive: false,
    },
    shippingConfiguration: {
      enabled: false,
      flatRate: null,
    },
    checkoutConfiguration: {
      enabled: null,
      allowGuestCheckout: null,
    },
    ...overrides,
  };
}

test('store settings payload validates and normalizes explicit store details', () => {
  const parsed = parseAdminStoreSettings(validSettings({
    storeName: '  Example Store ',
    storeLogoUrl: 'https://images.example.test/logo.png',
    supportEmail: ' HELP@EXAMPLE.TEST ',
    supportPhone: '+1 (415) 555-0123',
    storeAddress: {
      addressLine1: '1 Market Street',
      addressLine2: '',
      city: 'San Francisco',
      region: 'CA',
      postalCode: '94105',
      country: 'US',
    },
    currencyCode: 'usd',
    taxConfiguration: {
      enabled: true,
      ratePercent: '8.25',
      isInclusive: false,
    },
    shippingConfiguration: {
      enabled: true,
      flatRate: '12.50',
    },
    checkoutConfiguration: {
      enabled: true,
      allowGuestCheckout: null,
    },
  }));

  assert.equal(parsed.storeName, 'Example Store');
  assert.equal(parsed.supportEmail, 'help@example.test');
  assert.equal(parsed.currencyCode, 'USD');
  assert.equal(parsed.taxConfiguration.ratePercent, 8.25);
  assert.equal(parsed.shippingConfiguration.flatRate, 12.5);
  assert.equal(parsed.checkoutConfiguration.allowGuestCheckout, null);
});

test('store settings rejects malformed fields, rates, and unapproved secret fields', () => {
  const cases = [
    validSettings({ currencyCode: 'US' }),
    validSettings({ supportEmail: 'not-an-email' }),
    validSettings({ supportPhone: '555' }),
    validSettings({ storeLogoUrl: 'http://example.test/logo.png' }),
    validSettings({
      taxConfiguration: { enabled: true, ratePercent: null, isInclusive: false },
    }),
    validSettings({
      taxConfiguration: { enabled: false, ratePercent: '100.01', isInclusive: false },
    }),
    validSettings({
      shippingConfiguration: { enabled: true, flatRate: null },
    }),
    validSettings({
      shippingConfiguration: { enabled: false, flatRate: '-1' },
    }),
    validSettings({ paymentSecret: 'must-not-be-accepted' }),
    validSettings({
      checkoutConfiguration: {
        enabled: null,
        allowGuestCheckout: null,
        paymentApiKey: 'must-not-be-accepted',
      },
    }),
  ];

  for (const payload of cases) {
    assert.throws(() => parseAdminStoreSettings(payload), InputValidationError);
  }
});

test('StoreSettings uses a fixed singleton ID and safe unconfigured defaults', async () => {
  const settings = new StoreSettings();
  await settings.validate();
  assert.equal(settings._id, 'primary');
  assert.equal(settings.storeName, '');
  assert.equal(settings.currencyCode, '');
  assert.equal(settings.taxConfiguration.enabled, false);
  assert.equal(settings.taxConfiguration.ratePercent, null);
  assert.equal(settings.shippingConfiguration.flatRate, null);
  assert.equal(settings.checkoutConfiguration.enabled, null);
  await assert.rejects(
    new StoreSettings({ _id: 'second-store' }).validate(),
    { name: 'ValidationError' },
  );
  assert.throws(
    () => new StoreSettings({ paymentSecret: 'not-in-schema' }),
    /not in schema/,
  );
});

test('settings response uses a safe projection and excludes secret properties', () => {
  const response = presentStoreSettings({
    storeName: 'Store',
    taxConfiguration: { enabled: false, ratePercent: null, isInclusive: false },
    shippingConfiguration: { enabled: false, flatRate: null },
    checkoutConfiguration: { enabled: null, allowGuestCheckout: null },
    paymentSecret: 'never expose',
    jwtSecret: 'never expose',
  });
  assert.equal(response.storeName, 'Store');
  assert.equal(Object.hasOwn(response, 'paymentSecret'), false);
  assert.equal(Object.hasOwn(response, 'jwtSecret'), false);
  assert.deepEqual(Object.keys(response), [
    'storeName',
    'storeLogoUrl',
    'supportEmail',
    'supportPhone',
    'storeAddress',
    'currencyCode',
    'taxConfiguration',
    'shippingConfiguration',
    'checkoutConfiguration',
    'updatedAt',
  ]);
});
