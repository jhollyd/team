const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Ensure no duplicate tags
productSchema.pre('save', function(next) {
  this.tags = [...new Set(this.tags)];
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
