import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Done as DoneIcon
} from '@mui/icons-material';
import axios from '../api/axios';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}20`,
            borderRadius: '50%',
            width: 60,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/dashboard/stats');
      
      if (response.data.success) {
        setStats(response.data.data.stats);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics');
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
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Total Leads */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Leads"
            value={stats?.totalLeads || 0}
            icon={<PeopleIcon sx={{ fontSize: 30, color: '#1976d2' }} />}
            color="#1976d2"
          />
        </Grid>

        {/* Qualified Leads */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Qualified Leads"
            value={stats?.qualifiedLeads || 0}
            icon={<CheckCircleIcon sx={{ fontSize: 30, color: '#2e7d32' }} />}
            color="#2e7d32"
          />
        </Grid>

        {/* Tasks Due Today */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tasks Due Today"
            value={stats?.tasksDueToday || 0}
            icon={<AssignmentIcon sx={{ fontSize: 30, color: '#ed6c02' }} />}
            color="#ed6c02"
          />
        </Grid>

        {/* Completed Tasks */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Tasks"
            value={stats?.completedTasks || 0}
            icon={<DoneIcon sx={{ fontSize: 30, color: '#9c27b0' }} />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Additional Information Section */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Welcome to Mini CRM
            </Typography>
            <Typography variant="body1" color="textSecondary">
              View and manage your leads, companies, and tasks from the sidebar navigation.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
