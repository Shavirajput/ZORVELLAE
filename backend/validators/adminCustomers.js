'use strict';

class InputValidationError extends Error {
  constructor(errors) {
    super('Please check the provided customer query.');
    this.name = 'InputValidationError';
    this.errors = errors;
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

function parseAdminCustomerListQuery(query = {}) {
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
  if (errors.length > 0) throw new InputValidationError(errors);
  return { page, limit, search: search.trim() };
}

function parseAdminCustomerHistoryQuery(query = {}) {
  const errors = [];
  const page = positiveInteger(query.ordersPage, 'ordersPage', 1, 100000, errors);
  const limit = positiveInteger(query.ordersLimit, 'ordersLimit', 10, 50, errors);
  if (errors.length > 0) throw new InputValidationError(errors);
  return { page, limit };
}

module.exports = {
  InputValidationError,
  parseAdminCustomerHistoryQuery,
  parseAdminCustomerListQuery,
};
