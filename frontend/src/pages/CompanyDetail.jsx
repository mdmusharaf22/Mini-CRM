import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axios from '../api/axios';

const statusColors = {
  'New': 'primary',
  'Contacted': 'info',
  'Qualified': 'success',
  'Lost': 'error',
  'Won': 'success'
};

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCompanyDetails();
  }, [id]);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`/companies/${id}/leads`);
      
      if (response.data.success) {
        setCompany(response.data.data.company);
        setLeads(response.data.data.leads);
      }
    } catch (err) {
      console.error('Error fetching company details:', err);
      setError('Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/companies')}>
          Back to Companies
        </Button>
      </Box>
    );
  }

  if (!company) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Company not found
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/companies')}>
          Back to Companies
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/companies')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Company Details
        </Typography>
      </Box>

      {/* Company Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          {company.name}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="textSecondary">
              Industry
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {company.industry || '-'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="textSecondary">
              Location
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {company.location || '-'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="textSecondary">
              Website
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {company.website || '-'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="textSecondary">
              Phone
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {company.phone || '-'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="textSecondary">
              Email
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {company.email || '-'}
            </Typography>
          </Grid>

          {company.notes && (
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Notes
              </Typography>
              <Typography variant="body1">
                {company.notes}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Associated Leads */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          Associated Leads ({leads.length})
        </Typography>

        {leads.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="textSecondary">
              No leads associated with this company
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Assigned To</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
