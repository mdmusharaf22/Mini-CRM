const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lead name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Qualified', 'Lost', 'Won'],
    default: 'New'
  },
  source: {
    type: String,
    enum: ['Website', 'Referral', 'Social Media', 'Cold Call', 'Other'],
    default: 'Other'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for search and filtering
leadSchema.index({ name: 'text', email: 'text' });
leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ company: 1 });
leadSchema.index({ isDeleted: 1 });

// Query helper to exclude soft-deleted documents
leadSchema.query.notDeleted = function() {
  return this.where({ isDeleted: false });
};

module.exports = mongoose.model('Lead', leadSchema);
