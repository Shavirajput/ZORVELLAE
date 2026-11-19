'use strict';

const mongoose = require('mongoose');
const { normalizeHttpsImageReference } = require('../services/imageStorage');

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const productStatuses = new Set(['draft', 'published', 'inactive']);
const categoryStatuses = new Set(['draft', 'published', 'inactive']);

class InputValidationError extends Error {
  constructor(errors) {
    super('Please check the provided information.');
    this.name = 'InputValidationError';
    this.errors = errors;
  }
}

function requireRecord(input, allowedKeys, errors) {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !== Object.prototype
  ) {
    errors.push({ field: 'body', message: 'A JSON object is required.' });
    return false;
  }

  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) {
      errors.push({ field: key, message: 'This field cannot be changed here.' });
    }
  }
  return true;
}

function readText(input, field, options, errors) {
  const { required = true, max = 5000, min = 0, lowercase = false } = options;
  if (input === undefined || input === null) {
    if (required) errors.push({ field, message: 'This field is required.' });
    return '';
  }
  if (typeof input !== 'string') {
    errors.push({ field, message: 'This field must be text.' });
    return '';
  }

  const value = input.trim();
  if (required && value.length === 0) {
    errors.push({ field, message: 'This field is required.' });
  } else if (value.length < min || value.length > max) {
    errors.push({
      field,
      message: `This field must be between ${min} and ${max} characters.`,
    });
  }
  return lowercase ? value.toLowerCase() : value;
}

function readSlug(input, errors) {
  const slug = readText(input, 'slug', { max: 120, min: 1 }, errors).toLowerCase();
  if (slug && !slugPattern.test(slug)) {
    errors.push({
      field: 'slug',
      message: 'Use lowercase letters, numbers, and single hyphens.',
    });
  }
  return slug;
}

function readStatus(input, allowed, errors) {
  const status = input === undefined ? 'draft' : input;
  if (typeof status !== 'string' || !allowed.has(status)) {
    errors.push({ field: 'status', message: 'Choose a supported status.' });
    return 'draft';
  }
  return status;
}

function statusFields(status) {
  return {
    isActive: status !== 'inactive',
    isPublished: status === 'published',
  };
}

function readAmount(input, field, errors, required = true) {
  if (input === '' || input === null || input === undefined) {
    if (required) errors.push({ field, message: 'A price is required.' });
    return null;
  }

  if (
    (typeof input !== 'number' && typeof input !== 'string') ||
    (typeof input === 'string' && !/^\d+(?:\.\d{1,2})?$/.test(input.trim()))
  ) {
    errors.push({ field, message: 'Enter a valid amount with at most two decimals.' });
    return null;
  }

  const amount = Number(input);
  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-8
  ) {
    errors.push({ field, message: 'Enter a non-negative amount with at most two decimals.' });
    return null;
  }
  return Number(amount.toFixed(2));
}

function readImageUrl(input, field, errors, optional = false) {
  if (optional && (input === undefined || input === null || input === '')) return '';
  try {
    return normalizeHttpsImageReference(input);
  } catch (error) {
    errors.push({ field, message: error.message });
    return '';
  }
}

