import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BuildIcon from '@mui/icons-material/Build';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';

export function CommitteeDashboard() {
  const navigate = useNavigate();

  // Mock data - will be replaced with real API calls
  const stats = {
    pendingInvoices: 12,
    maintenanceRequests: 5,
    upcomingMeetings: 2,
  };

  const recentActivity = [
    {
      id: 1,
      type: 'invoice',
      message: 'New invoice created for Apartment 3A',
      time: '2 hours ago',
    },
    {
      id: 2,
      type: 'maintenance',
      message: 'Maintenance request from Apartment 5B',
      time: '4 hours ago',
    },
    { id: 3, type: 'payment', message: 'Payment received from Apartment 2C', time: '1 day ago' },
    { id: 4, type: 'announcement', message: 'New announcement published', time: '2 days ago' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Committee Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage your building operations
      </Typography>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ReceiptIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{stats.pendingInvoices}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Invoices
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <BuildIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{stats.maintenanceRequests}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Maintenance Requests
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <EventIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{stats.upcomingMeetings}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upcoming Meetings
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List>
                {recentActivity.map((activity) => (
                  <ListItem key={activity.id} divider>
                    <ListItemText primary={activity.message} secondary={activity.time} />
                    <Chip
                      label={activity.type}
                      size="small"
                      color={
                        activity.type === 'invoice'
                          ? 'primary'
                          : activity.type === 'maintenance'
                            ? 'warning'
                            : 'default'
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/invoices')}
                  fullWidth
                >
                  Create Invoice
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/announcements')}
                  fullWidth
                >
                  New Announcement
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/meetings')}
                  fullWidth
                >
                  Schedule Meeting
                </Button>
                <Button variant="outlined" onClick={() => navigate('/reports')} fullWidth>
                  View Reports
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
