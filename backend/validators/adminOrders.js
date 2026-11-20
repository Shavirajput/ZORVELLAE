'use strict';

const ORDER_STATUSES = Object.freeze([
  'placed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

const ORDER_TRANSITIONS = Object.freeze({
  placed: Object.freeze(['processing', 'cancelled']),
  processing: Object.freeze(['shipped', 'cancelled']),
  shipped: Object.freeze(['delivered']),
  delivered: Object.freeze([]),
  cancelled: Object.freeze([]),
});

class InputValidationError extends Error {
  constructor(errors) {
    super('Please check the provided order information.');
    this.name = 'InputValidationError';
    this.errors = errors;
  }
}

class OrderStatusTransitionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OrderStatusTransitionError';
    this.statusCode = 409;
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

function parseDate(value, field, errors) {
  if (value === undefined) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    errors.push({ field, message: `${field} must use YYYY-MM-DD format.` });
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    errors.push({ field, message: `${field} must be a valid calendar date.` });
    return null;
  }
  if (field === 'to') date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

function parseAdminOrderListQuery(query) {
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
  if (
    typeof status !== 'string' ||
    (status !== 'all' && !ORDER_STATUSES.includes(status))
  ) {
    errors.push({ field: 'status', message: 'Choose a supported order status.' });
  }

  const from = parseDate(query.from, 'from', errors);
  const to = parseDate(query.to, 'to', errors);
  if (query.from && query.to && query.from > query.to) {
    errors.push({ field: 'from', message: 'The start date must not be after the end date.' });
  }

  if (errors.length > 0) throw new InputValidationError(errors);
  return { page, limit, search: search.trim(), status, from, to };
}

function parseAdminOrderStatusUpdate(body) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new InputValidationError([
      { field: 'body', message: 'An order status update is required.' },
    ]);
  }

  const fields = Object.keys(body);
  if (fields.length !== 1 || fields[0] !== 'status') {
    errors.push({
      field: 'body',
      message: 'Only the order status may be updated.',
    });
  }
  if (typeof body.status !== 'string' || !ORDER_STATUSES.includes(body.status)) {
    errors.push({
      field: 'status',
      message: 'Choose a supported order status.',
    });
  }

  if (errors.length > 0) throw new InputValidationError(errors);
  return body.status;
}

function allowedOrderStatusTransitions(status) {
  return [...(ORDER_TRANSITIONS[status] || [])];
}

function validateOrderStatusTransition(currentStatus, nextStatus) {
  if (!allowedOrderStatusTransitions(currentStatus).includes(nextStatus)) {
    throw new OrderStatusTransitionError(
      `An order cannot move from ${currentStatus} to ${nextStatus}.`,
    );
  }
}

module.exports = {
  InputValidationError,
  ORDER_STATUSES,
  OrderStatusTransitionError,
  allowedOrderStatusTransitions,
  parseAdminOrderListQuery,
  parseAdminOrderStatusUpdate,
  validateOrderStatusTransition,
};
