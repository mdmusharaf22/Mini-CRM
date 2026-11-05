const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getMyTasks
} = require('../controllers/taskController');

// All routes are protected
router.use(protect);

// Get current user's tasks
router.get('/my-tasks', getMyTasks);

// Task CRUD routes
router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

// Update task status
router.patch('/:id/status', updateTaskStatus);

module.exports = router;
