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
  TextField,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';
import axios from '../api/axios';

const statusColors = {
  'New': 'primary',
  'Contacted': 'info',
  'Qualified': 'success',
  'Lost': 'error',
  'Won': 'success'
};

const initialFormData = {
  name: '',
  email: '',
  phone: '',
  status: 'New',
  source: 'Other',
  assignedTo: '',
  company: '',
  notes: ''
};

export default function LeadsList() {
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  
  const [currentTab, setCurrentTab] = useState(0); // 0 = Active, 1 = Deleted
  
  // Confirmation dialogs
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    fetchLeads();
  }, [page, rowsPerPage, search, statusFilter, currentTab]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Fetch leads (active or deleted based on tab)
  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage
      };
      
      if (search) params.search = search;
      if (statusFilter && currentTab === 0) params.status = statusFilter;

      const endpoint = currentTab === 0 ? '/leads' : '/leads/deleted/all';
      const response = await axios.get(endpoint, { params });
      
      if (response.data.success) {
        setLeads(response.data.data.leads);
        setTotal(response.data.data.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users and companies for dropdowns
  const fetchDropdownData = async () => {
    try {
      const [usersRes, companiesRes] = await Promise.all([
        axios.get('/auth/users'),
        axios.get('/companies', { params: { limit: 100 } })
      ]);

      if (usersRes.data.success) {
        setUsers(usersRes.data.data.users);
      }

      if (companiesRes.data.success) {
        setCompanies(companiesRes.data.data.companies);
      }
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setPage(0);
    setSearch('');
    setSearchInput('');
    setStatusFilter('');
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
  const handleOpenDialog = (lead = null) => {
    if (lead) {
      setEditingLead(lead);
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        status: lead.status || 'New',
        source: lead.source || 'Other',
        assignedTo: lead.assignedTo?._id || '',
        company: lead.company?._id || '',
        notes: lead.notes || ''
      });
    } else {
      setEditingLead(null);
      setFormData({ ...initialFormData });
    }
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    if (submitLoading) return;
    setOpenDialog(false);
    setEditingLead(null);
    setFormData({ ...initialFormData });
  };

  // Create or update lead
  const handleSaveLead = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please provide name and email');
      return;
    }

    try {
      setSubmitLoading(true);

      const payload = {
        ...formData,
        assignedTo: formData.assignedTo || null,
        company: formData.company || null
      };

      let response;
      if (editingLead) {
        response = await axios.put(`/leads/${editingLead._id}`, payload);
        if (response.data.success) {
          toast.success('Lead updated successfully!');
        }
      } else {
        response = await axios.post('/leads', payload);
        if (response.data.success) {
          toast.success('Lead created successfully!');
        }
      }

      if (response.data.success) {
        setOpenDialog(false);
        setEditingLead(null);
        setFormData({ ...initialFormData });
        fetchLeads();
      }
    } catch (err) {
      console.error('Error saving lead:', err);
      toast.error(err.response?.data?.message || 'Failed to save lead');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    setSelectedLead({ id, name });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedLead) return;

    try {
      const response = await axios.delete(`/leads/${selectedLead.id}`);
      
      if (response.data.success) {
        toast.success('Lead deleted successfully!');
        fetchLeads();
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
      toast.error(err.response?.data?.message || 'Failed to delete lead');
    } finally {
      setDeleteConfirmOpen(false);
      setSelectedLead(null);
    }
  };

  const handleRestore = async (id, name) => {
    setSelectedLead({ id, name });
    setRestoreConfirmOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedLead) return;

    try {
      const response = await axios.patch(`/leads/${selectedLead.id}/restore`);
      
      if (response.data.success) {
        toast.success('Lead restored successfully!');
        fetchLeads();
      }
    } catch (err) {
      console.error('Error restoring lead:', err);
      toast.error(err.response?.data?.message || 'Failed to restore lead');
    } finally {
      setRestoreConfirmOpen(false);
      setSelectedLead(null);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Leads
        </Typography>
        {currentTab === 0 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Lead
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Active Leads" />
          <Tab label="Deleted Leads" />
        </Tabs>
      </Paper>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by name or email"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
          >
            Search
          </Button>
          {currentTab === 0 && (
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              sx={{ minWidth: 150 }}
              SelectProps={{
                native: false,
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="New">New</MenuItem>
              <MenuItem value="Contacted">Contacted</MenuItem>
              <MenuItem value="Qualified">Qualified</MenuItem>
              <MenuItem value="Lost">Lost</MenuItem>
              <MenuItem value="Won">Won</MenuItem>
            </TextField>
          )}
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : leads.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              No leads found
            </Typography>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Assigned To</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead._id} hover>
                    <TableCell>{lead.name}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={lead.status}
                        color={statusColors[lead.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {lead.assignedTo ? lead.assignedTo.name : 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      {currentTab === 0 ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(lead)}
                            title="Edit Lead"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(lead._id, lead.name)}
                            title="Delete Lead"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleRestore(lead._id, lead.name)}
                          title="Restore Lead"
                        >
                          <RestoreIcon fontSize="small" />
                        </IconButton>
                      )}
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

      {/* Add / Edit Lead Dialog */}
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
          {editingLead ? 'Edit Lead' : 'Add New Lead'}
        </DialogTitle>

        <DialogContent>
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveLead();
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
            {/* Name */}
            <TextField
              required
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              disabled={submitLoading}
            />

            {/* Email */}
            <TextField
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFormChange}
              disabled={submitLoading}
            />

            {/* Phone */}
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleFormChange}
              disabled={submitLoading}
            />

            {/* Status */}
            <TextField
              select
              fullWidth
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleFormChange}
              disabled={submitLoading}
            >
              <MenuItem value="New">New</MenuItem>
              <MenuItem value="Contacted">Contacted</MenuItem>
              <MenuItem value="Qualified">Qualified</MenuItem>
              <MenuItem value="Lost">Lost</MenuItem>
              <MenuItem value="Won">Won</MenuItem>
            </TextField>

            {/* Source */}
            <TextField
              select
              fullWidth
              label="Source"
              name="source"
              value={formData.source}
              onChange={handleFormChange}
              disabled={submitLoading}
            >
              <MenuItem value="Website">Website</MenuItem>
              <MenuItem value="Referral">Referral</MenuItem>
              <MenuItem value="Social Media">Social Media</MenuItem>
              <MenuItem value="Cold Call">Cold Call</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>

            {/* Assigned To */}
            <TextField
              select
              fullWidth
              label="Assigned To"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleFormChange}
              disabled={submitLoading}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {users.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Company */}
            <TextField
              select
              fullWidth
              label="Company"
              name="company"
              value={formData.company}
              onChange={handleFormChange}
              disabled={submitLoading}
            >
              <MenuItem value="">None</MenuItem>
              {companies.map((company) => (
                <MenuItem key={company._id} value={company._id}>
                  {company.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Notes */}
            <Box
              sx={{
                gridColumn: {
                  xs: 'auto',
                  sm: '1 / -1'
                }
              }}
            >
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                disabled={submitLoading}
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
            onClick={handleSaveLead}
            variant="contained"
            disabled={submitLoading}
            sx={{
              px: 3,
              minWidth: 140
            }}
          >
            {submitLoading
              ? editingLead
                ? 'Updating...'
                : 'Creating...'
              : editingLead
                ? 'Update Lead'
                : 'Create Lead'}
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
            Are you sure you want to delete lead <strong>"{selectedLead?.name}"</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            The lead will be moved to the Deleted Leads tab and can be restored later.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => {
              setDeleteConfirmOpen(false);
              setSelectedLead(null);
            }}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog
        open={restoreConfirmOpen}
        onClose={() => setRestoreConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Confirm Restore
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore lead <strong>"{selectedLead?.name}"</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            The lead will be moved back to the Active Leads tab.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => {
              setRestoreConfirmOpen(false);
              setSelectedLead(null);
            }}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmRestore}
            variant="contained"
            color="success"
          >
            Restore
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
