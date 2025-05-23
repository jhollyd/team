const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Import the User model
const User = require('../backend/models/users');

async function updateUserToAdmin(email) {
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User updated successfully:', {
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.log('Please provide an email address');
  process.exit(1);
}

updateUserToAdmin(email); 