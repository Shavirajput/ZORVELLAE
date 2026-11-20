'use strict';

const { normalizeHttpsImageReference } = require('../services/imageStorage');

class InputValidationError extends Error {
  constructor(errors) {
    super('Please check the provided information.');
    this.name = 'InputValidationError';
    this.errors = errors;
  }
}

function isRecord(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype,
  );
}

function readRecord(value, field, allowedKeys, errors) {
  if (!isRecord(value)) {
    errors.push({ field, message: 'A JSON object is required.' });
    return {};
  }
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      errors.push({
        field: `${field}.${key}`,
        message: 'This field is not supported.',
      });
    }
  }
  return value;
}

function readText(value, field, max, errors) {
  if (typeof value !== 'string') {
    errors.push({ field, message: 'This field must be text.' });
    return '';
  }
  const text = value.trim();
  if (text.length > max) {
    errors.push({
      field,
      message: `This field must be ${max} characters or fewer.`,
    });
  }
  return text;
}

function readBoolean(value, field, errors, nullable = false) {
  if (nullable && value === null) return null;
  if (typeof value !== 'boolean') {
    errors.push({
      field,
      message: nullable
        ? 'Choose enabled, disabled, or unconfigured.'
        : 'Choose enabled or disabled.',
    });
    return nullable ? null : false;
  }
  return value;
}

function readAmount(value, field, errors, maximum = null) {
  if (value === null || value === '') return null;
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && !/^\d+(?:\.\d{1,2})?$/.test(value.trim()))
  ) {
    errors.push({
      field,
      message: 'Enter a non-negative amount with at most two decimals, or leave it blank.',
    });
    return null;
  }
  const amount = Number(value);
  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    (maximum !== null && amount > maximum) ||
    Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-8
  ) {
    errors.push({
      field,
      message: `Enter a non-negative amount with at most two decimals${maximum === null ? '' : `, no greater than ${maximum}`}.`,
    });
    return null;
  }
  return Number(amount.toFixed(2));
}

function readLogoUrl(value, errors) {
  if (value === '') return '';
  try {
    return normalizeHttpsImageReference(value);
  } catch (error) {
    errors.push({ field: 'storeLogoUrl', message: error.message });
    return '';
  }
}

function parseAdminStoreSettings(input) {
  const errors = [];
  const settings = readRecord(
    input,
    'body',
    [
      'storeName',
      'storeLogoUrl',
      'supportEmail',
      'supportPhone',
      'storeAddress',
      'currencyCode',
      'taxConfiguration',
      'shippingConfiguration',
      'checkoutConfiguration',
    ],
    errors,
  );
  const storeName = readText(settings.storeName, 'storeName', 120, errors);
  const storeLogoUrl = readLogoUrl(
    readText(settings.storeLogoUrl, 'storeLogoUrl', 2048, errors),
    errors,
  );
  const supportEmail = readText(settings.supportEmail, 'supportEmail', 254, errors)
    .toLowerCase();
  if (
    supportEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)
  ) {
    errors.push({ field: 'supportEmail', message: 'Enter a valid support email.' });
  }

  const supportPhone = readText(settings.supportPhone, 'supportPhone', 30, errors);
  if (
    supportPhone &&
    (!/^[+()0-9 .-]+$/.test(supportPhone) ||
      (supportPhone.match(/\d/g) || []).length < 7 ||
      (supportPhone.match(/\d/g) || []).length > 15)
  ) {
    errors.push({
      field: 'supportPhone',
      message: 'Enter a phone number containing 7 to 15 digits.',
    });
  }

  const address = readRecord(
    settings.storeAddress,
    'storeAddress',
    ['addressLine1', 'addressLine2', 'city', 'region', 'postalCode', 'country'],
    errors,
  );
  const storeAddress = {
    addressLine1: readText(address.addressLine1, 'storeAddress.addressLine1', 160, errors),
    addressLine2: readText(address.addressLine2, 'storeAddress.addressLine2', 160, errors),
    city: readText(address.city, 'storeAddress.city', 100, errors),
    region: readText(address.region, 'storeAddress.region', 100, errors),
    postalCode: readText(address.postalCode, 'storeAddress.postalCode', 32, errors),
    country: readText(address.country, 'storeAddress.country', 100, errors),
  };

  const currencyCode = readText(settings.currencyCode, 'currencyCode', 3, errors)
    .toUpperCase();
  if (currencyCode && !/^[A-Z]{3}$/.test(currencyCode)) {
    errors.push({
      field: 'currencyCode',
      message: 'Use a three-letter currency code or leave it unconfigured.',
    });
  }

  const tax = readRecord(
    settings.taxConfiguration,
    'taxConfiguration',
    ['enabled', 'ratePercent', 'isInclusive'],
    errors,
  );
  const taxConfiguration = {
    enabled: readBoolean(tax.enabled, 'taxConfiguration.enabled', errors),
    ratePercent: readAmount(
      tax.ratePercent,
      'taxConfiguration.ratePercent',
      errors,
      100,
    ),
    isInclusive: readBoolean(
      tax.isInclusive,
      'taxConfiguration.isInclusive',
      errors,
    ),
  };
  if (taxConfiguration.enabled && taxConfiguration.ratePercent === null) {
    errors.push({
      field: 'taxConfiguration.ratePercent',
      message: 'Enter a tax rate before enabling tax configuration.',
    });
  }

  const shipping = readRecord(
    settings.shippingConfiguration,
    'shippingConfiguration',
    ['enabled', 'flatRate'],
    errors,
  );
  const shippingConfiguration = {
    enabled: readBoolean(
      shipping.enabled,
      'shippingConfiguration.enabled',
      errors,
    ),
    flatRate: readAmount(
      shipping.flatRate,
      'shippingConfiguration.flatRate',
      errors,
    ),
  };
  if (shippingConfiguration.enabled && shippingConfiguration.flatRate === null) {
    errors.push({
      field: 'shippingConfiguration.flatRate',
      message: 'Enter a shipping amount before enabling shipping configuration.',
    });
  }

  const checkout = readRecord(
    settings.checkoutConfiguration,
    'checkoutConfiguration',
    ['enabled', 'allowGuestCheckout'],
    errors,
  );
  const checkoutConfiguration = {
    enabled: readBoolean(
      checkout.enabled,
      'checkoutConfiguration.enabled',
      errors,
      true,
    ),
    allowGuestCheckout: readBoolean(
      checkout.allowGuestCheckout,
      'checkoutConfiguration.allowGuestCheckout',
      errors,
      true,
    ),
  };

  if (errors.length) throw new InputValidationError(errors);
  return {
    storeName,
    storeLogoUrl,
    supportEmail,
    supportPhone,
    storeAddress,
    currencyCode,
    taxConfiguration,
    shippingConfiguration,
    checkoutConfiguration,
  };
}

module.exports = {
  InputValidationError,
  parseAdminStoreSettings,
};
