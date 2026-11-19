const express = require('express');
const {
  getProductBySlug,
  listProducts,
} = require('../controllers/catalog.controller');

const router = express.Router();

router.get('/', listProducts);
router.get('/:slug', getProductBySlug);

module.exports = router;
