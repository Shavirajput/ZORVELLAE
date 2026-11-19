'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const {
  adminLogin,
  adminLogout,
  getAdminCurrentUser,
  getAdminDashboard,
} = require('../controllers/admin.controller');
const {
  createAdminCategory,
  createAdminProduct,
  deleteAdminCategory,
  deleteAdminProduct,
  getAdminCategory,
  getAdminProduct,
  listAdminCategories,
  listAdminProducts,
  updateAdminCategory,
  updateAdminProduct,
} = require('../controllers/adminCatalog.controller');
const { adminOnly, protectAdmin } = require('../middleware/auth');
const verifyAuthOrigin = require('../middleware/verifyAuthOrigin');
const { sendError } = require('../utils/apiResponse');

const router = express.Router();
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many admin login attempts. Please wait 15 minutes.',
  },
});

function validationHandler(req, res, next) {
  const errors = validationResult(req)
    .array({ onlyFirstError: true })
    .map(({ path, msg }) => ({ field: path, message: msg }));
  if (errors.length > 0) {
    return sendError(res, 400, 'Please check the provided information.', errors);
  }
  return next();
}

const adminCredentialsValidation = [
  body('email')
    .isString()
    .withMessage('Email address is required.')
    .bail()
    .customSanitizer((value) => value.trim().toLowerCase())
    .isLength({ max: 254 })
    .withMessage('Email address is too long.')
    .bail()
    .isEmail()
    .withMessage('Enter a valid email address.'),
  body('password')
    .isString()
    .withMessage('Password is required.')
    .bail()
    .isLength({ min: 1, max: 128 })
    .withMessage('Email or password is incorrect.'),
  validationHandler,
];

router.post(
  '/auth/login',
  adminLoginLimiter,
  verifyAuthOrigin,
  adminCredentialsValidation,
  adminLogin,
);
router.post('/auth/logout', verifyAuthOrigin, adminLogout);
router.get('/auth/me', protectAdmin, adminOnly, getAdminCurrentUser);

router.use(protectAdmin, adminOnly);
router.get('/dashboard', getAdminDashboard);

router.get('/products', listAdminProducts);
router.post('/products', createAdminProduct);
router.get('/products/:productId', getAdminProduct);
router.put('/products/:productId', updateAdminProduct);
router.delete('/products/:productId', deleteAdminProduct);

router.get('/categories', listAdminCategories);
router.post('/categories', createAdminCategory);
router.get('/categories/:categoryId', getAdminCategory);
router.put('/categories/:categoryId', updateAdminCategory);
router.delete('/categories/:categoryId', deleteAdminCategory);

module.exports = router;
