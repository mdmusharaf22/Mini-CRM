const Company = require('../models/Company');
const Lead = require('../models/Lead');

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private
exports.getCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    // Build query - exclude soft-deleted companies and filter by current user
    const query = { 
      isDeleted: false,
      createdBy: req.user._id
    };

    // Search by name, industry, or location
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await Company.countDocuments(query);

    // Fetch companies with pagination
    const companies = await Company.find(query)
      .populate('createdBy', 'name email')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        companies,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companies'
    });
  }
};

// @desc    Get single company by ID
// @route   GET /api/companies/:id
// @access  Private
exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.params.id,
      isDeleted: false,
      createdBy: req.user._id
    }).populate('createdBy', 'name email');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { company }
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company'
    });
  }
};

// @desc    Get company with associated leads
// @route   GET /api/companies/:id/leads
// @access  Private
exports.getCompanyLeads = async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.params.id,
      isDeleted: false,
      createdBy: req.user._id
    }).populate('createdBy', 'name email');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get all leads associated with this company (not deleted) and owned by current user
    const leads = await Lead.find({
      company: req.params.id,
      isDeleted: false,
      createdBy: req.user._id
    })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        company,
        leads
      }
    });
  } catch (error) {
    console.error('Get company leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company leads'
    });
  }
};

// @desc    Create new company
// @route   POST /api/companies
// @access  Private
exports.createCompany = async (req, res) => {
  try {
    const { name, industry, location, website, phone, email, notes } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide company name'
      });
    }

    // Create company
    const company = await Company.create({
      name,
      industry: industry || '',
      location: location || '',
      website: website || '',
      phone: phone || '',
      email: email || '',
      notes: notes || '',
      createdBy: req.user._id
    });

    // Populate references
    await company.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: { company }
    });
  } catch (error) {
    console.error('Create company error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating company'
    });
  }
};

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private
exports.updateCompany = async (req, res) => {
  try {
    const { name, industry, location, website, phone, email, notes } = req.body;

    // Find company (not deleted) and owned by current user
    let company = await Company.findOne({
      _id: req.params.id,
      isDeleted: false,
      createdBy: req.user._id
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Update fields
    company.name = name || company.name;
    company.industry = industry !== undefined ? industry : company.industry;
    company.location = location !== undefined ? location : company.location;
    company.website = website !== undefined ? website : company.website;
    company.phone = phone !== undefined ? phone : company.phone;
    company.email = email !== undefined ? email : company.email;
    company.notes = notes !== undefined ? notes : company.notes;

    await company.save();

    // Populate references
    await company.populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: { company }
    });
  } catch (error) {
    console.error('Update company error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating company'
    });
  }
};

// @desc    Soft delete company
// @route   DELETE /api/companies/:id
// @access  Private
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.params.id,
      isDeleted: false,
      createdBy: req.user._id
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if company has associated leads owned by current user
    const associatedLeadsCount = await Lead.countDocuments({
      company: req.params.id,
      isDeleted: false,
      createdBy: req.user._id
    });

    if (associatedLeadsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete company. It has ${associatedLeadsCount} associated lead${associatedLeadsCount > 1 ? 's' : ''}. Please remove or reassign the leads first.`
      });
    }

    // Soft delete
    company.isDeleted = true;
    await company.save();

    res.status(200).json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting company'
    });
  }
};
