const User = require('../models/users');

const isAdmin = async (req, res, next) => {
  try {
    const clerkId = req.headers['x-clerk-id'];
    if (!clerkId) {
      return res.status(401).json({ message: 'No Clerk ID provided' });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error in isAdmin middleware:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  isAdmin
}; 