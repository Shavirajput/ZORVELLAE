const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { buildPagination, sendError, sendSuccess } = require('../utils/apiResponse');

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const allowedSorts = new Set(['featured', 'price-low', 'price-high', 'name']);
const allowedPriceBands = new Set(['all', 'under-50', '50-70', 'over-70']);

function isCatalogAvailable(res) {
  if (mongoose.connection.readyState === 1) return true;
  sendError(res, 503, 'Catalog data is temporarily unavailable.');
  return false;
}

function logCatalogError(error) {
  const errorType = typeof error?.name === 'string' ? error.name : 'UnknownError';
  console.error(`Catalog request failed (${errorType}); details omitted.`);
}

function databaseUnavailable(res, error) {
  logCatalogError(error);
  return sendError(res, 503, 'Catalog data is temporarily unavailable.');
}

function readPositiveInteger(value, defaultValue, maximum) {
  if (value === undefined) return { value: defaultValue };
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    return { error: 'Page and limit must be positive integers.' };
  }

  const number = Number(value);
  if (!Number.isSafeInteger(number) || number > maximum) {
    return { error: `Page and limit must not exceed ${maximum}.` };
  }
  return { value: number };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function presentCategory(category, productCount) {
  return {
    slug: category.slug,
    name: category.name,
    description: category.description,
    bannerImage: category.bannerImage,
    sortOrder: category.sortOrder,
    isDemo: category.isDemo,
    productCount,
  };
}

function presentProduct(product) {
  const category = product.category || {};
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    category: category.slug || '',
    categoryLabel: product.categoryLabel || category.name || '',
    images: product.images || [],
    price: product.price,
    currency: product.currency,
    variants: (product.variants || []).map((variant) => ({
      id: variant.id,
      label: variant.label,
      price: variant.price,
    })),
    ingredients: product.ingredients,
    usage: product.usage,
    specifications: product.specifications || {},
    badge: product.badge,
    sortOrder: product.sortOrder,
    isDemo: product.isDemo,
    purchaseAvailable: product.isDemo ? false : product.purchaseAvailable,
  };
}

const listCategories = asyncHandler(async (req, res) => {
  if (!isCatalogAvailable(res)) return;

  try {
    const categories = await Category.find({ isActive: true, isPublished: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    const categoryResponses = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({
          category: category._id,
          isActive: true,
          isPublished: true,
        });
        return presentCategory(category, productCount);
      }),
    );
    return sendSuccess(res, 200, 'Categories retrieved.', categoryResponses);
  } catch (error) {
    return databaseUnavailable(res, error);
  }
});

const getCategoryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  if (!slugPattern.test(slug)) {
    return sendError(res, 400, 'A valid category slug is required.');
  }
  if (!isCatalogAvailable(res)) return;

  try {
    const category = await Category.findOne({
      slug,
      isActive: true,
      isPublished: true,
    }).lean();
    if (!category) return sendError(res, 404, 'Category not found.');

    const productCount = await Product.countDocuments({
      category: category._id,
      isActive: true,
      isPublished: true,
    });
    return sendSuccess(
      res,
      200,
      'Category retrieved.',
      presentCategory(category, productCount),
    );
  } catch (error) {
    return databaseUnavailable(res, error);
  }
});

const listProducts = asyncHandler(async (req, res) => {
  const pageResult = readPositiveInteger(req.query.page, 1, 100000);
  const limitResult = readPositiveInteger(req.query.limit, 12, 100);
  if (pageResult.error || limitResult.error) {
    return sendError(res, 400, pageResult.error || limitResult.error);
  }

  const search = req.query.search === undefined ? '' : req.query.search;
  if (typeof search !== 'string' || search.trim().length > 100) {
    return sendError(res, 400, 'Search must be a string of 100 characters or fewer.');
  }

  const sort = req.query.sort === undefined ? 'featured' : req.query.sort;
  if (typeof sort !== 'string' || !allowedSorts.has(sort)) {
    return sendError(res, 400, 'The requested product sort is not supported.');
  }

  const priceBand =
    req.query.priceBand === undefined ? 'all' : req.query.priceBand;
  if (typeof priceBand !== 'string' || !allowedPriceBands.has(priceBand)) {
    return sendError(res, 400, 'The requested price filter is not supported.');
  }

  const categoryQuery = req.query.category;
  let categorySlugs = [];
  if (categoryQuery !== undefined) {
    if (typeof categoryQuery !== 'string') {
      return sendError(res, 400, 'Category filters must be comma-separated slugs.');
    }
    categorySlugs = [...new Set(categoryQuery.split(',').map((slug) => slug.trim()))];
    if (
      categorySlugs.length === 0 ||
      categorySlugs.length > 10 ||
      categorySlugs.some((slug) => !slugPattern.test(slug))
    ) {
      return sendError(res, 400, 'One or more category slugs are invalid.');
    }
  }

  if (!isCatalogAvailable(res)) return;

  try {
    const activeCategories = await Category.find({
      isActive: true,
      isPublished: true,
    })
      .select('_id slug')
      .lean();
    const categoryIdsBySlug = new Map(
      activeCategories.map((category) => [category.slug, category._id]),
    );
    const filter = {
      isActive: true,
      isPublished: true,
      category: { $in: activeCategories.map((category) => category._id) },
    };
    if (search.trim()) {
      const searchPattern = new RegExp(escapeRegExp(search.trim()), 'i');
      filter.$or = [
        { name: searchPattern },
        { description: searchPattern },
        { categoryLabel: searchPattern },
      ];
    }

    if (categorySlugs.length > 0) {
      const selectedCategoryIds = categorySlugs.map((slug) =>
        categoryIdsBySlug.get(slug),
      );
      if (selectedCategoryIds.some((id) => !id)) {
        return sendError(res, 404, 'One or more categories were not found.');
      }
      filter.category = { $in: selectedCategoryIds };
    }

    if (priceBand === 'under-50') filter.price = { $lt: 50 };
    if (priceBand === '50-70') filter.price = { $gte: 50, $lte: 70 };
    if (priceBand === 'over-70') filter.price = { $gt: 70 };

    const sortOptions = {
      featured: { sortOrder: 1, name: 1 },
      'price-low': { price: 1, sortOrder: 1 },
      'price-high': { price: -1, sortOrder: 1 },
      name: { name: 1 },
    };
    const skip = (pageResult.value - 1) * limitResult.value;
    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate({ path: 'category', select: 'slug name' })
        .sort(sortOptions[sort])
        .skip(skip)
        .limit(limitResult.value)
        .lean(),
    ]);

    return sendSuccess(
      res,
      200,
      'Products retrieved.',
      products.map(presentProduct),
      buildPagination(pageResult.value, limitResult.value, total),
    );
  } catch (error) {
    return databaseUnavailable(res, error);
  }
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  if (!slugPattern.test(slug)) {
    return sendError(res, 400, 'A valid product slug is required.');
  }
  if (!isCatalogAvailable(res)) return;

  try {
    const product = await Product.findOne({
      slug,
      isActive: true,
      isPublished: true,
    })
      .populate({ path: 'category', select: 'slug name' })
      .lean();
    if (!product || !product.category) {
      return sendError(res, 404, 'Product not found.');
    }
    return sendSuccess(res, 200, 'Product retrieved.', presentProduct(product));
  } catch (error) {
    return databaseUnavailable(res, error);
  }
});

module.exports = {
  getCategoryBySlug,
  getProductBySlug,
  listCategories,
  listProducts,
  presentProduct,
};
