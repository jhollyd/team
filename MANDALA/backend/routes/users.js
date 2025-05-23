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

// User role management (admin only)
router.patch('/:clerkId/role', isAdmin, usersController.updateUserRole);

// Cart operations
router.get('/:clerkId/cart', usersController.getCart);
router.post('/:clerkId/cart', usersController.addToCart);
router.put('/:clerkId/cart', usersController.updateCartItemQuantity);
router.delete('/:clerkId/cart', usersController.removeFromCart);

// Wishlist operations
router.get('/:clerkId/wishlist', usersController.getWishlist);
router.post('/:clerkId/wishlist', usersController.addToWishlist);
router.delete('/:clerkId/wishlist', usersController.removeFromWishlist);

// Other user operations
router.get('/', getAllUsers);
router.post('/', googleSignIn);
router.post('/get-or-create', usersController.getOrCreateUser);
router.get('/:id', getUserById);
router.delete('/:id', deleteUser);
router.put('/:id', updateUser);

module.exports = router;
