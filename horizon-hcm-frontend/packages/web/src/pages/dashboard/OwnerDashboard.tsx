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
  LinearProgress,
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import PollIcon from '@mui/icons-material/Poll';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import { useNavigate } from 'react-router-dom';

export function OwnerDashboard() {
  const navigate = useNavigate();

  // Mock data - will be replaced with real API calls
  const paymentStatus = {
    paid: 8500,
    pending: 1500,
    total: 10000,
  };

  const activePolls = [
    { id: 1, question: 'Approve new security system?', deadline: '3 days left' },
    { id: 2, question: 'Building renovation budget', deadline: '1 week left' },
  ];

  const announcements = [
    { id: 1, title: 'Water supply maintenance', date: '2 hours ago', priority: 'urgent' },
    { id: 2, title: 'Monthly committee meeting', date: '1 day ago', priority: 'normal' },
    { id: 3, title: 'New parking regulations', date: '3 days ago', priority: 'normal' },
  ];

  const paymentPercentage = (paymentStatus.paid / paymentStatus.total) * 100;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Owner Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Your building overview
      </Typography>

      <Grid container spacing={3}>
        {/* Payment Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <PaymentIcon color="primary" sx={{ fontSize: 40 }} />
                <Box flexGrow={1}>
                  <Typography variant="h6">Payment Status</Typography>
                  <Typography variant="body2" color="text.secondary">
                    This year
                  </Typography>
                </Box>
              </Box>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Paid: ₪{paymentStatus.paid}</Typography>
                  <Typography variant="body2">Pending: ₪{paymentStatus.pending}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={paymentPercentage}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Button variant="contained" onClick={() => navigate('/payments')} fullWidth>
                View Payments
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Building Financial Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Building Financial Summary
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Total Income
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    ₪125,000
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Total Expenses
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    ₪98,000
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Current Balance
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" color="success.main">
                    ₪27,000
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                onClick={() => navigate('/reports')}
                fullWidth
                sx={{ mt: 2 }}
              >
                View Reports
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Polls */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <PollIcon color="secondary" sx={{ fontSize: 32 }} />
                <Typography variant="h6">Active Polls</Typography>
              </Box>
              <List>
                {activePolls.map((poll) => (
                  <ListItem key={poll.id} divider>
                    <ListItemText primary={poll.question} secondary={poll.deadline} />
                    <Button size="small" onClick={() => navigate('/polls')}>
                      Vote
                    </Button>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Announcements */}
        <Grid item xs={12} md={6}>
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
                    {announcement.priority === 'urgent' && (
                      <Chip label="Urgent" size="small" color="error" />
                    )}
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
