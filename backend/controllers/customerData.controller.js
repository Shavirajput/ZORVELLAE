'use strict';

const mongoose = require('mongoose');
const Address = require('../models/Address');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const Wishlist = require('../models/Wishlist');
const { clearSessionCookie } = require('../config/security');
const asyncHandler = require('../utils/asyncHandler');
const { sendError, sendSuccess } = require('../utils/apiResponse');

function databaseReady(res) {
  if (mongoose.connection.readyState === 1) return true;
  sendError(res, 503, 'Customer data is temporarily unavailable.');
  return false;
}

function logDatabaseError(error) {
  const errorType = typeof error?.name === 'string' ? error.name : 'UnknownError';
  console.error(`Customer data request failed (${errorType}); details omitted.`);
}

function databaseError(res, error) {
  logDatabaseError(error);
  return sendError(res, 503, 'Customer data is temporarily unavailable.');
}

async function customerExists(customerId, res) {
  const exists = await User.exists({ _id: customerId });
  if (exists) return true;
  clearSessionCookie(res);
  sendError(res, 401, 'Authentication is required.');
  return false;
}

async function getOrCreateCart(customerId) {
  await Cart.init();
  let cart = await Cart.findOne({ customer: customerId });
  if (cart) return cart;

  try {
    return await Cart.create({ customer: customerId, items: [] });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    cart = await Cart.findOne({ customer: customerId });
    if (!cart) throw error;
    return cart;
  }
}

async function getOrCreateWishlist(customerId) {
  await Wishlist.init();
  let wishlist = await Wishlist.findOne({ customer: customerId });
  if (wishlist) return wishlist;

  try {
    return await Wishlist.create({ customer: customerId, productIds: [] });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    wishlist = await Wishlist.findOne({ customer: customerId });
    if (!wishlist) throw error;
    return wishlist;
  }
}

async function findActiveVariant(productId, variantId) {
  const product = await Product.findOne({
    id: productId,
    isActive: true,
    isPublished: true,
  })
    .select('variants')
    .lean();
  if (!product) return { error: 'Product not found.', status: 404 };
  if (!product.variants.some((variant) => variant.id === variantId)) {
    return { error: 'A valid product variant is required.', status: 400 };
  }
  return { product };
}

function presentCart(cart) {
  return cart.items.map(({ productId, variantId, quantity }) => ({
    productId,
    variantId,
    quantity,
  }));
}

