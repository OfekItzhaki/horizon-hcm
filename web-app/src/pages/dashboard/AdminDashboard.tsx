import { Box, Typography, Grid, Card, CardContent, Button, CircularProgress, Chip } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { buildingsApi, adminApi } from '@horizon-hcm/shared';
import { apiClient } from '@horizon-hcm/shared/src/api/client';
import { useTranslation } from '../../i18n/i18nContext';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: buildingsData, isLoading: buildingsLoading } = useQuery({
    queryKey: ['admin-dashboard-buildings'],
    queryFn: async () => {
      const res = await buildingsApi.getAll();
      const payload = res.data as any;
      return Array.isArray(payload) ? payload : (payload?.data ?? []);
    },
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-dashboard-users'],
    queryFn: async () => {
      const res = await adminApi.getUsers({ limit: 1 });
      return res.data;
    },
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['admin-dashboard-health'],
    queryFn: async () => {
      const res = await apiClient.get<{ status: string; checks: { database: { status: string }; redis: { status: string } } }>('/health');
      return res.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const buildings: any[] = buildingsData ?? [];
  const totalBuildings = buildings.length;
  const activeBuildings = buildings.filter((b) => b.is_active !== false).length;
  const totalUsers = usersData?.total ?? 0;

  const isLoading = buildingsLoading || usersLoading;

  const healthStatus = healthData?.status ?? null;
  const healthColor = healthStatus === 'healthy' ? 'success' : healthStatus === 'unhealthy' ? 'error' : 'default';

  return (
    <Box>
      <Typography variant="h4" gutterBottom>{t('dashboard.adminTitle')}</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        {t('dashboard.adminSubtitle')}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  {isLoading ? <CircularProgress size={24} /> : <Typography variant="h4">{totalUsers}</Typography>}
                  <Typography variant="body2" color="text.secondary">{t('dashboard.totalUsers')}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ApartmentIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  {isLoading ? <CircularProgress size={24} /> : <Typography variant="h4">{totalBuildings}</Typography>}
                  <Typography variant="body2" color="text.secondary">{t('dashboard.totalBuildings')}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AssessmentIcon color="info" sx={{ fontSize: 40 }} />
                <Box>
                  {isLoading ? <CircularProgress size={24} /> : <Typography variant="h4">{activeBuildings}</Typography>}
                  <Typography variant="body2" color="text.secondary">{t('dashboard.activeBuildings')}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <SettingsIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  {healthLoading ? (
                    <CircularProgress size={24} />
                  ) : healthStatus ? (
                    <Chip
                      label={healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
                      color={healthColor as any}
                      size="small"
                    />
                  ) : (
                    <Typography variant="h4">—</Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">{t('dashboard.systemHealth')}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('dashboard.userManagement')}</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('dashboard.userManagementDesc')}
              </Typography>
              <Button variant="contained" onClick={() => navigate('/admin/users')} fullWidth>
                {t('dashboard.manageUsers')}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('dashboard.buildingManagement')}</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('dashboard.buildingManagementDesc')}
              </Typography>
              <Button variant="contained" onClick={() => navigate('/admin/buildings')} fullWidth>
                {t('dashboard.manageBuildings')}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('dashboard.systemSettings')}</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('dashboard.systemSettingsDesc')}
              </Typography>
              <Button variant="outlined" onClick={() => navigate('/admin/settings')} fullWidth>
                {t('dashboard.systemSettings')}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('dashboard.auditLogs')}</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('dashboard.auditLogsDesc')}
              </Typography>
              <Button variant="outlined" onClick={() => navigate('/admin/audit-log')} fullWidth>
                {t('dashboard.viewLogs')}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
