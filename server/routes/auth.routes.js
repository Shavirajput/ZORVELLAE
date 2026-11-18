const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getCurrentUser,
  login,
  logout,
  register,
  updateCurrentUser,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const verifyAuthOrigin = require('../middleware/verifyAuthOrigin');
const { sendError } = require('../utils/apiResponse');

const router = express.Router();

function nameValidation() {
  return body('name')
    .isString()
    .withMessage('Name is required.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage('Name must be between 1 and 80 characters.')
    .bail()
    .custom((value) => !/[\u0000-\u001f\u007f]/.test(value))
    .withMessage('Name contains unsupported characters.');
}

function emailValidation() {
  return body('email')
    .isString()
    .withMessage('Email address is required.')
    .bail()
    .customSanitizer((value) => value.trim().toLowerCase())
    .isLength({ max: 254 })
    .withMessage('Email address is too long.')
    .bail()
    .isEmail()
    .withMessage('Enter a valid email address.');
}

function validationHandler(req, res, next) {
  const errors = validationResult(req)
    .array({ onlyFirstError: true })
    .map(({ path, msg }) => ({ field: path, message: msg }));
  if (errors.length > 0) {
    return sendError(res, 400, 'Please check the provided information.', errors);
  }
  return next();
}

const registrationValidation = [
  nameValidation(),
  emailValidation(),
  body('password')
    .isString()
    .withMessage('Password is required.')
    .bail()
    .isLength({ min: 12, max: 128 })
    .withMessage('Password must be between 12 and 128 characters.'),
];

const loginValidation = [
  emailValidation(),
  body('password')
    .isString()
    .withMessage('Password is required.')
    .bail()
    .isLength({ min: 1, max: 128 })
    .withMessage('Email or password is incorrect.'),
];

const profileValidation = [nameValidation(), emailValidation()];

router.post(
  '/register',
  verifyAuthOrigin,
  registrationValidation,
  validationHandler,
  register,
);
router.post('/login', verifyAuthOrigin, loginValidation, validationHandler, login);
router.post('/logout', verifyAuthOrigin, logout);
router.get('/me', protect, getCurrentUser);
router.patch(
  '/me',
  verifyAuthOrigin,
  protect,
  profileValidation,
  validationHandler,
  updateCurrentUser,
);

module.exports = router;