function parseProductPayload(input) {
  const errors = [];
  const allowed = new Set([
    'name',
    'slug',
    'description',
    'categoryId',
    'currency',
    'compareAtPrice',
    'variants',
    'images',
    'status',
  ]);
  if (!requireRecord(input, allowed, errors)) throw new InputValidationError(errors);

  const name = readText(input.name, 'name', { max: 120, min: 2 }, errors);
  const slug = readSlug(input.slug, errors);
  const description = readText(
    input.description,
    'description',
    { max: 10000, min: 1 },
    errors,
  );
  const categoryId = readText(input.categoryId, 'categoryId', { max: 24, min: 1 }, errors);
  if (categoryId && !mongoose.isValidObjectId(categoryId)) {
    errors.push({ field: 'categoryId', message: 'Choose an existing category.' });
  }

  const currency = readText(
    input.currency,
    'currency',
    { max: 3, min: 3, lowercase: true },
    errors,
  ).toUpperCase();
  if (currency && !/^[A-Z]{3}$/.test(currency)) {
    errors.push({ field: 'currency', message: 'Use a three-letter currency code.' });
  }

  const status = readStatus(input.status, productStatuses, errors);
  const compareAtPrice = readAmount(input.compareAtPrice, 'compareAtPrice', errors, false);

  const variants = [];
  const variantIds = new Set();
  const skus = new Set();
  if (!Array.isArray(input.variants) || input.variants.length < 1 || input.variants.length > 30) {
    errors.push({ field: 'variants', message: 'Add between 1 and 30 variants.' });
  } else {
    input.variants.forEach((variant, index) => {
      const field = `variants.${index}`;
      if (!variant || typeof variant !== 'object' || Array.isArray(variant)) {
        errors.push({ field, message: 'Variant details are required.' });
        return;
      }
      for (const key of Object.keys(variant)) {
        if (!['id', 'label', 'sku', 'price'].includes(key)) {
          errors.push({ field: `${field}.${key}`, message: 'This variant field is not supported.' });
        }
      }

      const id = readText(variant.id, `${field}.id`, { required: false, max: 80 }, errors);
      if (id && variantIds.has(id)) {
        errors.push({ field: `${field}.id`, message: 'Variant identifiers must be unique.' });
      }
      if (id) variantIds.add(id);

      const label = readText(variant.label, `${field}.label`, { max: 80, min: 1 }, errors);
      const sku = readText(variant.sku, `${field}.sku`, { required: false, max: 64 }, errors)
        .toUpperCase();
      if (sku && !/^[A-Z0-9._/-]+$/.test(sku)) {
        errors.push({ field: `${field}.sku`, message: 'Use letters, numbers, dots, slashes, dashes, or underscores.' });
      }
      if (sku && skus.has(sku)) {
        errors.push({ field: `${field}.sku`, message: 'Variant SKUs must be unique within a product.' });
      }
      if (sku) skus.add(sku);

      const price = readAmount(variant.price, `${field}.price`, errors);
      variants.push({ id, label, sku, price });
    });
  }

  let images = [];
  if (input.images === undefined) {
    images = [];
  } else if (!Array.isArray(input.images) || input.images.length > 10) {
    errors.push({ field: 'images', message: 'Add no more than 10 product images.' });
  } else {
    images = input.images.map((image, index) => {
      const field = `images.${index}`;
      if (!image || typeof image !== 'object' || Array.isArray(image)) {
        errors.push({ field, message: 'Image details are required.' });
        return { url: '', alt: '' };
      }
      for (const key of Object.keys(image)) {
        if (!['url', 'alt'].includes(key)) {
          errors.push({ field: `${field}.${key}`, message: 'This image field is not supported.' });
        }
      }
      const url = readImageUrl(image.url, `${field}.url`, errors);
      const alt = readText(image.alt, `${field}.alt`, { max: 200, min: 1 }, errors);
      return { url, alt };
    });
  }

  const prices = variants.map((variant) => variant.price).filter(Number.isFinite);
  if (
    compareAtPrice !== null &&
    prices.length > 0 &&
    compareAtPrice <= Math.min(...prices)
  ) {
    errors.push({
      field: 'compareAtPrice',
      message: 'Compare-at price must be greater than the lowest variant price.',
    });
  }

  if (errors.length > 0) throw new InputValidationError(errors);
  return {
    name,
    slug,
    description,
    categoryId,
    currency,
    compareAtPrice,
    variants,
    images,
    status,
    ...statusFields(status),
  };
}

function parseCategoryPayload(input) {
  const errors = [];
  const allowed = new Set([
    'name',
    'slug',
    'description',
    'bannerImage',
    'sortOrder',
    'status',
  ]);
  if (!requireRecord(input, allowed, errors)) throw new InputValidationError(errors);

  const name = readText(input.name, 'name', { max: 100, min: 2 }, errors);
  const slug = readSlug(input.slug, errors);
  const description = readText(
    input.description,
    'description',
    { required: false, max: 2000 },
    errors,
  );
  const bannerImage = readImageUrl(input.bannerImage, 'bannerImage', errors, true);
  let sortOrder = 0;
  if (input.sortOrder !== undefined) {
    if (
      !Number.isInteger(Number(input.sortOrder)) ||
      Number(input.sortOrder) < 0 ||
      Number(input.sortOrder) > 10000
    ) {
      errors.push({ field: 'sortOrder', message: 'Sort order must be a whole number from 0 to 10000.' });
    } else {
      sortOrder = Number(input.sortOrder);
    }
  }
  const status = readStatus(input.status, categoryStatuses, errors);

  if (errors.length > 0) throw new InputValidationError(errors);
  return {
    name,
    slug,
    description,
    bannerImage,
    sortOrder,
    status,
    ...statusFields(status),
  };
}

module.exports = {
  InputValidationError,
  parseCategoryPayload,
  parseProductPayload,
  statusFields,
};
