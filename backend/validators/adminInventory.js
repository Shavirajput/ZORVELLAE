'use strict';

const INVENTORY_LOW_STOCK_THRESHOLD = 5;
const inventoryStatuses = new Set([
  'all',
  'in_stock',
  'low_stock',
  'out_of_stock',
  'untracked',
]);
const adjustmentActions = new Set(['set', 'increment', 'decrement']);

class InputValidationError extends Error {
  constructor(errors) {
    super('Please check the provided information.');
    this.name = 'InputValidationError';
    this.errors = errors;
  }
}

class InventoryRuleError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InventoryRuleError';
  }
}

function positiveInteger(value, field, fallback, maximum, errors) {
  if (value === undefined) return fallback;
  if (
    typeof value !== 'string' ||
    !/^[1-9]\d*$/.test(value) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) > maximum
  ) {
    errors.push({
      field,
      message: `${field} must be a positive integer no greater than ${maximum}.`,
    });
    return fallback;
  }
  return Number(value);
}

function parseAdminInventoryListQuery(query) {
  const errors = [];
  const page = positiveInteger(query.page, 'page', 1, 100000, errors);
  const limit = positiveInteger(query.limit, 'limit', 20, 100, errors);
  const search = query.search === undefined ? '' : query.search;
  if (typeof search !== 'string' || search.trim().length > 100) {
    errors.push({
      field: 'search',
      message: 'Search must be 100 characters or fewer.',
    });
  }
  const status = query.status === undefined ? 'all' : query.status;
  if (typeof status !== 'string' || !inventoryStatuses.has(status)) {
    errors.push({ field: 'status', message: 'Choose a supported stock filter.' });
  }
  if (errors.length) throw new InputValidationError(errors);
  return { page, limit, search: search.trim(), status };
}

function parseStockAdjustment(input) {
  const errors = [];
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !== Object.prototype
  ) {
    throw new InputValidationError([
      { field: 'body', message: 'A JSON object is required.' },
    ]);
  }
  for (const key of Object.keys(input)) {
    if (!['action', 'quantity', 'reason'].includes(key)) {
      errors.push({ field: key, message: 'This field cannot be changed here.' });
    }
  }

  const action = input.action;
  if (typeof action !== 'string' || !adjustmentActions.has(action)) {
    errors.push({ field: 'action', message: 'Choose a supported stock adjustment.' });
  }

  const allowZero = action === 'set';
  const quantity = input.quantity;
  const validQuantity =
    typeof quantity === 'number' && Number.isSafeInteger(quantity) ||
    typeof quantity === 'string' && (
      allowZero ? /^(?:0|[1-9]\d*)$/ : /^[1-9]\d*$/
    ).test(quantity.trim()) && Number.isSafeInteger(Number(quantity));
  if (
    !validQuantity ||
    (typeof quantity === 'number' && (quantity < (allowZero ? 0 : 1))) ||
    (typeof quantity === 'string' && Number(quantity) < (allowZero ? 0 : 1))
  ) {
    errors.push({
      field: 'quantity',
      message: allowZero
        ? 'Enter a non-negative whole stock quantity.'
        : 'Enter a positive whole adjustment amount.',
    });
  }

  if (typeof input.reason !== 'string') {
    errors.push({ field: 'reason', message: 'A reason is required.' });
  } else if (input.reason.trim().length < 3 || input.reason.trim().length > 500) {
    errors.push({
      field: 'reason',
      message: 'Reason must be between 3 and 500 characters.',
    });
  }

  if (errors.length) throw new InputValidationError(errors);
  return { action, quantity: Number(quantity), reason: input.reason.trim() };
}

function inventoryStatus(quantity) {
  if (!Number.isSafeInteger(quantity) || quantity < 0) return 'untracked';
  if (quantity === 0) return 'out_of_stock';
  if (quantity <= INVENTORY_LOW_STOCK_THRESHOLD) return 'low_stock';
  return 'in_stock';
}

function calculateStockAdjustment(previousQuantity, adjustment) {
  if (adjustment.action === 'set') {
    return {
      previousQuantity,
      newQuantity: adjustment.quantity,
      adjustmentAmount: adjustment.quantity,
    };
  }
  if (!Number.isSafeInteger(previousQuantity) || previousQuantity < 0) {
    throw new InventoryRuleError(
      'Set a verified physical stock count before increasing or decreasing stock.',
    );
  }
  const newQuantity = adjustment.action === 'increment'
    ? previousQuantity + adjustment.quantity
    : previousQuantity - adjustment.quantity;
  if (!Number.isSafeInteger(newQuantity)) {
    throw new InventoryRuleError('The resulting stock quantity is too large.');
  }
  if (newQuantity < 0) {
    throw new InventoryRuleError('Stock quantity cannot be negative.');
  }
  return {
    previousQuantity,
    newQuantity,
    adjustmentAmount: adjustment.quantity,
  };
}

module.exports = {
  INVENTORY_LOW_STOCK_THRESHOLD,
  InputValidationError,
  InventoryRuleError,
  calculateStockAdjustment,
  inventoryStatus,
  parseAdminInventoryListQuery,
  parseStockAdjustment,
};
