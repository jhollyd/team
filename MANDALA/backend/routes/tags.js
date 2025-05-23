const express = require('express');
const router = express.Router();
const tagsController = require('../controllers/tags');
const { isAdmin } = require('../middleware/auth');

// Get all tags
router.get('/', tagsController.getAllTags);

// Create new tag (admin only)
router.post('/', isAdmin, tagsController.createTag);

// Delete tag (admin only)
router.delete('/:id', isAdmin, tagsController.deleteTag);

module.exports = router; 