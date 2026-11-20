'use strict';

const mongoose = require('mongoose');
const InventoryAdjustment = require('../models/InventoryAdjustment');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const {
  buildPagination,
  sendError,
  sendSuccess,
} = require('../utils/apiResponse');
const {
  INVENTORY_LOW_STOCK_THRESHOLD,
  InputValidationError,
  InventoryRuleError,
  calculateStockAdjustment,
  parseAdminInventoryListQuery,
  parseStockAdjustment,
} = require('../validators/adminInventory');

function databaseReady(res) {
  if (mongoose.connection.readyState === 1) return true;
  sendError(res, 503, 'Inventory management is temporarily unavailable.');
  return false;
}

function validationError(res, error) {
  if (!(error instanceof InputValidationError)) return false;
  sendError(res, 400, error.message, error.errors);
  return true;
}

function databaseError(res, error) {
  if (error?.name === 'ValidationError') {
    const errors = Object.entries(error.errors || {}).map(([field, value]) => ({
      field,
      message: value.message,
    }));
    return sendError(res, 400, 'Please check the provided information.', errors);
  }
  const errorType = typeof error?.name === 'string' ? error.name : 'UnknownError';
  console.error(`Admin inventory request failed (${errorType}); details omitted.`);
  return sendError(res, 503, 'Inventory management is temporarily unavailable.');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseRecordId(value) {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

function parseVariantId(value) {
  return typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= 80 &&
    !/[\u0000-\u001f/\\]/.test(value);
}

function presentAdjustment(adjustment) {
  return {
    id: adjustment._id.toString(),
    productName: adjustment.productName,
    variantId: adjustment.variantId,
    variantLabel: adjustment.variantLabel,
    sku: adjustment.sku || '',
    action: adjustment.action,
    previousQuantity: adjustment.previousQuantity ?? null,
    newQuantity: adjustment.newQuantity,
    adjustmentAmount: adjustment.adjustmentAmount,
    reason: adjustment.reason,
    adminId: adjustment.admin.toString(),
    adjustedAt: adjustment.adjustedAt,
  };
}

const listAdminInventory = asyncHandler(async (req, res) => {
  let query;
  try {
    query = parseAdminInventoryListQuery(req.query);
  } catch (error) {
    if (validationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;

  try {
    const match = {};
    if (query.search) {
      const search = new RegExp(escapeRegExp(query.search), 'i');
      match.$or = [{ name: search }, { 'variants.sku': search }];
    }
    if (query.status !== 'all') {
      const stockFilter = {
        in_stock: {
          $gt: ['$variants.stockQuantity', INVENTORY_LOW_STOCK_THRESHOLD],
        },
        low_stock: {
          $and: [
            { $gt: ['$variants.stockQuantity', 0] },
            { $lte: ['$variants.stockQuantity', INVENTORY_LOW_STOCK_THRESHOLD] },
          ],
        },
        out_of_stock: { $eq: ['$variants.stockQuantity', 0] },
        untracked: {
          $eq: [{ $ifNull: ['$variants.stockQuantity', null] }, null],
        },
      }[query.status];
      match.$expr = stockFilter;
    }

    const [result] = await Product.aggregate([
      { $unwind: '$variants' },
      { $match: match },
      {
        $addFields: {
          quantity: { $ifNull: ['$variants.stockQuantity', null] },
          stockStatus: {
            $switch: {
              branches: [
                {
                  case: { $eq: [{ $ifNull: ['$variants.stockQuantity', null] }, null] },
                  then: 'untracked',
                },
                { case: { $eq: ['$variants.stockQuantity', 0] }, then: 'out_of_stock' },
                {
                  case: { $lte: ['$variants.stockQuantity', INVENTORY_LOW_STOCK_THRESHOLD] },
                  then: 'low_stock',
                },
              ],
              default: 'in_stock',
            },
          },
        },
      },
      { $sort: { name: 1, 'variants.label': 1, _id: 1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          items: [
            { $skip: (query.page - 1) * query.limit },
            { $limit: query.limit },
            {
              $project: {
                productId: '$_id',
                productName: '$name',
                productSlug: '$slug',
                categoryName: '$categoryLabel',
                image: { $arrayElemAt: ['$images', 0] },
                variantId: '$variants.id',
                variantLabel: '$variants.label',
                sku: '$variants.sku',
                quantity: 1,
                stockStatus: 1,
              },
            },
          ],
        },
      },
    ]);
    const items = result?.items || [];
    const total = result?.metadata?.[0]?.total || 0;
    return sendSuccess(
      res,
      200,
      'Inventory retrieved.',
      items.map((item) => ({
        productId: item.productId.toString(),
        productName: item.productName,
        productSlug: item.productSlug,
        categoryName: item.categoryName || '',
        image: item.image || null,
        variantId: item.variantId,
        variantLabel: item.variantLabel,
        sku: item.sku || '',
        quantity: item.quantity,
        stockStatus: item.stockStatus,
      })),
      buildPagination(query.page, query.limit, total),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const getAdminInventoryHistory = asyncHandler(async (req, res) => {
  if (!parseRecordId(req.params.productId)) {
    return sendError(res, 400, 'A valid product identifier is required.');
  }
  if (!parseVariantId(req.params.variantId)) {
    return sendError(res, 400, 'A valid variant identifier is required.');
  }
  let query;
  try {
    query = parseAdminInventoryListQuery({
      page: req.query.page,
      limit: req.query.limit,
      status: 'all',
      search: '',
    });
  } catch (error) {
    if (validationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;

  try {
    const product = await Product.findById(req.params.productId)
      .select('variants.id')
      .lean();
    if (!product) return sendError(res, 404, 'Product not found.');
    if (!product.variants.some((variant) => variant.id === req.params.variantId)) {
      return sendError(res, 404, 'Product variant not found.');
    }
    const filter = {
      product: product._id,
      variantId: req.params.variantId,
    };
    const [adjustments, total] = await Promise.all([
      InventoryAdjustment.find(filter)
        .sort({ adjustedAt: -1, _id: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      InventoryAdjustment.countDocuments(filter),
    ]);
    return sendSuccess(
      res,
      200,
      'Stock adjustment history retrieved.',
      adjustments.map(presentAdjustment),
      buildPagination(query.page, query.limit, total),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const createAdminInventoryAdjustment = asyncHandler(async (req, res) => {
  if (!parseRecordId(req.params.productId)) {
    return sendError(res, 400, 'A valid product identifier is required.');
  }
  if (!parseVariantId(req.params.variantId)) {
    return sendError(res, 400, 'A valid variant identifier is required.');
  }
  let adjustment;
  try {
    adjustment = parseStockAdjustment(req.body);
  } catch (error) {
    if (validationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;

  let session;
  let result;
  try {
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const product = await Product.findById(req.params.productId).session(session);
      if (!product) {
        result = { status: 404, message: 'Product not found.' };
        return;
      }
      const variants = product.variants.filter(
        (variant) => variant.id === req.params.variantId,
      );
      if (variants.length === 0) {
        result = { status: 404, message: 'Product variant not found.' };
        return;
      }
      if (variants.length > 1) {
        result = {
          status: 409,
          message: 'This product has duplicate variant identifiers and cannot be adjusted safely.',
        };
        return;
      }

      const variant = variants[0];
      const previousQuantity = Number.isSafeInteger(variant.stockQuantity)
        ? variant.stockQuantity
        : null;
      let calculated;
      try {
        calculated = calculateStockAdjustment(previousQuantity, adjustment);
      } catch (error) {
        if (!(error instanceof InventoryRuleError)) throw error;
        result = { status: 400, message: error.message };
        return;
      }
      variant.stockQuantity = calculated.newQuantity;
      await product.save({ session });
      const [record] = await InventoryAdjustment.create(
        [{
          product: product._id,
          productName: product.name,
          variantId: variant.id,
          variantLabel: variant.label,
          sku: variant.sku || '',
          action: adjustment.action,
          previousQuantity: calculated.previousQuantity,
          newQuantity: calculated.newQuantity,
          adjustmentAmount: calculated.adjustmentAmount,
          reason: adjustment.reason,
          admin: req.admin.sub,
        }],
        { session },
      );
      result = {
        status: 201,
        message: 'Stock adjustment recorded.',
        data: presentAdjustment(record.toObject()),
      };
    });
  } catch (error) {
    return databaseError(res, error);
  } finally {
    if (session) await session.endSession();
  }

  if (!result) {
    return sendError(res, 503, 'Inventory management is temporarily unavailable.');
  }
  if (result.status !== 201) return sendError(res, result.status, result.message);
  return sendSuccess(res, result.status, result.message, result.data);
});

module.exports = {
  createAdminInventoryAdjustment,
  getAdminInventoryHistory,
  listAdminInventory,
};
