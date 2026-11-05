const Lead = require('../models/Lead');
const Task = require('../models/Task');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    // Get total leads (not deleted)
    const totalLeads = await Lead.countDocuments({ isDeleted: false });

    // Get qualified leads (status: Qualified)
    const qualifiedLeads = await Lead.countDocuments({
      isDeleted: false,
      status: 'Qualified'
    });

    // Get tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksDueToday = await Task.countDocuments({
      isDeleted: false,
      dueDate: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Get completed tasks (status: Completed)
    const completedTasks = await Task.countDocuments({
      isDeleted: false,
      status: 'Completed'
    });

    // Get leads by status breakdown
    const leadsByStatus = await Lead.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get tasks by status breakdown
    const tasksByStatus = await Task.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent leads (last 5)
    const recentLeads = await Lead.find({ isDeleted: false })
      .populate('assignedTo', 'name email')
      .populate('company', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get upcoming tasks (next 5 by due date)
    const upcomingTasks = await Task.find({ isDeleted: false })
      .populate('assignedTo', 'name email')
      .populate('lead', 'name')
      .sort({ dueDate: 1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalLeads,
          qualifiedLeads,
          tasksDueToday,
          completedTasks
        },
        leadsByStatus,
        tasksByStatus,
        recentLeads,
        upcomingTasks
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
};

// @desc    Get user-specific dashboard statistics
// @route   GET /api/dashboard/my-stats
// @access  Private
exports.getMyDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get leads assigned to current user
    const myLeads = await Lead.countDocuments({
      isDeleted: false,
      assignedTo: userId
    });

    // Get qualified leads assigned to current user
    const myQualifiedLeads = await Lead.countDocuments({
      isDeleted: false,
      assignedTo: userId,
      status: 'Qualified'
    });

    // Get tasks assigned to current user
    const myTasks = await Task.countDocuments({
      isDeleted: false,
      assignedTo: userId
    });

    // Get tasks due today for current user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const myTasksDueToday = await Task.countDocuments({
      isDeleted: false,
      assignedTo: userId,
      dueDate: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Get completed tasks for current user
    const myCompletedTasks = await Task.countDocuments({
      isDeleted: false,
      assignedTo: userId,
      status: 'Completed'
    });

    // Get pending tasks for current user
    const myPendingTasks = await Task.countDocuments({
      isDeleted: false,
      assignedTo: userId,
      status: 'Pending'
    });

    // Get my upcoming tasks
    const myUpcomingTasks = await Task.find({
      isDeleted: false,
      assignedTo: userId,
      status: { $ne: 'Completed' }
    })
      .populate('lead', 'name status')
      .sort({ dueDate: 1 })
      .limit(5);

    // Get my recent leads
    const myRecentLeads = await Lead.find({
      isDeleted: false,
      assignedTo: userId
    })
      .populate('company', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          myLeads,
          myQualifiedLeads,
          myTasks,
          myTasksDueToday,
          myCompletedTasks,
          myPendingTasks
        },
        myUpcomingTasks,
        myRecentLeads
      }
    });
  } catch (error) {
    console.error('Get my dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your dashboard statistics'
    });
  }
};
