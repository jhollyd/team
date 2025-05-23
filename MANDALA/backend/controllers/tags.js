const Tag = require('../models/tags');

// Get all tags
exports.getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find().sort('name');
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new tag
exports.createTag = async (req, res) => {
  try {
    const tag = new Tag({
      name: req.body.name
    });
    const newTag = await tag.save();
    res.status(201).json(newTag);
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error
      res.status(400).json({ message: 'Tag already exists' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

// Delete tag
exports.deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 