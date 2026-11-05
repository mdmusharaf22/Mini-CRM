const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  industry: {
    type: String,
    trim: true,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  website: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
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

// Index for search
companySchema.index({ name: 'text', industry: 'text', location: 'text' });

// Query helper to exclude soft-deleted documents
companySchema.query.notDeleted = function() {
  return this.where({ isDeleted: false });
};

module.exports = mongoose.model('Company', companySchema);
