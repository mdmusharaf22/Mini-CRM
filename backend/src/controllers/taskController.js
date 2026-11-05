const Task = require('../models/Task');

// @desc    Get all tasks with filtering
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = '',
      assignedTo = '',
      lead = ''
    } = req.query;

    // Build query - exclude soft-deleted tasks and filter by current user
    const query = { 
      isDeleted: false,
      createdBy: req.user._id
    };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by assigned user
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Filter by lead
    if (lead) {
      query.lead = lead;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    // Fetch tasks with pagination
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('lead', 'name email status')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      isDeleted: false,
      createdBy: req.user._id
    })
      .populate('assignedTo', 'name email')
      .populate('lead', 'name email status')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task'
    });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const { title, description, lead, assignedTo, status, priority, dueDate } = req.body;

    // Validation
    if (!title || !lead || !assignedTo || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, lead, assigned user, and due date'
      });
    }

    // Create task
    const task = await Task.create({
      title,
      description: description || '',
      lead,
      assignedTo,
      status: status || 'Pending',
      priority: priority || 'Medium',
      dueDate,
      createdBy: req.user._id
    });

    // Populate references
    await task.populate('assignedTo', 'name email');
    await task.populate('lead', 'name email status');
    await task.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task }
    });
  } catch (error) {
    console.error('Create task error:', error);

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
      message: 'Error creating task'
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const { title, description, lead, assignedTo, status, priority, dueDate } = req.body;

    // Find task (not deleted) and owned by current user
    let task = await Task.findOne({
      _id: req.params.id,
      isDeleted: false,
      createdBy: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update fields
    task.title = title || task.title;
    task.description = description !== undefined ? description : task.description;
    task.lead = lead || task.lead;
    task.assignedTo = assignedTo || task.assignedTo;
    task.status = status || task.status;
    task.priority = priority || task.priority;
    task.dueDate = dueDate || task.dueDate;

    await task.save();

    // Populate references
    await task.populate('assignedTo', 'name email');
    await task.populate('lead', 'name email status');
    await task.populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: { task }
    });
  } catch (error) {
    console.error('Update task error:', error);

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
      message: 'Error updating task'
    });
  }
};

// @desc    Update task status (for assigned users)
// @route   PATCH /api/tasks/:id/status
// @access  Private
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status'
      });
    }

    // Find task (not deleted) and owned by current user
    const task = await Task.findOne({
      _id: req.params.id,
      isDeleted: false,
      createdBy: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user is assigned to this task or created it or is admin
    if (task.assignedTo.toString() !== req.user._id.toString() && 
        task.createdBy.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only assigned users or task creators can update task status'
      });
    }

    // Update status
    task.status = status;
    await task.save();

    // Populate references
    await task.populate('assignedTo', 'name email');
    await task.populate('lead', 'name email status');
    await task.populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: { task }
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task status'
    });
  }
};

// @desc    Soft delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      isDeleted: false,
      createdBy: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Soft delete
    task.isDeleted = true;
    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task'
    });
  }
};

// @desc    Get tasks for current user
// @route   GET /api/tasks/my-tasks
// @access  Private
exports.getMyTasks = async (req, res) => {
  try {
    const { status = '' } = req.query;

    // Build query for current user's tasks
    const query = {
      assignedTo: req.user._id,
      isDeleted: false
    };

    // Filter by status
    if (status) {
      query.status = status;
    }

    const tasks = await Task.find(query)
      .populate('lead', 'name email status')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { tasks }
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your tasks'
    });
  }
};
