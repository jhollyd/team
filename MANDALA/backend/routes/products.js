const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products');
const { isAdmin } = require('../middleware/auth');

// Get all products
router.get('/', productsController.getAllProducts);

// Get product by ID
router.get('/:id', productsController.getProductById);

// Create new product (admin only)
router.post('/', isAdmin, productsController.createProduct);

// Update product (admin only)
router.put('/:id', isAdmin, productsController.updateProduct);

// Delete product (admin only)
router.delete('/:id', isAdmin, productsController.deleteProduct);

module.exports = router;

