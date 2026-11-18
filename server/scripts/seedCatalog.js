'use strict';

const path = require('path');
const { pathToFileURL } = require('url');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({
  path: path.join(__dirname, '..', '.env'),
  override: false,
});

const connectDB = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');
const catalogUrl = pathToFileURL(
  path.resolve(__dirname, '..', '..', 'client', 'src', 'data', 'formulations.js'),
).href;

async function ensureDemoOnlyTargets(categories, formulations) {
  const categorySlugs = categories.map((category) => category.slug);
  const existingCategories = await Category.find({
    slug: { $in: categorySlugs },
  })
    .select('slug isDemo')
    .lean();
  if (existingCategories.some((category) => !category.isDemo)) {
    throw new Error('A non-demo category uses a development seed slug.');
  }

  const existingProducts = await Product.find({
    $or: [
      { slug: { $in: formulations.map((product) => product.slug) } },
      { id: { $in: formulations.map((product) => product.id) } },
    ],
  })
    .select('slug id isDemo')
    .lean();
  if (existingProducts.some((product) => !product.isDemo)) {
    throw new Error('A non-demo product uses a development seed identifier.');
  }
}

async function seedCatalog() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Catalog seeding is permitted only when NODE_ENV is development.');
  }
  if (process.env.SEED_DEMO_DATA !== 'true') {
    throw new Error('Set SEED_DEMO_DATA=true to explicitly enable demo catalog seeding.');
  }

  const { categories, formulations } = await import(catalogUrl);
  if (!Array.isArray(categories) || !Array.isArray(formulations)) {
    throw new Error('The development catalog data is not available.');
  }

  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    throw new Error('The database connection is unavailable.');
  }
  if (mongoose.connection.name !== 'zorvellae') {
    throw new Error('The development catalog database is not zorvellae.');
  }

  await ensureDemoOnlyTargets(categories, formulations);

  const categoryDocuments = new Map();
  for (const [index, category] of categories.entries()) {
    const savedCategory = await Category.findOneAndUpdate(
      { slug: category.slug },
      {
        $set: {
          name: category.name,
          description: category.description,
          bannerImage: category.bannerImage || '',
          sortOrder: index + 1,
          isActive: true,
          isPublished: true,
          isDemo: true,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
    categoryDocuments.set(category.slug, savedCategory);
  }

  for (const formulation of formulations) {
    const category = categoryDocuments.get(formulation.category);
    if (!category) {
      throw new Error('A development product references an unknown category.');
    }

    await Product.findOneAndUpdate(
      { slug: formulation.slug },
      {
        $set: {
          id: formulation.id,
          name: formulation.name,
          description: formulation.description,
          category: category._id,
          categoryLabel: formulation.categoryLabel,
          images: formulation.images || [],
          price: Math.min(...formulation.variants.map((variant) => variant.price)),
          currency: 'USD',
          variants: formulation.variants,
          ingredients: formulation.ingredients,
          usage: formulation.usage,
          specifications: formulation.specifications || {},
          badge: formulation.badge || 'Development sample',
          sortOrder: formulation.sortOrder,
          isActive: true,
          isPublished: true,
          isDemo: true,
          purchaseAvailable: false,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
  }

  console.log(
    `Seeded ${categories.length} development categories and ${formulations.length} development products in zorvellae.`,
  );
}

seedCatalog()
  .catch((error) => {
    const errorType =
      typeof error?.name === 'string' ? error.name : 'UnknownError';
    console.error(`Catalog seeding failed (${errorType}); details omitted.`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect();
      } catch (error) {
        const errorType =
          typeof error?.name === 'string' ? error.name : 'UnknownError';
        console.error(`Database disconnect failed (${errorType}); details omitted.`);
        process.exitCode = 1;
      }
    }
  });
