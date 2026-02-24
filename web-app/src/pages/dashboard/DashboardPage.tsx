import { useAuthStore } from '../../store';
import { CommitteeDashboard } from './CommitteeDashboard';
import { OwnerDashboard } from './OwnerDashboard';
import { TenantDashboard } from './TenantDashboard';
import { AdminDashboard } from './AdminDashboard';
import { Box, CircularProgress } from '@mui/material';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  // Show loading if user data is not yet available
  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'committee_member':
      return <CommitteeDashboard />;
    case 'owner':
      return <OwnerDashboard />;
    case 'tenant':
      return <TenantDashboard />;
    default:
      return <OwnerDashboard />; // Default fallback
  }
}
