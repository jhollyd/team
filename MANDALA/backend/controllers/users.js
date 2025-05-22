const User = require('../models/users');
const Product = require('../models/products');

// Get or create user
exports.getOrCreateUser = async (req, res) => {
  try {
    const { clerkId, email } = req.body;

    if (!clerkId || !email) {
      return res.status(400).json({ message: 'clerkId and email are required' });
    }

    let user = await User.findOne({ clerkId });

    if (!user) {
      user = new User({
        clerkId,
        email,
        cart: [],
        wishlist: []
      });
      await user.save();
      console.log('New user created:', user._id);
    } else {
      console.log('Existing user found:', user._id);
    }

    res.json(user);
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get or create user document for cart/wishlist
const getOrCreateUserDoc = async (clerkId) => {
  let user = await User.findOne({ clerkId });
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

// Get user cart
exports.getCart = async (req, res) => {
  try {
    const user = await getOrCreateUserDoc(req.params.clerkId);
    await user.populate({
      path: 'cart.productId',
      model: 'Product'
    });
    // Filter out items with null productId
    const validCartItems = user.cart.filter(item => item.productId !== null);
    // Update the user's cart to remove invalid items
    if (validCartItems.length !== user.cart.length) {
      user.cart = validCartItems;
      await user.save();
    }
    res.json(validCartItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add to cart
exports.addToCart = async (req, res) => {
  try {
    const { clerkId } = req.params;
    const { productId, quantity, color } = req.body;

    const user = await getOrCreateUserDoc(clerkId);
    const existingItem = user.cart.find(
      item => item.productId.toString() === productId && item.color === color
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ productId, quantity, color });
    }

    await user.save();
    await user.populate({
      path: 'cart.productId',
      model: 'Product'
    });
    res.json(user.cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update cart item quantity
exports.updateCartItemQuantity = async (req, res) => {
  try {
    const { clerkId } = req.params;
    const { productId, quantity, color } = req.body;

    const user = await getOrCreateUserDoc(clerkId);
    const cartItem = user.cart.find(
      item => item.productId.toString() === productId && item.color === color
    );

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    cartItem.quantity = quantity;
    await user.save();
    await user.populate({
      path: 'cart.productId',
      model: 'Product'
    });
    res.json(user.cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { clerkId } = req.params;
    const { productId, color } = req.body;

    const user = await getOrCreateUserDoc(clerkId);
    user.cart = user.cart.filter(
      item => !(item.productId.toString() === productId && item.color === color)
    );

    await user.save();
    await user.populate({
      path: 'cart.productId',
      model: 'Product'
    });
    res.json(user.cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get wishlist
exports.getWishlist = async (req, res) => {
  try {
    const user = await getOrCreateUserDoc(req.params.clerkId);
    await user.populate('wishlist');
    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { clerkId } = req.params;
    const { productId } = req.body;

    const user = await getOrCreateUserDoc(clerkId);
    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }

    await user.populate('wishlist');
    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { clerkId } = req.params;
    const { productId } = req.body;

    const user = await getOrCreateUserDoc(clerkId);
    user.wishlist = user.wishlist.filter(
      id => id.toString() !== productId
    );

    await user.save();
    await user.populate('wishlist');
    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 