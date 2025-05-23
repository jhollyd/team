const Product = require('../models/products');
const User = require('../models/users');
const { removeProductFromAllUsers } = require('./users');

// Get all products (filtered by isActive for public access)
exports.getAllProducts = async (req, res) => {
  try {
    // If the request is from the admin panel (has x-clerk-id header), return all products
    // Otherwise, only return active products
    const query = req.headers['x-clerk-id'] ? {} : { isActive: true };
    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // If not admin and product is inactive, return 404
    if (!req.headers['x-clerk-id'] && !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  const product = new Product({
    name: req.body.name,
    price: req.body.price,
    image: req.body.image,
    tags: req.body.tags || [],
    isActive: req.body.isActive ?? true // Default to true if not provided
  });

  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // If the product is being delisted (isActive changing from true to false)
    if (product.isActive && updates.isActive === false) {
      // Remove product from all users' carts and wishlists
      await removeProductFromAllUsers(id);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Remove product from all users' carts and wishlists
    await removeProductFromAllUsers(id);

    // Delete the product
    await Product.findByIdAndDelete(id);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: error.message });
  }
}; 