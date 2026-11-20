'use strict';

const CONTENT_PAGE_KEYS = Object.freeze(['about-us', 'our-science']);
const CONTENT_STATUSES = new Set(['draft', 'published']);
const CONTACT_STATUSES = new Set(['all', 'unread', 'read', 'resolved']);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

class InputValidationError extends Error {
  constructor(errors) {
    super('Please check the provided content.');
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

function requireRecord(value, field, allowed, errors) {
  if (!isRecord(value)) {
    errors.push({ field, message: 'A JSON object is required.' });
    return {};
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      errors.push({ field: `${field}.${key}`, message: 'This field is not supported.' });
    }
  }
  return value;
}

function readText(value, field, options, errors) {
  const { required = false, min = 0, max = 10000 } = options;
  if (value === undefined && !required) return '';
  if (typeof value !== 'string') {
    errors.push({
      field,
      message: required ? 'This field is required.' : 'This field must be text.',
    });
    return '';
  }
  const text = value.trim();
  if ((required && text.length === 0) || text.length < min || text.length > max) {
    errors.push({
      field,
      message: required && text.length === 0
        ? 'This field is required.'
        : `This field must be between ${min} and ${max} characters.`,
    });
  }
  return text;
}

function readStatus(value, errors, fallback = 'draft') {
  const status = value === undefined ? fallback : value;
  if (typeof status !== 'string' || !CONTENT_STATUSES.has(status)) {
    errors.push({ field: 'status', message: 'Choose draft or published.' });
    return fallback;
  }
  return status;
}

function positiveInteger(value, field, fallback, maximum, errors) {
  if (value === undefined) return fallback;
  if (
    typeof value !== 'string' ||
    !/^(?:0|[1-9]\d*)$/.test(value) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) > maximum
  ) {
    errors.push({
      field,
      message: `${field} must be a whole number from ${field === 'sortOrder' ? 0 : 1} to ${maximum}.`,
    });
    return fallback;
  }
  return Number(value);
}

function parseInteger(value, field, fallback, maximum, errors) {
  if (value === undefined) return fallback;
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > maximum
  ) {
    errors.push({
      field,
      message: `${field} must be a whole number from 0 to ${maximum}.`,
    });
    return fallback;
  }
  return value;
}

function parseContentPageKey(value) {
  return typeof value === 'string' && CONTENT_PAGE_KEYS.includes(value);
}

function parseAdminContentPage(input) {
  const errors = [];
  const body = requireRecord(input, 'body', ['title', 'introduction', 'sections', 'status'], errors);
  const title = readText(body.title, 'title', { max: 120 }, errors);
  const introduction = readText(
    body.introduction,
    'introduction',
    { max: 10000 },
    errors,
  );
  const status = readStatus(body.status, errors);

  const sections = [];
  if (!Array.isArray(body.sections) || body.sections.length > 30) {
    errors.push({ field: 'sections', message: 'Provide no more than 30 content sections.' });
  } else {
    body.sections.forEach((value, index) => {
      const field = `sections.${index}`;
      const section = requireRecord(value, field, ['heading', 'body'], errors);
      sections.push({
        heading: readText(
          section.heading,
          `${field}.heading`,
          { required: true, min: 1, max: 120 },
          errors,
        ),
        body: readText(
          section.body,
          `${field}.body`,
          { required: true, min: 1, max: 6000 },
          errors,
        ),
      });
    });
  }

  if (
    status === 'published' &&
    (!title || (!introduction && sections.length === 0))
  ) {
    errors.push({
      field: 'status',
      message: 'Add a title and content before publishing this page.',
    });
  }
  if (errors.length) throw new InputValidationError(errors);
  return { title, introduction, sections, status };
}

function parseAdminIngredientListQuery(query = {}) {
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
    (status !== 'all' && !CONTENT_STATUSES.has(status))
  ) {
    errors.push({ field: 'status', message: 'Choose all, draft, or published.' });
  }
  if (errors.length) throw new InputValidationError(errors);
  return { page, limit, search: search.trim(), status };
}

function parseAdminIngredient(input) {
  const errors = [];
  const body = requireRecord(
    input,
    'body',
    ['name', 'inci', 'slug', 'summary', 'monograph', 'sortOrder', 'status'],
    errors,
  );
  const name = readText(body.name, 'name', { required: true, min: 2, max: 120 }, errors);
  const inci = readText(body.inci, 'inci', { max: 160 }, errors);
  const slug = readText(body.slug, 'slug', { required: true, min: 1, max: 120 }, errors)
    .toLowerCase();
  if (slug && !slugPattern.test(slug)) {
    errors.push({
      field: 'slug',
      message: 'Use lowercase letters, numbers, and single hyphens.',
    });
  }
  const summary = readText(body.summary, 'summary', { max: 500 }, errors);
  const monograph = readText(body.monograph, 'monograph', { max: 10000 }, errors);
  const status = readStatus(body.status, errors);
  const sortOrder = parseInteger(body.sortOrder, 'sortOrder', 0, 10000, errors);
  if (status === 'published' && !summary && !monograph) {
    errors.push({
      field: 'status',
      message: 'Add approved monograph content before publishing this ingredient.',
    });
  }
  if (errors.length) throw new InputValidationError(errors);
  return { name, inci, slug, summary, monograph, sortOrder, status };
}

function parseAdminContactMessageListQuery(query = {}) {
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
  if (typeof status !== 'string' || !CONTACT_STATUSES.has(status)) {
    errors.push({
      field: 'status',
      message: 'Choose all, unread, read, or resolved.',
    });
  }
  if (errors.length) throw new InputValidationError(errors);
  return { page, limit, search: search.trim(), status };
}

function parseAdminContactMessageStatus(input) {
  const errors = [];
  const body = requireRecord(input, 'body', ['status'], errors);
  if (!['read', 'resolved'].includes(body.status)) {
    errors.push({
      field: 'status',
      message: 'A contact message can be marked read or resolved.',
    });
  }
  if (errors.length) throw new InputValidationError(errors);
  return body.status;
}

module.exports = {
  CONTENT_PAGE_KEYS,
  InputValidationError,
  parseAdminContactMessageListQuery,
  parseAdminContactMessageStatus,
  parseAdminContentPage,
  parseAdminIngredient,
  parseAdminIngredientListQuery,
  parseContentPageKey,
};
