const User = require('../models/userModel');
const Activity = require('../models/activityModel');
const bcrypt = require('bcryptjs');

const userController = {
  /**
   * Get all users (Super Admin only)
   */
  async getAll(req, res) {
    try {
      const users = await User.getAll();
      return res.json({ success: true, users });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Get a single user details (Super Admin only)
   */
  async getOne(req, res) {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }
      return res.json({ success: true, user });
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Create a new user (Super Admin only)
   */
  async create(req, res) {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !name.trim() || !email || !email.trim() || !password) {
        return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, error: 'Invalid email address format.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
      }

      // Check if user exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'Email already registered.' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userId = await User.create(name, email, hashedPassword, role || 'User');

      // Log this action
      await Activity.log(req.session.userId, 'Create', 'Users', `Created user: "${name}"`);

      return res.status(201).json({ success: true, message: 'User created successfully.', userId });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Update an existing user (Super Admin only)
   */
  async update(req, res) {
    try {
      const userId = req.params.id;
      const { name, email, role, password } = req.body;

      if (!name || !name.trim() || !email || !email.trim()) {
        return res.status(400).json({ success: false, error: 'Name and email are required.' });
      }

      // Check if user exists
      const originalUser = await User.findById(userId);
      if (!originalUser) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      // Check for duplicate email
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.user_id !== parseInt(userId)) {
        return res.status(400).json({ success: false, error: 'Email already in use.' });
      }

      // Update user details
      if (password) {
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await User.updatePassword(userId, hashedPassword);
      }

      const updated = await User.updateUser(userId, { name, email, role });
      if (!updated) {
        return res.status(400).json({ success: false, error: 'Failed to update user.' });
      }

      await Activity.log(req.session.userId, 'Update', 'Users', `Updated user: "${name}"`);

      return res.json({ success: true, message: 'User updated successfully.' });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Delete a user (Super Admin only)
   */
  async delete(req, res) {
    try {
      const userId = req.params.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      // Prevent deleting yourself
      if (parseInt(userId) === req.session.userId) {
        return res.status(400).json({ success: false, error: 'You cannot delete your own account.' });
      }

      const deleted = await User.deleteUser(userId);
      if (!deleted) {
        return res.status(400).json({ success: false, error: 'Failed to delete user.' });
      }

      await Activity.log(req.session.userId, 'Delete', 'Users', `Deleted user: "${user.name}"`);

      return res.json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  }
};

module.exports = userController;
