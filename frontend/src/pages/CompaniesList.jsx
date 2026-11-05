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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import axios from '../api/axios';

const initialFormData = {
  name: '',
  industry: '',
  location: '',
  website: '',
  phone: '',
  email: '',
  notes: ''
};

export default function CompaniesList() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [companyLeads, setCompanyLeads] = useState({});
  
  // Delete confirmation dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, [page, rowsPerPage, search]);

  // Fetch companies
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage
      };
      
      if (search) params.search = search;

      const response = await axios.get('/companies', { params });
      
      if (response.data.success) {
        setCompanies(response.data.data.companies);
        setTotal(response.data.data.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  // Fetch company leads (for expand/collapse)
  const fetchCompanyLeads = async (companyId) => {
    try {
      const response = await axios.get(`/companies/${companyId}/leads`);
      
      if (response.data.success) {
        setCompanyLeads(prev => ({
          ...prev,
          [companyId]: response.data.data.leads
        }));
      }
    } catch (err) {
      console.error('Error fetching company leads:', err);
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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Expand/collapse company details
  const handleToggleExpand = (companyId) => {
    if (expandedCompany === companyId) {
      setExpandedCompany(null);
    } else {
      setExpandedCompany(companyId);
      if (!companyLeads[companyId]) {
        fetchCompanyLeads(companyId);
      }
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
  const handleOpenDialog = (company = null) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name || '',
        industry: company.industry || '',
        location: company.location || '',
        website: company.website || '',
        phone: company.phone || '',
        email: company.email || '',
        notes: company.notes || ''
      });
    } else {
      setEditingCompany(null);
      setFormData({ ...initialFormData });
    }
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    if (submitLoading) return;
    setOpenDialog(false);
    setEditingCompany(null);
    setFormData({ ...initialFormData });
  };

  // Create or update company
  const handleSaveCompany = async () => {
    if (!formData.name.trim()) {
      toast.error('Please provide company name');
      return;
    }

    try {
      setSubmitLoading(true);

      let response;
      if (editingCompany) {
        response = await axios.put(`/companies/${editingCompany._id}`, formData);
        if (response.data.success) {
          toast.success('Company updated successfully!');
        }
      } else {
        response = await axios.post('/companies', formData);
        if (response.data.success) {
          toast.success('Company created successfully!');
        }
      }

      if (response.data.success) {
        setOpenDialog(false);
        setEditingCompany(null);
        setFormData({ ...initialFormData });
        fetchCompanies();
      }
    } catch (err) {
      console.error('Error saving company:', err);
      toast.error(err.response?.data?.message || 'Failed to save company');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    // Check if company has associated leads
    const company = companies.find(c => c._id === id);
    const leadsCount = companyLeads[id]?.length || 0;
    
    // If expanded, we already have the leads count
    if (expandedCompany === id && companyLeads[id]) {
      setSelectedCompany({ id, name, leadsCount });
      setDeleteConfirmOpen(true);
    } else {
      // Fetch leads count first
      try {
        const response = await axios.get(`/companies/${id}/leads`);
        if (response.data.success) {
          const count = response.data.data.leads.length;
          setSelectedCompany({ id, name, leadsCount: count });
          setDeleteConfirmOpen(true);
        }
      } catch (err) {
        console.error('Error fetching company leads:', err);
        toast.error('Failed to verify company leads');
      }
    }
  };

  const confirmDelete = async () => {
    if (!selectedCompany) return;

    // Prevent deletion if there are associated leads
    if (selectedCompany.leadsCount > 0) {
      toast.error(`Cannot delete company. It has ${selectedCompany.leadsCount} associated lead${selectedCompany.leadsCount > 1 ? 's' : ''}. Please remove or reassign the leads first.`);
      setDeleteConfirmOpen(false);
      setSelectedCompany(null);
      return;
    }

    try {
      const response = await axios.delete(`/companies/${selectedCompany.id}`);
      
      if (response.data.success) {
        toast.success('Company deleted successfully!');
        fetchCompanies();
      }
    } catch (err) {
      console.error('Error deleting company:', err);
      toast.error(err.response?.data?.message || 'Failed to delete company');
    } finally {
      setDeleteConfirmOpen(false);
      setSelectedCompany(null);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Companies
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Company
        </Button>
      </Box>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search companies"
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
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : companies.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              No companies found
            </Typography>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: 50 }}></TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Company Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Industry</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companies.map((company) => (
                  <>
                    <TableRow key={company._id} hover>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleExpand(company._id)}
                        >
                          {expandedCompany === company._id ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell>{company.name}</TableCell>
                      <TableCell>{company.industry || '-'}</TableCell>
                      <TableCell>{company.location || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(company)}
                            title="Edit Company"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(company._id, company.name)}
                            title="Delete Company"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Details Row */}
                    <TableRow>
                      <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                        <Collapse in={expandedCompany === company._id} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 3, bgcolor: 'grey.50' }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                              Company Details
                            </Typography>
                            
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
                              <Box>
                                <Typography variant="body2" color="textSecondary">Website</Typography>
                                <Typography variant="body1">{company.website || '-'}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="textSecondary">Phone</Typography>
                                <Typography variant="body1">{company.phone || '-'}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="textSecondary">Email</Typography>
                                <Typography variant="body1">{company.email || '-'}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="textSecondary">Notes</Typography>
                                <Typography variant="body1">{company.notes || '-'}</Typography>
                              </Box>
                            </Box>

                            {/* Associated Leads */}
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                              Associated Leads ({companyLeads[company._id]?.length || 0})
                            </Typography>
                            
                            {companyLeads[company._id] && companyLeads[company._id].length > 0 ? (
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {companyLeads[company._id].map((lead) => (
                                    <TableRow key={lead._id}>
                                      <TableCell>{lead.name}</TableCell>
                                      <TableCell>{lead.email}</TableCell>
                                      <TableCell>{lead.status}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <Typography variant="body2" color="textSecondary">
                                No leads associated with this company
                              </Typography>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
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

      {/* Add / Edit Company Dialog */}
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
          {editingCompany ? 'Edit Company' : 'Add New Company'}
        </DialogTitle>

        <DialogContent>
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveCompany();
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
            {/* Company Name */}
            <TextField
              required
              fullWidth
              label="Company Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              disabled={submitLoading}
            />

            {/* Industry */}
            <TextField
              fullWidth
              label="Industry"
              name="industry"
              value={formData.industry}
              onChange={handleFormChange}
              disabled={submitLoading}
            />

            {/* Location */}
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleFormChange}
              disabled={submitLoading}
            />

            {/* Website */}
            <TextField
              fullWidth
              label="Website"
              name="website"
              type="url"
              value={formData.website}
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

            {/* Email */}
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFormChange}
              disabled={submitLoading}
            />

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
            onClick={handleSaveCompany}
            variant="contained"
            disabled={submitLoading}
            sx={{
              px: 3,
              minWidth: 140
            }}
          >
            {submitLoading
              ? editingCompany
                ? 'Updating...'
                : 'Creating...'
              : editingCompany
                ? 'Update Company'
                : 'Create Company'}
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
          {selectedCompany?.leadsCount > 0 ? 'Cannot Delete Company' : 'Confirm Delete'}
        </DialogTitle>
        <DialogContent>
          {selectedCompany?.leadsCount > 0 ? (
            <>
              <Typography color="error" sx={{ mb: 2 }}>
                Cannot delete company <strong>"{selectedCompany?.name}"</strong>
              </Typography>
              <Typography variant="body2" color="textSecondary">
                This company has <strong>{selectedCompany?.leadsCount}</strong> associated lead{selectedCompany?.leadsCount > 1 ? 's' : ''}. 
                Please remove or reassign the leads before deleting the company.
              </Typography>
            </>
          ) : (
            <>
              <Typography>
                Are you sure you want to delete company <strong>"{selectedCompany?.name}"</strong>?
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                This company has no associated leads and can be safely deleted.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          {selectedCompany?.leadsCount > 0 ? (
            <Button
              onClick={() => {
                setDeleteConfirmOpen(false);
                setSelectedCompany(null);
              }}
              variant="contained"
              fullWidth
            >
              OK
            </Button>
          ) : (
            <>
              <Button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setSelectedCompany(null);
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
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
