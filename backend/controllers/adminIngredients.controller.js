'use strict';

const mongoose = require('mongoose');
const Ingredient = require('../models/Ingredient');
const asyncHandler = require('../utils/asyncHandler');
const {
  buildPagination,
  sendError,
  sendSuccess,
} = require('../utils/apiResponse');
const {
  InputValidationError,
  parseAdminIngredient,
  parseAdminIngredientListQuery,
} = require('../validators/adminContent');

function databaseReady(res) {
  if (mongoose.connection.readyState === 1) return true;
  sendError(res, 503, 'Ingredient records are temporarily unavailable.');
  return false;
}

function databaseError(res, error) {
  const errorType = typeof error?.name === 'string' ? error.name : 'UnknownError';
  console.error(`Admin ingredient request failed (${errorType}); details omitted.`);
  return sendError(res, 503, 'Ingredient records are temporarily unavailable.');
}

function sendValidationError(res, error) {
  if (!(error instanceof InputValidationError)) return false;
  sendError(res, 400, error.message, error.errors);
  return true;
}

function parseIngredientId(value) {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function presentIngredient(ingredient) {
  return {
    id: ingredient._id.toString(),
    name: ingredient.name,
    inci: ingredient.inci,
    slug: ingredient.slug,
    summary: ingredient.summary,
    monograph: ingredient.monograph,
    sortOrder: ingredient.sortOrder,
    status: ingredient.status,
    createdAt: ingredient.createdAt,
    updatedAt: ingredient.updatedAt,
  };
}

function duplicateSlug(res) {
  return sendError(res, 409, 'An ingredient with this slug already exists.');
}

const listAdminIngredients = asyncHandler(async (req, res) => {
  let query;
  try {
    query = parseAdminIngredientListQuery(req.query);
  } catch (error) {
    if (sendValidationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;

  try {
    const filter = {};
    if (query.status !== 'all') filter.status = query.status;
    if (query.search) {
      const search = new RegExp(escapeRegExp(query.search), 'i');
      filter.$or = [{ name: search }, { inci: search }, { slug: search }];
    }
    const [ingredients, total] = await Promise.all([
      Ingredient.find(filter)
        .sort({ sortOrder: 1, name: 1, _id: 1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      Ingredient.countDocuments(filter),
    ]);
    return sendSuccess(
      res,
      200,
      'Ingredient records retrieved.',
      ingredients.map(presentIngredient),
      buildPagination(query.page, query.limit, total),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const getAdminIngredient = asyncHandler(async (req, res) => {
  if (!parseIngredientId(req.params.ingredientId)) {
    return sendError(res, 400, 'A valid ingredient identifier is required.');
  }
  if (!databaseReady(res)) return;
  try {
    const ingredient = await Ingredient.findById(req.params.ingredientId).lean();
    if (!ingredient) return sendError(res, 404, 'Ingredient record not found.');
    return sendSuccess(
      res,
      200,
      'Ingredient record retrieved.',
      presentIngredient(ingredient),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const createAdminIngredient = asyncHandler(async (req, res) => {
  let ingredientInput;
  try {
    ingredientInput = parseAdminIngredient(req.body);
  } catch (error) {
    if (sendValidationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;
  try {
    const ingredient = await Ingredient.create(ingredientInput);
    return sendSuccess(
      res,
      201,
      'Ingredient record created.',
      presentIngredient(ingredient),
    );
  } catch (error) {
    if (error?.code === 11000) return duplicateSlug(res);
    if (error?.name === 'ValidationError') {
      return sendError(res, 400, 'The ingredient record could not be saved.');
    }
    return databaseError(res, error);
  }
});

const updateAdminIngredient = asyncHandler(async (req, res) => {
  if (!parseIngredientId(req.params.ingredientId)) {
    return sendError(res, 400, 'A valid ingredient identifier is required.');
  }
  let ingredientInput;
  try {
    ingredientInput = parseAdminIngredient(req.body);
  } catch (error) {
    if (sendValidationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;
  try {
    const ingredient = await Ingredient.findByIdAndUpdate(
      req.params.ingredientId,
      { $set: ingredientInput },
      { new: true, runValidators: true },
    ).lean();
    if (!ingredient) return sendError(res, 404, 'Ingredient record not found.');
    return sendSuccess(
      res,
      200,
      'Ingredient record updated.',
      presentIngredient(ingredient),
    );
  } catch (error) {
    if (error?.code === 11000) return duplicateSlug(res);
    if (error?.name === 'ValidationError') {
      return sendError(res, 400, 'The ingredient record could not be saved.');
    }
    return databaseError(res, error);
  }
});

const deleteAdminIngredient = asyncHandler(async (req, res) => {
  if (!parseIngredientId(req.params.ingredientId)) {
    return sendError(res, 400, 'A valid ingredient identifier is required.');
  }
  if (!databaseReady(res)) return;
  try {
    const ingredient = await Ingredient.findByIdAndDelete(req.params.ingredientId).lean();
    if (!ingredient) return sendError(res, 404, 'Ingredient record not found.');
    return sendSuccess(res, 200, 'Ingredient record deleted.', {
      id: ingredient._id.toString(),
    });
  } catch (error) {
    return databaseError(res, error);
  }
});

module.exports = {
  createAdminIngredient,
  deleteAdminIngredient,
  getAdminIngredient,
  listAdminIngredients,
  updateAdminIngredient,
};
