import { Box, Typography } from '@mui/material';

export default function DashboardPage() {
  return (
    <Box p={3}>
      <Typography variant="h3" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Welcome to Horizon HCM
      </Typography>
    </Box>
  );
}
