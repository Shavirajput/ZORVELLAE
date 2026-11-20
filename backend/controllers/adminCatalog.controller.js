'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const {
  buildPagination,
  sendError,
  sendSuccess,
} = require('../utils/apiResponse');
const {
  InputValidationError,
  parseCategoryPayload,
  parseProductPayload,
} = require('../validators/adminCatalog');

const statuses = new Set(['all', 'draft', 'published', 'inactive']);

function databaseReady(res) {
  if (mongoose.connection.readyState === 1) return true;
  sendError(res, 503, 'Catalog management is temporarily unavailable.');
  return false;
}

function logDatabaseError(error) {
  const errorType = typeof error?.name === 'string' ? error.name : 'UnknownError';
  console.error(`Admin catalog request failed (${errorType}); details omitted.`);
}

function databaseError(res, error) {
  if (error?.code === 11000) {
    const field = error.keyPattern?.slug
      ? 'slug'
      : error.keyPattern?.['variants.sku']
        ? 'variants.sku'
        : 'record';
    const message = field === 'slug'
      ? 'That slug is already in use.'
      : field === 'variants.sku'
        ? 'That SKU is already in use.'
        : 'A record with the same unique value already exists.';
    return sendError(res, 409, message, [{ field, message }]);
  }
  if (error?.name === 'ValidationError') {
    const errors = Object.entries(error.errors || {}).map(([field, value]) => ({
      field,
      message: value.message,
    }));
    return sendError(res, 400, 'Please check the provided information.', errors);
  }
  logDatabaseError(error);
  return sendError(res, 503, 'Catalog management is temporarily unavailable.');
}

