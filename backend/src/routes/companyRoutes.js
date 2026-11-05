const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCompanies,
  getCompany,
  getCompanyLeads,
  createCompany,
  updateCompany,
  deleteCompany
} = require('../controllers/companyController');

// All routes are protected
router.use(protect);

// Company CRUD routes
router.route('/')
  .get(getCompanies)
  .post(createCompany);

router.route('/:id')
  .get(getCompany)
  .put(updateCompany)
  .delete(deleteCompany);

// Get company with associated leads
router.get('/:id/leads', getCompanyLeads);

module.exports = router;
