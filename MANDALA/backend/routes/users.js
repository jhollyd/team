const express = require('express');
const {
  getAllUsers,
  getUserById,
  deleteUser,
  updateUser,
  createUser,
  googleSignIn,
} = require('../controllers/userController');
const usersController = require('../controllers/users');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get user by Clerk ID (must be before other routes to prevent conflicts)
router.get('/clerk/:clerkId', usersController.getUserByClerkId);

// Admin routes
router.get('/', isAdmin, usersController.getAllUsers);
router.patch('/:userId/role', isAdmin, usersController.updateUserRole);
router.delete('/:userId', isAdmin, usersController.deleteUser);

// User operations
router.post('/get-or-create', usersController.getOrCreateUser);

// Cart operations
router.get('/:userId/cart', usersController.getCart);
router.post('/:userId/cart', usersController.addToCart);
router.put('/:userId/cart', usersController.updateCartItemQuantity);
router.delete('/:userId/cart', usersController.removeFromCart);
router.delete('/:userId/cart/clear', usersController.clearCart);

// Wishlist operations
router.get('/:userId/wishlist', usersController.getWishlist);
router.post('/:userId/wishlist', usersController.addToWishlist);
router.delete('/:userId/wishlist', usersController.removeFromWishlist);
router.delete('/:userId/wishlist/clear', usersController.clearWishlist);

// Other user operations
router.post('/', googleSignIn);
router.get('/:id', getUserById);
router.delete('/:id', deleteUser);
router.put('/:id', updateUser);

module.exports = router;