function validationError(res, error) {
  if (!(error instanceof InputValidationError)) return false;
  sendError(res, 400, error.message, error.errors);
  return true;
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

function parseListQuery(query, includeCategory) {
  const errors = [];
  const page = positiveInteger(query.page, 'page', 1, 100000, errors);
  const limit = positiveInteger(query.limit, 'limit', 20, 100, errors);
  const search = query.search === undefined ? '' : query.search;
  if (typeof search !== 'string' || search.trim().length > 100) {
    errors.push({ field: 'search', message: 'Search must be 100 characters or fewer.' });
  }

  const status = query.status === undefined ? 'all' : query.status;
  if (typeof status !== 'string' || !statuses.has(status)) {
    errors.push({ field: 'status', message: 'Choose a supported status filter.' });
  }

  let categoryId;
  if (includeCategory && query.categoryId !== undefined) {
    if (
      typeof query.categoryId !== 'string' ||
      !mongoose.isValidObjectId(query.categoryId)
    ) {
      errors.push({ field: 'categoryId', message: 'Choose a valid category.' });
    } else {
      categoryId = query.categoryId;
    }
  }

  if (errors.length > 0) throw new InputValidationError(errors);
  return { page, limit, search: search.trim(), status, categoryId };
}

function applyStatusFilter(filter, status) {
  if (status === 'published') {
    filter.isActive = true;
    filter.isPublished = true;
  } else if (status === 'draft') {
    filter.isActive = true;
    filter.isPublished = false;
  } else if (status === 'inactive') {
    filter.isActive = false;
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function presentProduct(product) {
  const category = product.category && typeof product.category === 'object'
    ? product.category
    : null;
  return {
    recordId: product._id.toString(),
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    categoryId: category?._id?.toString() || product.category?.toString() || '',
    categoryName: category?.name || product.categoryLabel || '',
    categorySlug: category?.slug || '',
    images: product.images || [],
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    currency: product.currency,
    variants: product.variants || [],
    status: !product.isActive
      ? 'inactive'
      : product.isPublished
        ? 'published'
        : 'draft',
    isActive: product.isActive,
    isPublished: product.isPublished,
    isDemo: product.isDemo,
    purchaseAvailable: product.isDemo ? false : product.purchaseAvailable,
    updatedAt: product.updatedAt,
  };
}

function presentCategory(category, productCount = undefined) {
  return {
    recordId: category._id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description || '',
    bannerImage: category.bannerImage || '',
    sortOrder: category.sortOrder || 0,
    status: !category.isActive
      ? 'inactive'
      : category.isPublished
        ? 'published'
        : 'draft',
    isActive: category.isActive,
    isPublished: category.isPublished,
    ...(productCount === undefined ? {} : { productCount }),
    updatedAt: category.updatedAt,
  };
}

function parseRecordId(value) {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

async function findProductCategory(categoryId, status) {
  const category = await Category.findById(categoryId)
    .select('name slug isActive isPublished')
    .lean();
  if (!category) {
    return { error: { status: 400, message: 'Choose an existing category.' } };
  }
  if (
    status === 'published' &&
    (!category.isActive || !category.isPublished)
  ) {
    return {
      error: {
        status: 400,
        message: 'Publish the assigned category before publishing this product.',
      },
    };
  }
  return { category };
}

function withVariantIds(variants) {
  return variants.map((variant) => ({
    ...variant,
    id: variant.id || `variant-${crypto.randomUUID()}`,
  }));
}

function productValues(data, category, existingProduct = null) {
  const values = {
    name: data.name,
    slug: data.slug,
    description: data.description,
    category: category._id,
    categoryLabel: category.name,
    currency: data.currency,
    variants: withVariantIds(data.variants).map((variant) => {
      const existingVariant = existingProduct?.variants.find(
        (entry) => entry.id === variant.id,
      );
      return existingVariant?.stockQuantity === undefined
        ? variant
        : { ...variant, stockQuantity: existingVariant.stockQuantity };
    }),
    images: data.images,
    isActive: data.isActive,
    isPublished: data.isPublished,
  };
  if (data.compareAtPrice !== null) {
    values.compareAtPrice = data.compareAtPrice;
  }
  return values;
}

async function findSkuConflict(variants, excludedProductId = null) {
  const skus = variants.map((variant) => variant.sku).filter(Boolean);
  if (skus.length === 0) return false;
  const filter = { 'variants.sku': { $in: skus } };
  if (excludedProductId) filter._id = { $ne: excludedProductId };
  return Boolean(await Product.exists(filter));
}

function categoryValues(data) {
  return {
    name: data.name,
    slug: data.slug,
    description: data.description,
    bannerImage: data.bannerImage,
    sortOrder: data.sortOrder,
    isActive: data.isActive,
    isPublished: data.isPublished,
  };
}

const listAdminProducts = asyncHandler(async (req, res) => {
  let query;
  try {
    query = parseListQuery(req.query, true);
  } catch (error) {
    if (validationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;

  try {
    const filter = {};
    applyStatusFilter(filter, query.status);
    if (query.categoryId) filter.category = query.categoryId;
    if (query.search) {
      const search = new RegExp(escapeRegExp(query.search), 'i');
      filter.$or = [
        { name: search },
        { slug: search },
        { description: search },
        { categoryLabel: search },
      ];
    }

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate({ path: 'category', select: 'name slug' })
        .sort({ updatedAt: -1, _id: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
    ]);

    return sendSuccess(
      res,
      200,
      'Products retrieved.',
      products.map(presentProduct),
      buildPagination(query.page, query.limit, total),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const getAdminProduct = asyncHandler(async (req, res) => {
  if (!parseRecordId(req.params.productId)) {
    return sendError(res, 400, 'A valid product identifier is required.');
  }
  if (!databaseReady(res)) return;

  try {
    const product = await Product.findById(req.params.productId)
      .populate({ path: 'category', select: 'name slug' })
      .lean();
    if (!product) return sendError(res, 404, 'Product not found.');
    return sendSuccess(res, 200, 'Product retrieved.', presentProduct(product));
  } catch (error) {
    return databaseError(res, error);
  }
});

const createAdminProduct = asyncHandler(async (req, res) => {
  let data;
  try {
    data = parseProductPayload(req.body);
  } catch (error) {
    if (validationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;

  try {
    const { category, error } = await findProductCategory(data.categoryId, data.status);
    if (error) return sendError(res, error.status, error.message);
    if (await Product.exists({ slug: data.slug })) {
      return sendError(res, 409, 'That product slug is already in use.', [
        { field: 'slug', message: 'Choose a unique slug.' },
      ]);
    }
    if (await findSkuConflict(data.variants)) {
      return sendError(res, 409, 'That SKU is already in use.', [
        { field: 'variants.sku', message: 'Choose a unique SKU.' },
      ]);
    }

    const values = productValues(data, category);
    const product = await Product.create({
      ...values,
      id: crypto.randomUUID(),
      isDemo: false,
      purchaseAvailable: false,
    });
    const populated = await Product.findById(product._id)
      .populate({ path: 'category', select: 'name slug' })
      .lean();
    return sendSuccess(res, 201, 'Product created.', presentProduct(populated));
  } catch (error) {
    return databaseError(res, error);
  }
});

const updateAdminProduct = asyncHandler(async (req, res) => {
  if (!parseRecordId(req.params.productId)) {
    return sendError(res, 400, 'A valid product identifier is required.');
  }
  let data;
  try {
    data = parseProductPayload(req.body);
  } catch (error) {
    if (validationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;

  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return sendError(res, 404, 'Product not found.');
    const { category, error } = await findProductCategory(data.categoryId, data.status);
    if (error) return sendError(res, error.status, error.message);
    if (
      await Product.exists({
        slug: data.slug,
        _id: { $ne: product._id },
      })
    ) {
      return sendError(res, 409, 'That product slug is already in use.', [
        { field: 'slug', message: 'Choose a unique slug.' },
      ]);
    }
    if (await findSkuConflict(data.variants, product._id)) {
      return sendError(res, 409, 'That SKU is already in use.', [
        { field: 'variants.sku', message: 'Choose a unique SKU.' },
      ]);
    }

    product.set(productValues(data, category, product));
    if (data.compareAtPrice === null) product.set('compareAtPrice', undefined);
    await product.save();
    const updated = await Product.findById(product._id)
      .populate({ path: 'category', select: 'name slug' })
      .lean();
    return sendSuccess(res, 200, 'Product updated.', presentProduct(updated));
  } catch (error) {
    return databaseError(res, error);
  }
});

const deleteAdminProduct = asyncHandler(async (req, res) => {
  if (!parseRecordId(req.params.productId)) {
    return sendError(res, 400, 'A valid product identifier is required.');
  }
  if (!databaseReady(res)) return;

  try {
    const product = await Product.findByIdAndDelete(req.params.productId);
    if (!product) return sendError(res, 404, 'Product not found.');
    return sendSuccess(res, 200, 'Product deleted.', {
      recordId: product._id.toString(),
    });
  } catch (error) {
    return databaseError(res, error);
  }
});

const listAdminCategories = asyncHandler(async (req, res) => {
  let query;
  try {
    query = parseListQuery(req.query, false);
  } catch (error) {
    if (validationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;

  try {
    const filter = {};
    applyStatusFilter(filter, query.status);
    if (query.search) {
      const search = new RegExp(escapeRegExp(query.search), 'i');
      filter.$or = [
        { name: search },
        { slug: search },
        { description: search },
      ];
    }

    const [total, categories] = await Promise.all([
      Category.countDocuments(filter),
      Category.find(filter)
        .sort({ sortOrder: 1, name: 1, _id: 1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
    ]);
    const productCountRows = categories.length
      ? await Product.aggregate([
          {
            $match: {
              category: { $in: categories.map((category) => category._id) },
            },
          },
          { $group: { _id: '$category', count: { $sum: 1 } } },
        ])
      : [];
    const productCounts = new Map(
      productCountRows.map((row) => [row._id.toString(), row.count]),
    );

    return sendSuccess(
      res,
      200,
      'Categories retrieved.',
      categories.map((category) =>
        presentCategory(
          category,
          productCounts.get(category._id.toString()) || 0,
        ),
      ),
      buildPagination(query.page, query.limit, total),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const getAdminCategory = asyncHandler(async (req, res) => {
  if (!parseRecordId(req.params.categoryId)) {
    return sendError(res, 400, 'A valid category identifier is required.');
  }
  if (!databaseReady(res)) return;

  try {
    const category = await Category.findById(req.params.categoryId).lean();
    if (!category) return sendError(res, 404, 'Category not found.');
    const productCount = await Product.countDocuments({ category: category._id });
    return sendSuccess(
      res,
      200,
      'Category retrieved.',
      presentCategory(category, productCount),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const createAdminCategory = asyncHandler(async (req, res) => {
  let data;
  try {
    data = parseCategoryPayload(req.body);
  } catch (error) {
    if (validationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;

  try {
    if (await Category.exists({ slug: data.slug })) {
      return sendError(res, 409, 'That category slug is already in use.', [
        { field: 'slug', message: 'Choose a unique slug.' },
      ]);
    }
    const category = await Category.create({
      ...categoryValues(data),
      isDemo: false,
    });
    return sendSuccess(
      res,
      201,
      'Category created.',
      presentCategory(category.toObject(), 0),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const updateAdminCategory = asyncHandler(async (req, res) => {
  if (!parseRecordId(req.params.categoryId)) {
    return sendError(res, 400, 'A valid category identifier is required.');
  }
  let data;
  try {
    data = parseCategoryPayload(req.body);
  } catch (error) {
    if (validationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;

  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return sendError(res, 404, 'Category not found.');
    if (
      await Category.exists({
        slug: data.slug,
        _id: { $ne: category._id },
      })
    ) {
      return sendError(res, 409, 'That category slug is already in use.', [
        { field: 'slug', message: 'Choose a unique slug.' },
      ]);
    }

    category.set(categoryValues(data));
    await category.save();
    const productCount = await Product.countDocuments({ category: category._id });
    return sendSuccess(
      res,
      200,
      'Category updated.',
      presentCategory(category.toObject(), productCount),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const deleteAdminCategory = asyncHandler(async (req, res) => {
  if (!parseRecordId(req.params.categoryId)) {
    return sendError(res, 400, 'A valid category identifier is required.');
  }
  if (!databaseReady(res)) return;

  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return sendError(res, 404, 'Category not found.');
    if (await Product.exists({ category: category._id })) {
      return sendError(
        res,
        409,
        'This category cannot be deleted while products are assigned to it.',
      );
    }
    await category.deleteOne();
    return sendSuccess(res, 200, 'Category deleted.', {
      recordId: category._id.toString(),
    });
  } catch (error) {
    return databaseError(res, error);
  }
});

module.exports = {
  createAdminCategory,
  createAdminProduct,
  deleteAdminCategory,
  deleteAdminProduct,
  getAdminCategory,
  getAdminProduct,
  listAdminCategories,
  listAdminProducts,
  parseListQuery,
  updateAdminCategory,
  updateAdminProduct,
};
