const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDashboardStats,
  getMyDashboardStats
} = require('../controllers/dashboardController');

// All routes are protected
router.use(protect);

// Dashboard routes
router.get('/stats', getDashboardStats);
router.get('/my-stats', getMyDashboardStats);

module.exports = router;
