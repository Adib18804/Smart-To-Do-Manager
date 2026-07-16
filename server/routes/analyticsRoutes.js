const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/dashboard', requireAuth, analyticsController.getDashboardData);

module.exports = router;
