const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  updateLeadStatus,
  deleteLead,
  getDeletedLeads,
  restoreLead
} = require('../controllers/leadController');

// All routes are protected
router.use(protect);

// Deleted leads routes (must be before /:id routes)
router.get('/deleted/all', getDeletedLeads);
router.patch('/:id/restore', restoreLead);

// Lead CRUD routes
router.route('/')
  .get(getLeads)
  .post(createLead);

router.route('/:id')
  .get(getLead)
  .put(updateLead)
  .delete(deleteLead);

// Update lead status
router.patch('/:id/status', updateLeadStatus);

module.exports = router;
