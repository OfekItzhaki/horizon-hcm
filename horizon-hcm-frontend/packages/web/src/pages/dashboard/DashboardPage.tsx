import { Box, Typography, Button } from '@mui/material';
import { useLogout } from '../../hooks/useLogout';
import { useAuthStore } from '../../store';

export default function DashboardPage() {
  const logout = useLogout();
  const user = useAuthStore((state) => state.user);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography variant="h3" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user?.name || 'User'}!
          </Typography>
        </div>
        <Button variant="outlined" color="error" onClick={logout}>
          Logout
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary">
        Horizon HCM - Building Management System
      </Typography>
    </Box>
  );
}
