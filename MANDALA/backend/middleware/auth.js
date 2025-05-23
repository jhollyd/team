const User = require('../models/users');

const isAdmin = async (req, res, next) => {
  try {
    const clerkId = req.headers['x-clerk-id'];
    if (!clerkId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  isAdmin
}; 