function presentAddress(address, defaultAddressId) {
  return {
    id: address._id.toString(),
    firstName: address.firstName,
    lastName: address.lastName,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    region: address.region,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: Boolean(
      defaultAddressId && address._id.equals(defaultAddressId),
    ),
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}

async function readAddresses(customerId) {
  const [user, addresses] = await Promise.all([
    User.findById(customerId).select('defaultShippingAddress').lean(),
    Address.find({ customer: customerId }).sort({ createdAt: 1, _id: 1 }).lean(),
  ]);
  if (!user) return null;
  return addresses.map((address) =>
    presentAddress(address, user.defaultShippingAddress),
  );
}

const getCart = asyncHandler(async (req, res) => {
  if (!databaseReady(res)) return;
  try {
    if (!(await customerExists(req.user.sub, res))) return;
    const cart = await Cart.findOne({ customer: req.user.sub }).lean();
    return sendSuccess(res, 200, 'Cart retrieved.', cart?.items || []);
  } catch (error) {
    return databaseError(res, error);
  }
});

const addCartItem = asyncHandler(async (req, res) => {
  if (!databaseReady(res)) return;
  try {
    if (!(await customerExists(req.user.sub, res))) return;
    const result = await findActiveVariant(req.body.productId, req.body.variantId);
    if (result.error) return sendError(res, result.status, result.error);

    const cart = await getOrCreateCart(req.user.sub);
    const existing = cart.items.find(
      (item) =>
        item.productId === req.body.productId &&
        item.variantId === req.body.variantId,
    );
    const nextQuantity = (existing?.quantity || 0) + req.body.quantity;
    if (nextQuantity > 99) {
      return sendError(res, 400, 'A cart item cannot exceed 99 units.');
    }

    if (existing) existing.quantity = nextQuantity;
    else cart.items.push({ ...req.body });
    await cart.save();
    return sendSuccess(res, 200, 'Cart item added.', presentCart(cart));
  } catch (error) {
    return databaseError(res, error);
  }
});

const updateCartItem = asyncHandler(async (req, res) => {
  if (!databaseReady(res)) return;
  try {
    if (!(await customerExists(req.user.sub, res))) return;
    const cart = await Cart.findOne({ customer: req.user.sub });
    const item = cart?.items.find(
      (entry) =>
        entry.productId === req.body.productId &&
        entry.variantId === req.body.variantId,
    );
    if (!item) return sendError(res, 404, 'Cart item not found.');

    item.quantity = req.body.quantity;
    await cart.save();
    return sendSuccess(res, 200, 'Cart item updated.', presentCart(cart));
  } catch (error) {
    return databaseError(res, error);
  }
});

const removeCartItem = asyncHandler(async (req, res) => {
  if (!databaseReady(res)) return;
  try {
    if (!(await customerExists(req.user.sub, res))) return;
    const cart = await Cart.findOne({ customer: req.user.sub });
    if (!cart) return sendSuccess(res, 200, 'Cart item removed.', []);
    cart.items = cart.items.filter(
      (item) =>
        item.productId !== req.body.productId ||
        item.variantId !== req.body.variantId,
    );
    await cart.save();
    return sendSuccess(res, 200, 'Cart item removed.', presentCart(cart));
  } catch (error) {
    return databaseError(res, error);
  }
});

const clearCart = asyncHandler(async (req, res) => {
  if (!databaseReady(res)) return;
  try {
    if (!(await customerExists(req.user.sub, res))) return;
    await Cart.updateOne(
      { customer: req.user.sub },
      { $set: { items: [] } },
      { runValidators: true },
    );
    return sendSuccess(res, 200, 'Cart cleared.', []);
  } catch (error) {
    return databaseError(res, error);
  }
});

const getWishlist = asyncHandler(async (req, res) => {
  if (!databaseReady(res)) return;
  try {
    if (!(await customerExists(req.user.sub, res))) return;
    const wishlist = await Wishlist.findOne({ customer: req.user.sub }).lean();
    return sendSuccess(
      res,
      200,
      'Wishlist retrieved.',
      wishlist?.productIds || [],
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const addWishlistItem = asyncHandler(async (req, res) => {
  if (!databaseReady(res)) return;
  try {
    if (!(await customerExists(req.user.sub, res))) return;
    const product = await Product.findOne({
      id: req.body.productId,
      isActive: true,
      isPublished: true,
    })
      .select('_id')
      .lean();
    if (!product) return sendError(res, 404, 'Product not found.');

    const wishlist = await getOrCreateWishlist(req.user.sub);
    if (!wishlist.productIds.includes(req.body.productId)) {
      wishlist.productIds.push(req.body.productId);
      await wishlist.save();
    }
    return sendSuccess(
      res,
      200,
      'Wishlist item saved.',
      wishlist.productIds,
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const removeWishlistItem = asyncHandler(async (req, res) => {
  if (!databaseReady(res)) return;
  try {
    if (!(await customerExists(req.user.sub, res))) return;
    const wishlist = await Wishlist.findOne({ customer: req.user.sub });
    if (!wishlist) return sendSuccess(res, 200, 'Wishlist item removed.', []);
    wishlist.productIds = wishlist.productIds.filter(
      (productId) => productId !== req.params.productId,
    );
    await wishlist.save();
    return sendSuccess(
      res,
      200,
      'Wishlist item removed.',
      wishlist.productIds,
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const clearWishlist = asyncHandler(async (req, res) => {
  if (!databaseReady(res)) return;
  try {
    if (!(await customerExists(req.user.sub, res))) return;
    await Wishlist.updateOne(
      { customer: req.user.sub },
      { $set: { productIds: [] } },
      { runValidators: true },
    );
    return sendSuccess(res, 200, 'Wishlist cleared.', []);
  } catch (error) {
    return databaseError(res, error);
  }
});

const listAddresses = asyncHandler(async (req, res) => {
  if (!databaseReady(res)) return;
  try {
    if (!(await customerExists(req.user.sub, res))) return;
    const addresses = await readAddresses(req.user.sub);
    if (!addresses) return sendError(res, 401, 'Authentication is required.');
    return sendSuccess(res, 200, 'Addresses retrieved.', addresses);
  } catch (error) {
    return databaseError(res, error);
  }
});

const createAddress = asyncHandler(async (req, res) => {
  if (!databaseReady(res)) return;
  try {
    if (!(await customerExists(req.user.sub, res))) return;
    const address = await Address.create({
      ...req.body,
      customer: req.user.sub,
    });
    await User.updateOne(
      { _id: req.user.sub, defaultShippingAddress: null },
      { $set: { defaultShippingAddress: address._id } },
    );
    const addresses = await readAddresses(req.user.sub);
    const createdAddress = addresses.find(
      (entry) => entry.id === address._id.toString(),
    );
    return sendSuccess(res, 201, 'Address saved.', createdAddress);
  } catch (error) {
    return databaseError(res, error);
  }
});

const updateAddress = asyncHandler(async (req, res) => {
  if (!databaseReady(res)) return;
  try {
    if (!(await customerExists(req.user.sub, res))) return;
    const address = await Address.findOne({
      _id: req.params.addressId,
      customer: req.user.sub,
    });
    if (!address) return sendError(res, 404, 'Address not found.');

    Object.assign(address, req.body);
    await address.save();
    const user = await User.findById(req.user.sub)
      .select('defaultShippingAddress')
      .lean();
    return sendSuccess(
      res,
      200,
      'Address updated.',
      presentAddress(address, user?.defaultShippingAddress),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  if (!databaseReady(res)) return;
  try {
    if (!(await customerExists(req.user.sub, res))) return;
    const address = await Address.findOne({
      _id: req.params.addressId,
      customer: req.user.sub,
    })
      .select('_id')
      .lean();
    if (!address) return sendError(res, 404, 'Address not found.');

    const update = await User.updateOne(
      { _id: req.user.sub },
      { $set: { defaultShippingAddress: address._id } },
    );
    if (update.matchedCount !== 1) {
      clearSessionCookie(res);
      return sendError(res, 401, 'Authentication is required.');
    }
    const addresses = await readAddresses(req.user.sub);
    return sendSuccess(res, 200, 'Default address updated.', addresses);
  } catch (error) {
    return databaseError(res, error);
  }
});

const deleteAddress = asyncHandler(async (req, res) => {
  if (!databaseReady(res)) return;
  try {
    if (!(await customerExists(req.user.sub, res))) return;
    const [user, address] = await Promise.all([
      User.findById(req.user.sub).select('defaultShippingAddress'),
      Address.findOne({
        _id: req.params.addressId,
        customer: req.user.sub,
      }),
    ]);
    if (!user) {
      clearSessionCookie(res);
      return sendError(res, 401, 'Authentication is required.');
    }
    if (!address) return sendError(res, 404, 'Address not found.');

    await address.deleteOne();
    if (
      user.defaultShippingAddress &&
      user.defaultShippingAddress.equals(address._id)
    ) {
      const nextAddress = await Address.findOne({ customer: req.user.sub })
        .sort({ createdAt: 1, _id: 1 })
        .select('_id')
        .lean();
      user.defaultShippingAddress = nextAddress?._id || null;
      await user.save();
    }
    const addresses = await readAddresses(req.user.sub);
    return sendSuccess(res, 200, 'Address removed.', addresses);
  } catch (error) {
    return databaseError(res, error);
  }
});

module.exports = {
  addCartItem,
  addWishlistItem,
  clearCart,
  clearWishlist,
  createAddress,
  deleteAddress,
  getCart,
  getWishlist,
  listAddresses,
  removeCartItem,
  removeWishlistItem,
  setDefaultAddress,
  updateAddress,
  updateCartItem,
};
