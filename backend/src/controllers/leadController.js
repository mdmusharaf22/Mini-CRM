const Lead = require('../models/Lead');

// @desc    Get all leads with pagination, search, and filtering
// @route   GET /api/leads
// @access  Private
exports.getLeads = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      assignedTo = ''
    } = req.query;

    // Build query - exclude soft-deleted leads and filter by current user
    const query = { 
      isDeleted: false,
      createdBy: req.user._id
    };

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by assigned user
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await Lead.countDocuments(query);

    // Fetch leads with pagination
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .populate('company', 'name industry location')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        leads,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leads'
    });
  }
};

// @desc    Get single lead by ID
// @route   GET /api/leads/:id
// @access  Private
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      isDeleted: false,
      createdBy: req.user._id
    })
      .populate('assignedTo', 'name email')
      .populate('company', 'name industry location')
      .populate('createdBy', 'name email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { lead }
    });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lead'
    });
  }
};

// @desc    Create new lead
// @route   POST /api/leads
// @access  Private
exports.createLead = async (req, res) => {
  try {
    const { name, email, phone, status, source, assignedTo, company, notes } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and email'
      });
    }

    // Create lead
    const lead = await Lead.create({
      name,
      email,
      phone,
      status: status || 'New',
      source: source || 'Other',
      assignedTo: assignedTo || null,
      company: company || null,
      notes: notes || '',
      createdBy: req.user._id
    });

    // Populate references
    await lead.populate('assignedTo', 'name email');
    await lead.populate('company', 'name industry location');
    await lead.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: { lead }
    });
  } catch (error) {
    console.error('Create lead error:', error);

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
      message: 'Error creating lead'
    });
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
exports.updateLead = async (req, res) => {
  try {
    const { name, email, phone, status, source, assignedTo, company, notes } = req.body;

    // Find lead (not deleted) and owned by current user
    let lead = await Lead.findOne({
      _id: req.params.id,
      isDeleted: false,
      createdBy: req.user._id
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Update fields
    lead.name = name || lead.name;
    lead.email = email || lead.email;
    lead.phone = phone !== undefined ? phone : lead.phone;
    lead.status = status || lead.status;
    lead.source = source || lead.source;
    lead.assignedTo = assignedTo !== undefined ? assignedTo : lead.assignedTo;
    lead.company = company !== undefined ? company : lead.company;
    lead.notes = notes !== undefined ? notes : lead.notes;

    await lead.save();

    // Populate references
    await lead.populate('assignedTo', 'name email');
    await lead.populate('company', 'name industry location');
    await lead.populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: { lead }
    });
  } catch (error) {
    console.error('Update lead error:', error);

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
      message: 'Error updating lead'
    });
  }
};

// @desc    Update lead status
// @route   PATCH /api/leads/:id/status
// @access  Private
exports.updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status'
      });
    }

    const lead = await Lead.findOneAndUpdate(
      { 
        _id: req.params.id, 
        isDeleted: false,
        createdBy: req.user._id
      },
      { status },
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email')
      .populate('company', 'name industry location')
      .populate('createdBy', 'name email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lead status updated successfully',
      data: { lead }
    });
  } catch (error) {
    console.error('Update lead status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating lead status'
    });
  }
};

// @desc    Soft delete lead
// @route   DELETE /api/leads/:id
// @access  Private
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      isDeleted: false,
      createdBy: req.user._id
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Soft delete
    lead.isDeleted = true;
    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting lead'
    });
  }
};

// @desc    Get deleted leads
// @route   GET /api/leads/deleted/all
// @access  Private
exports.getDeletedLeads = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = ''
    } = req.query;

    // Build query - only deleted leads owned by current user
    const query = { 
      isDeleted: true,
      createdBy: req.user._id
    };

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await Lead.countDocuments(query);

    // Fetch deleted leads with pagination
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .populate('company', 'name industry location')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        leads,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get deleted leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deleted leads'
    });
  }
};

// @desc    Restore deleted lead
// @route   PATCH /api/leads/:id/restore
// @access  Private
exports.restoreLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      isDeleted: true,
      createdBy: req.user._id
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Deleted lead not found'
      });
    }

    // Restore lead
    lead.isDeleted = false;
    await lead.save();

    // Populate references
    await lead.populate('assignedTo', 'name email');
    await lead.populate('company', 'name industry location');
    await lead.populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Lead restored successfully',
      data: { lead }
    });
  } catch (error) {
    console.error('Restore lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring lead'
    });
  }
};
