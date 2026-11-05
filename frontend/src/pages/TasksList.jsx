
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip
} from '@mui/material';

import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';

const statusColors = {
  Pending: 'warning',
  'In Progress': 'info',
  Completed: 'success',
  Cancelled: 'error'
};

const priorityColors = {
  Low: 'info',
  Medium: 'warning',
  High: 'error'
};

const initialFormData = {
  title: '',
  description: '',
  lead: '',
  assignedTo: '',
  status: 'Pending',
  priority: 'Medium',
  dueDate: ''
};

export default function TasksList() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  
  // Delete confirmation dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [page, rowsPerPage, statusFilter]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);

      const params = {
        page: page + 1,
        limit: rowsPerPage
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await axios.get('/tasks', { params });

      if (response.data.success) {
        setTasks(response.data.data.tasks);
        setTotal(response.data.data.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users and leads
  const fetchDropdownData = async () => {
    try {
      const [usersRes, leadsRes] = await Promise.all([
        axios.get('/auth/users'),
        axios.get('/leads', { params: { limit: 100 } })
      ]);

      if (usersRes.data.success) {
        setUsers(usersRes.data.data.users);
      }

      if (leadsRes.data.success) {
        setLeads(leadsRes.data.data.leads);
      }
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  // Status filter
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Update task status
  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const response = await axios.patch(
        `/tasks/${taskId}/status`,
        { status: newStatus }
      );

      if (response.data.success) {
        toast.success('Task status updated successfully!');
        fetchTasks();
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      toast.error(
        err.response?.data?.message ||
        'Failed to update task status'
      );
    }
  };

  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Open add/edit dialog
  const handleOpenDialog = (task = null) => {
    if (task) {
      setEditingTask(task);

      setFormData({
        title: task.title || '',
        description: task.description || '',
        lead: task.lead?._id || '',
        assignedTo: task.assignedTo?._id || '',
        status: task.status || 'Pending',
        priority: task.priority || 'Medium',
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().split('T')[0]
          : ''
      });
    } else {
      setEditingTask(null);
      setFormData({ ...initialFormData });
    }

    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    if (submitLoading) return;

    setOpenDialog(false);
    setEditingTask(null);
    setFormData({ ...initialFormData });
  };

  // Create or update task
  const handleCreateTask = async () => {
    if (
      !formData.title.trim() ||
      !formData.lead ||
      !formData.assignedTo ||
      !formData.dueDate
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitLoading(true);

      let response;

      if (editingTask) {
        response = await axios.put(
          `/tasks/${editingTask._id}`,
          formData
        );

        if (response.data.success) {
          toast.success('Task updated successfully!');
        }
      } else {
        response = await axios.post('/tasks', formData);

        if (response.data.success) {
          toast.success('Task created successfully!');
        }
      }

      if (response.data.success) {
        setOpenDialog(false);
        setEditingTask(null);
        setFormData({ ...initialFormData });

        fetchTasks();
      }
    } catch (err) {
      console.error('Error saving task:', err);

      toast.error(
        err.response?.data?.message ||
        'Failed to save task'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId, taskTitle) => {
    setSelectedTask({ taskId, taskTitle });
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!selectedTask) return;

    try {
      const response = await axios.delete(`/tasks/${selectedTask.taskId}`);

      if (response.data.success) {
        toast.success('Task deleted successfully!');
        fetchTasks();
      }
    } catch (err) {
      console.error('Error deleting task:', err);

      toast.error(
        err.response?.data?.message ||
        'Failed to delete task'
      );
    } finally {
      setDeleteConfirmOpen(false);
      setSelectedTask(null);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check overdue
  const isOverdue = (dueDate) => {
    if (!dueDate) return false;

    const due = new Date(dueDate);
    const today = new Date();

    return (
      due < today &&
      due.toDateString() !== today.toDateString()
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold' }}
        >
          Tasks
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Task
        </Button>
      </Box>

      {/* Status Filter */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="In Progress">In Progress</MenuItem>
          <MenuItem value="Completed">Completed</MenuItem>
          <MenuItem value="Cancelled">Cancelled</MenuItem>
        </TextField>
      </Paper>

      {/* Tasks Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              p: 4
            }}
          >
            <CircularProgress />
          </Box>
        ) : tasks.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              No tasks found
            </Typography>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    Title
                  </TableCell>

                  <TableCell sx={{ fontWeight: 'bold' }}>
                    Lead
                  </TableCell>

                  <TableCell sx={{ fontWeight: 'bold' }}>
                    Due Date
                  </TableCell>

                  <TableCell sx={{ fontWeight: 'bold' }}>
                    Status
                  </TableCell>

                  <TableCell sx={{ fontWeight: 'bold' }}>
                    Priority
                  </TableCell>

                  <TableCell sx={{ fontWeight: 'bold' }}>
                    Assigned To
                  </TableCell>

                  <TableCell sx={{ fontWeight: 'bold' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task._id} hover>
                    <TableCell>{task.title}</TableCell>

                    <TableCell>
                      {task.lead?.name || 'N/A'}
                    </TableCell>

                    <TableCell>
                      <Box>
                        {formatDate(task.dueDate)}

                        {isOverdue(task.dueDate) &&
                          task.status !== 'Completed' && (
                            <Chip
                              label="Overdue"
                              color="error"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={task.status}
                        color={statusColors[task.status] || 'default'}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={task.priority}
                        color={priorityColors[task.priority] || 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>

                    <TableCell>
                      {task.assignedTo?.name || 'Unassigned'}
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {task.status !== 'Completed' &&
                          (
                            task.assignedTo?._id === user?.id ||
                            user?.role === 'admin'
                          ) && (
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() =>
                                handleUpdateStatus(
                                  task._id,
                                  'Completed'
                                )
                              }
                              title="Mark as Complete"
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          )}

                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(task)}
                          title="Edit Task"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>

                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            handleDeleteTask(task._id, task.title)
                          }
                          title="Delete Task"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </TableContainer>

      {/* Add / Edit Task Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: { xs: 0, sm: 1 }
          }
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            fontSize: '1.4rem',
            pb: 1
          }}
        >
          {editingTask ? 'Edit Task' : 'Add New Task'}
        </DialogTitle>

        <DialogContent>
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateTask();
            }}
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                sm: 'repeat(2, minmax(0, 1fr))'
              },
              gap: 2.5,
              mt: 2
            }}
          >
            {/* Title */}
            <TextField
              required
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
            />

            {/* Description */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
            />

            {/* Lead */}
            <TextField
              select
              required
              fullWidth
              label="Lead"
              name="lead"
              value={formData.lead}
              onChange={handleFormChange}
            >
              <MenuItem value="" disabled>
                Select Lead
              </MenuItem>

              {leads.map((lead) => (
                <MenuItem key={lead._id} value={lead._id}>
                  {lead.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Assigned To */}
            <TextField
              select
              required
              fullWidth
              label="Assigned To"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleFormChange}
            >
              <MenuItem value="" disabled>
                Select User
              </MenuItem>

              {users.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Status */}
            <TextField
              select
              fullWidth
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleFormChange}
            >
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </TextField>

            {/* Priority */}
            <TextField
              select
              fullWidth
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleFormChange}
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </TextField>

            {/* Due Date */}
            <Box
  sx={{
    gridColumn: {
      xs: 'auto',
      sm: '1 / -1'
    },
    width: '100%'
  }}
>
  <Typography
    variant="body2"
    sx={{
      mb: 0.8,
      fontWeight: 500,
      color: 'text.secondary'
    }}
  >
    Due Date *
  </Typography>

  <TextField
    required
    fullWidth
    type="date"
    name="dueDate"
    value={formData.dueDate}
    onChange={handleFormChange}
    inputProps={{
      min: new Date().toISOString().split('T')[0]
    }}
  />
</Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            gap: 1
          }}
        >
          <Button
            onClick={handleCloseDialog}
            disabled={submitLoading}
            color="inherit"
          >
            Cancel
          </Button>

          <Button
            onClick={handleCreateTask}
            variant="contained"
            disabled={submitLoading}
            sx={{
              px: 3,
              minWidth: 140
            }}
          >
            {submitLoading
              ? editingTask
                ? 'Updating...'
                : 'Creating...'
              : editingTask
                ? 'Update Task'
                : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete task <strong>"{selectedTask?.taskTitle}"</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => {
              setDeleteConfirmOpen(false);
              setSelectedTask(null);
            }}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteTask}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
