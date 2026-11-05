import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  MenuItem,
  CircularProgress,
  Grid
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axios from '../api/axios';

export default function LeadForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'New',
    source: 'Other',
    assignedTo: '',
    company: '',
    notes: ''
  });

  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  useEffect(() => {
    fetchDropdownData();
    if (isEdit) {
      fetchLead();
    }
  }, [id]);

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

  const fetchLead = async () => {
    try {
      setFetchLoading(true);
      const response = await axios.get(`/leads/${id}`);
      
      if (response.data.success) {
        const lead = response.data.data.lead;
        setFormData({
          name: lead.name,
          email: lead.email,
          phone: lead.phone || '',
          status: lead.status,
          source: lead.source,
          assignedTo: lead.assignedTo?._id || '',
          company: lead.company?._id || '',
          notes: lead.notes || ''
        });
      }
    } catch (err) {
      console.error('Error fetching lead:', err);
      toast.error('Failed to load lead details');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email) {
      toast.error('Please provide name and email');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        assignedTo: formData.assignedTo || null,
        company: formData.company || null
      };

      let response;
      if (isEdit) {
        response = await axios.put(`/leads/${id}`, payload);
      } else {
        response = await axios.post('/leads', payload);
      }

      if (response.data.success) {
        toast.success(isEdit ? 'Lead updated successfully!' : 'Lead created successfully!');
        setTimeout(() => {
          navigate('/leads');
        }, 1000);
      }
    } catch (err) {
      console.error('Error saving lead:', err);
      toast.error(err.response?.data?.message || 'Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/leads')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {isEdit ? 'Edit Lead' : 'Add Lead'}
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="New">New</MenuItem>
                <MenuItem value="Contacted">Contacted</MenuItem>
                <MenuItem value="Qualified">Qualified</MenuItem>
                <MenuItem value="Lost">Lost</MenuItem>
                <MenuItem value="Won">Won</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Source"
                name="source"
                value={formData.source}
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="Website">Website</MenuItem>
                <MenuItem value="Referral">Referral</MenuItem>
                <MenuItem value="Social Media">Social Media</MenuItem>
                <MenuItem value="Cold Call">Cold Call</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Assigned To"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                disabled={loading}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => {
                    if (!selected) {
                      return <em style={{ color: '#999' }}>Unassigned</em>;
                    }
                    const user = users.find(u => u._id === selected);
                    return user ? user.name : 'Unassigned';
                  }
                }}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                disabled={loading}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => {
                    if (!selected) {
                      return <em style={{ color: '#999' }}>None</em>;
                    }
                    const company = companies.find(c => c._id === selected);
                    return company ? company.name : 'None';
                  }
                }}
              >
                <MenuItem value="">None</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company._id} value={company._id}>
                    {company.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ minWidth: 120 }}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/leads')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
