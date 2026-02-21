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
import PaymentIcon from '@mui/icons-material/Payment';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import BuildIcon from '@mui/icons-material/Build';
import { useNavigate } from 'react-router-dom';

export function TenantDashboard() {
  const navigate = useNavigate();

  // Mock data
  const paymentObligations = [
    {
      id: 1,
      description: 'Monthly rent',
      amount: 3500,
      dueDate: 'Due in 5 days',
      status: 'pending',
    },
    {
      id: 2,
      description: 'Building maintenance',
      amount: 200,
      dueDate: 'Due in 10 days',
      status: 'pending',
    },
  ];

  const announcements = [
    { id: 1, title: 'Water supply maintenance', date: '2 hours ago' },
    { id: 2, title: 'Elevator maintenance schedule', date: '1 day ago' },
    { id: 3, title: 'New parking regulations', date: '3 days ago' },
  ];

  const maintenanceRequests = [
    { id: 1, title: 'Leaking faucet', status: 'in_progress', date: '2 days ago' },
    { id: 2, title: 'Broken window', status: 'pending', date: '1 week ago' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tenant Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Your apartment overview
      </Typography>

      <Grid container spacing={3}>
        {/* Payment Obligations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <PaymentIcon color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h6">Payment Obligations</Typography>
              </Box>
              <List>
                {paymentObligations.map((payment) => (
                  <ListItem key={payment.id} divider>
                    <ListItemText
                      primary={payment.description}
                      secondary={
                        <>
                          ₪{payment.amount} • {payment.dueDate}
                        </>
                      }
                    />
                    <Chip label={payment.status} size="small" color="warning" />
                  </ListItem>
                ))}
              </List>
              <Button
                variant="contained"
                onClick={() => navigate('/payments')}
                fullWidth
                sx={{ mt: 2 }}
              >
                Make Payment
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Maintenance Requests */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <BuildIcon color="warning" sx={{ fontSize: 40 }} />
                <Typography variant="h6">Maintenance Requests</Typography>
              </Box>
              <List>
                {maintenanceRequests.map((request) => (
                  <ListItem key={request.id} divider>
                    <ListItemText primary={request.title} secondary={request.date} />
                    <Chip
                      label={request.status}
                      size="small"
                      color={request.status === 'in_progress' ? 'info' : 'default'}
                    />
                  </ListItem>
                ))}
              </List>
              <Button
                variant="outlined"
                onClick={() => navigate('/maintenance')}
                fullWidth
                sx={{ mt: 2 }}
              >
                New Request
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Announcements */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <AnnouncementIcon color="info" sx={{ fontSize: 32 }} />
                <Typography variant="h6">Recent Announcements</Typography>
              </Box>
              <List>
                {announcements.map((announcement) => (
                  <ListItem key={announcement.id} divider>
                    <ListItemText primary={announcement.title} secondary={announcement.date} />
                  </ListItem>
                ))}
              </List>
              <Button
                variant="text"
                onClick={() => navigate('/announcements')}
                fullWidth
                sx={{ mt: 1 }}
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
