const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products');
const { isAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../frontend/src/images');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Get the filename from the query parameters
    const customName = req.query.filename;
    
    // Validate filename
    if (!customName || typeof customName !== 'string' || !customName.trim()) {
      return cb(new Error('Filename is required'), null);
    }

    // Get the file extension from the original file
    const ext = path.extname(file.originalname);
    // Create the full filename with extension
    const filename = customName.trim() + ext;

    // Check if file already exists
    const filePath = path.join(__dirname, '../../frontend/src/images', filename);
    if (fs.existsSync(filePath)) {
      return cb(new Error('A file with this name already exists'), null);
    }

    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

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

// Upload image (admin only)
router.post('/upload-image', isAdmin, (req, res, next) => {
  upload.single('image')(req, res, function(err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Return the filename
      res.json({
        message: 'Image uploaded successfully',
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ 
        message: error.message || 'Error uploading image'
      });
    }
  });
});

// Error handling middleware for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    return res.status(400).json({
      message: err.message || 'Error uploading file'
    });
  } else if (err) {
    // An unknown error occurred
    console.error('Unknown error:', err);
    return res.status(500).json({
      message: err.message || 'An unknown error occurred'
    });
  }
  next();
});

module.exports = router;

