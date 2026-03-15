import {
  Box, Typography, Grid, Card, CardContent, Button,
  List, ListItem, ListItemText, Chip, CircularProgress,
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BuildIcon from '@mui/icons-material/Build';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invoicesApi, maintenanceApi, meetingsApi, announcementsApi } from '@horizon-hcm/shared';
import { useAppStore } from '../../store';
import { useTranslation } from '../../i18n/i18nContext';

export function CommitteeDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const selectedBuildingId = useAppStore((s) => s.selectedBuildingId);

  const { data: invoicesData } = useQuery({
    queryKey: ['dashboard-invoices', selectedBuildingId],
    queryFn: () => invoicesApi.getAll({ buildingId: selectedBuildingId, status: 'pending', limit: 1 }),
    enabled: !!selectedBuildingId,
  });

  const { data: maintenanceData } = useQuery({
    queryKey: ['dashboard-maintenance', selectedBuildingId],
    queryFn: () => maintenanceApi.getAll(selectedBuildingId!, { status: 'open', limit: 1 }),
    enabled: !!selectedBuildingId,
  });

  const { data: meetingsData } = useQuery({
    queryKey: ['dashboard-meetings', selectedBuildingId],
    queryFn: () => meetingsApi.getAll(selectedBuildingId!, { status: 'upcoming', limit: 1 }),
    enabled: !!selectedBuildingId,
  });

  const { data: announcementsData } = useQuery({
    queryKey: ['dashboard-announcements', selectedBuildingId],
    queryFn: () => announcementsApi.getAll(selectedBuildingId!, { limit: 4 }),
    enabled: !!selectedBuildingId,
  });

  const pendingInvoices = (invoicesData?.data as any)?.total ?? (invoicesData?.data as any)?.length ?? 0;
  const maintenanceRequests = (maintenanceData?.data as any)?.total ?? (maintenanceData?.data as any)?.length ?? 0;
  const upcomingMeetings = (meetingsData?.data as any)?.total ?? (meetingsData?.data as any)?.length ?? 0;
  const recentAnnouncements: any[] = (announcementsData?.data as any)?.data ?? (announcementsData?.data as any) ?? [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>{t('dashboard.committeeTitle')}</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        {t('dashboard.committeeSubtitle')}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ReceiptIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{pendingInvoices}</Typography>
                  <Typography variant="body2" color="text.secondary">{t('dashboard.pendingInvoices')}</Typography>
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
                  <Typography variant="h4">{maintenanceRequests}</Typography>
                  <Typography variant="body2" color="text.secondary">{t('dashboard.maintenanceRequests')}</Typography>
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
                  <Typography variant="h4">{upcomingMeetings}</Typography>
                  <Typography variant="body2" color="text.secondary">{t('dashboard.upcomingMeetings')}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('dashboard.recentAnnouncements')}</Typography>
              {recentAnnouncements.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('dashboard.noAnnouncements')}</Typography>
              ) : (
                <List>
                  {recentAnnouncements.map((a: any) => (
                    <ListItem key={a.id} divider>
                      <ListItemText
                        primary={a.title}
                        secondary={new Date(a.created_at).toLocaleDateString()}
                      />
                      {a.is_urgent && <Chip label="Urgent" size="small" color="error" />}
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('dashboard.quickActions')}</Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/invoices')} fullWidth>
                  {t('dashboard.createInvoice')}
                </Button>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate('/announcements')} fullWidth>
                  {t('dashboard.newAnnouncement')}
                </Button>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate('/meetings')} fullWidth>
                  {t('dashboard.scheduleMeeting')}
                </Button>
                <Button variant="outlined" onClick={() => navigate('/reports')} fullWidth>
                  {t('dashboard.viewReports')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
