const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Activity = require('../models/activityModel');

const authController = {
  /**
   * Register a new user
   */
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'All fields are required.' });
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

      // Create user
      const userId = await User.create(name, email, hashedPassword);

      // Setup session
      req.session.userId = userId;
      req.session.userName = name;

      // Log activity
      await Activity.log(userId, 'Create', 'Authentication', `New user registered: ${name}`);

      return res.status(201).json({
        success: true,
        message: 'Registration successful!',
        user: { name, email }
      });
    } catch (error) {
      console.error('Registration Error:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Log in an existing user
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required.' });
      }

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(400).json({ success: false, error: 'Invalid email or password.' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, error: 'Invalid email or password.' });
      }

      // Set session
      req.session.userId = user.user_id;
      req.session.userName = user.name;

      return res.json({
        success: true,
        message: 'Login successful!',
        user: { name: user.name, email: user.email }
      });
    } catch (error) {
      console.error('Login Error:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Check session user profile
   */
  async getProfile(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ success: false, error: 'Not logged in.' });
      }
      
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }
      
      return res.json({ success: true, user });
    } catch (error) {
      console.error('Profile Error:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
  },

  /**
   * Log out the current user session
   */
  async logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ success: false, error: 'Could not log out.' });
      }
      res.clearCookie('sid'); // Match express-session cookie name standard (we'll name it 'sid')
      return res.json({ success: true, message: 'Logged out successfully.' });
    });
  }
};

module.exports = authController;
