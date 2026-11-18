'use strict';

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const {
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
} = require('../controllers/customerData.controller');
const { protect } = require('../middleware/auth');
const { sendError } = require('../utils/apiResponse');

const router = express.Router();
const productIdPattern = /^[a-z0-9][a-z0-9_-]{0,80}$/i;
const variantIdPattern = /^[a-z0-9][a-z0-9_-]{0,49}$/i;

function validationHandler(req, res, next) {
  const errors = validationResult(req)
    .array({ onlyFirstError: true })
    .map(({ path, msg }) => ({ field: path, message: msg }));
  if (errors.length > 0) {
    return sendError(res, 400, 'Please check the provided information.', errors);
  }
  return next();
}

function productIdValidation(field = 'productId') {
  return body(field)
    .isString()
    .withMessage('A valid product identifier is required.')
    .bail()
    .trim()
    .matches(productIdPattern)
    .withMessage('A valid product identifier is required.');
}

function variantIdValidation() {
  return body('variantId')
    .isString()
    .withMessage('A valid product variant is required.')
    .bail()
    .trim()
    .matches(variantIdPattern)
    .withMessage('A valid product variant is required.');
}

function quantityValidation() {
  return body('quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('Quantity must be a whole number between 1 and 99.')
    .bail()
    .toInt();
}

const cartItemValidation = [
  productIdValidation(),
  variantIdValidation(),
  quantityValidation(),
  validationHandler,
];

const cartItemKeyValidation = [
  productIdValidation(),
  variantIdValidation(),
  validationHandler,
];

function addressField(field, label, maximum, optional = false) {
  let validator = body(field);
  if (optional) validator = validator.optional();
  return validator
    .isString()
    .withMessage(`${label} must be text.`)
    .bail()
    .trim()
    .isLength({ min: optional ? 0 : 1, max: maximum })
    .withMessage(`${label} must be ${optional ? 'at most' : 'between 1 and'} ${maximum} characters.`)
    .bail()
    .custom((value) => !/[\u0000-\u001f\u007f]/.test(value))
    .withMessage(`${label} contains unsupported characters.`);
}

const addressValidation = [
  addressField('firstName', 'First name', 80),
  addressField('lastName', 'Last name', 80),
  addressField('addressLine1', 'Street address', 120),
  addressField('addressLine2', 'Address line 2', 120, true),
  addressField('city', 'City', 80),
  addressField('region', 'Region', 80),
  addressField('postalCode', 'Postal code', 20),
  addressField('country', 'Country', 80),
  validationHandler,
];

const addressIdValidation = [
  param('addressId').isMongoId().withMessage('A valid address identifier is required.'),
  validationHandler,
];

router.use(protect);

router.get('/cart', getCart);
router.post('/cart/items', cartItemValidation, addCartItem);
router.patch('/cart/items', cartItemValidation, updateCartItem);
router.delete('/cart/items', cartItemKeyValidation, removeCartItem);
router.delete('/cart', clearCart);

router.get('/wishlist', getWishlist);
router.post(
  '/wishlist/items',
  productIdValidation(),
  validationHandler,
  addWishlistItem,
);
router.delete(
  '/wishlist/items/:productId',
  param('productId')
    .matches(productIdPattern)
    .withMessage('A valid product identifier is required.'),
  validationHandler,
  removeWishlistItem,
);
router.delete('/wishlist', clearWishlist);

router.get('/addresses', listAddresses);
router.post('/addresses', addressValidation, createAddress);
router.patch(
  '/addresses/:addressId/default',
  addressIdValidation,
  setDefaultAddress,
);
router.patch('/addresses/:addressId', addressIdValidation, addressValidation, updateAddress);
router.delete('/addresses/:addressId', addressIdValidation, deleteAddress);

module.exports = router;
