const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: [true, 'Lead is required for task']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must be assigned to a user']
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
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

// Indexes for filtering and sorting
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ lead: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ isDeleted: 1 });

// Query helper to exclude soft-deleted documents
taskSchema.query.notDeleted = function() {
  return this.where({ isDeleted: false });
};

module.exports = mongoose.model('Task', taskSchema);
