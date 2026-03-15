import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { buildingsApi } from '@horizon-hcm/shared';

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const { data: buildingsData, isLoading: buildingsLoading } = useQuery({
    queryKey: ['admin-buildings-stats'],
    queryFn: async () => {
      const res = await buildingsApi.getAll();
      return res.data;
    },
    staleTime: 60_000,
  });

  const buildingsList = Array.isArray(buildingsData) ? buildingsData : [];
  const activeBuildings = buildingsList.filter((b: any) => b.is_active !== false).length;

  const stats = [
    {
      title: 'Active Buildings',
      value: buildingsLoading ? '…' : activeBuildings,
      icon: <BusinessIcon />,
      color: '#2e7d32',
      change: `${buildingsList.length} total`,
      changeType: 'neutral' as const,
    },
    {
      title: 'System Health',
      value: '98%',
      icon: <AssessmentIcon />,
      color: '#ed6c02',
      change: 'Excellent',
      changeType: 'positive' as const,
    },
    {
      title: 'Storage Used',
      value: '45 GB',
      icon: <StorageIcon />,
      color: '#9c27b0',
      change: '65%',
      changeType: 'neutral' as const,
    },
  ];

  const systemMetrics = [
    { label: 'API Response Time', value: 85, unit: 'ms', status: 'good' },
    { label: 'Database Performance', value: 92, unit: '%', status: 'excellent' },
    { label: 'Error Rate', value: 0.5, unit: '%', status: 'good' },
    { label: 'Uptime', value: 99.9, unit: '%', status: 'excellent' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'primary';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Admin Dashboard</Typography>
        <Button
          variant="contained"
          startIcon={<SettingsIcon />}
          onClick={() => navigate('/admin/settings')}
        >
          System Settings
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box
                    sx={{
                      backgroundColor: stat.color,
                      color: 'white',
                      borderRadius: 2,
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {stat.icon}
                  </Box>
                  {stat.change && (
                    <Chip
                      label={stat.change}
                      size="small"
                      color={
                        stat.changeType === 'positive'
                          ? 'success'
                          : (stat.changeType as string) === 'negative'
                            ? 'error'
                            : 'default'
                      }
                    />
                  )}
                </Box>
                <Typography variant="h4" gutterBottom>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* System Health Metrics */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Health Metrics
          </Typography>
          <Grid container spacing={3} mt={1}>
            {systemMetrics.map((metric, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      {metric.label}
                    </Typography>
                    <Chip
                      label={metric.status}
                      size="small"
                      color={
                        getStatusColor(metric.status) as
                          | 'default'
                          | 'primary'
                          | 'secondary'
                          | 'error'
                          | 'info'
                          | 'success'
                          | 'warning'
                      }
                    />
                  </Box>
                  <Typography variant="h5" gutterBottom>
                    {metric.value} {metric.unit}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metric.value > 10 ? metric.value : metric.value * 10}
                    color={
                      getStatusColor(metric.status) as
                        | 'primary'
                        | 'secondary'
                        | 'error'
                        | 'info'
                        | 'success'
                        | 'warning'
                    }
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PeopleIcon />}
                onClick={() => navigate('/admin/users')}
              >
                Manage Users
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<BusinessIcon />}
                onClick={() => navigate('/admin/buildings')}
              >
                Manage Buildings
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SecurityIcon />}
                onClick={() => navigate('/admin/audit-log')}
              >
                View Audit Log
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => navigate('/admin/settings')}
              >
                System Config
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
