import {
  Box, Typography, Grid, Card, CardContent, Button,
  List, ListItem, ListItemText, Chip,
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import BuildIcon from '@mui/icons-material/Build';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invoicesApi, maintenanceApi, announcementsApi } from '@horizon-hcm/shared';
import { useAppStore } from '../../store';
import { useTranslation } from '../../i18n/i18nContext';

export function TenantDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const selectedBuildingId = useAppStore((s) => s.selectedBuildingId);

  const { data: invoicesData } = useQuery({
    queryKey: ['tenant-dashboard-invoices', selectedBuildingId],
    queryFn: () => invoicesApi.getAll({ buildingId: selectedBuildingId, status: 'pending', limit: 5 }),
    enabled: !!selectedBuildingId,
  });

  const { data: maintenanceData } = useQuery({
    queryKey: ['tenant-dashboard-maintenance', selectedBuildingId],
    queryFn: () => maintenanceApi.getAll(selectedBuildingId!, { limit: 3 }),
    enabled: !!selectedBuildingId,
  });

  const { data: announcementsData } = useQuery({
    queryKey: ['tenant-dashboard-announcements', selectedBuildingId],
    queryFn: () => announcementsApi.getAll(selectedBuildingId!, { limit: 3 }),
    enabled: !!selectedBuildingId,
  });

  const pendingInvoices: any[] = (invoicesData?.data as any)?.data ?? (invoicesData?.data as any) ?? [];
  const maintenanceRequests: any[] = (maintenanceData?.data as any)?.data ?? (maintenanceData?.data as any) ?? [];
  const announcements: any[] = (announcementsData?.data as any)?.data ?? (announcementsData?.data as any) ?? [];

  const statusColor = (status: string) => {
    if (status === 'in_progress') return 'info';
    if (status === 'open' || status === 'pending') return 'warning';
    return 'default';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>{t('dashboard.tenantTitle')}</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>{t('dashboard.tenantSubtitle')}</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <PaymentIcon color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h6">{t('dashboard.pendingInvoices')}</Typography>
              </Box>
              {pendingInvoices.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('dashboard.noPendingInvoices')}</Typography>
              ) : (
                <List>
                  {pendingInvoices.map((inv: any) => (
                    <ListItem key={inv.id} divider>
                      <ListItemText
                        primary={inv.title}
                        secondary={`₪${Number(inv.amount).toLocaleString()} • Due ${new Date(inv.due_date).toLocaleDateString()}`}
                      />
                      <Chip label={inv.status} size="small" color="warning" />
                    </ListItem>
                  ))}
                </List>
              )}
              <Button variant="contained" onClick={() => navigate('/payments')} fullWidth sx={{ mt: 2 }}>
                {t('dashboard.makePayment')}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <BuildIcon color="warning" sx={{ fontSize: 40 }} />
                <Typography variant="h6">{t('dashboard.maintenanceRequests')}</Typography>
              </Box>
              {maintenanceRequests.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('dashboard.noMaintenanceRequests')}</Typography>
              ) : (
                <List>
                  {maintenanceRequests.map((req: any) => (
                    <ListItem key={req.id} divider>
                      <ListItemText
                        primary={req.title}
                        secondary={new Date(req.created_at).toLocaleDateString()}
                      />
                      <Chip label={req.status} size="small" color={statusColor(req.status) as any} />
                    </ListItem>
                  ))}
                </List>
              )}
              <Button variant="outlined" onClick={() => navigate('/maintenance')} fullWidth sx={{ mt: 2 }}>
                {t('dashboard.newRequest')}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <AnnouncementIcon color="info" sx={{ fontSize: 32 }} />
                <Typography variant="h6">{t('dashboard.recentAnnouncements')}</Typography>
              </Box>
              {announcements.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('dashboard.noAnnouncements')}</Typography>
              ) : (
                <List>
                  {announcements.map((a: any) => (
                    <ListItem key={a.id} divider>
                      <ListItemText
                        primary={a.title}
                        secondary={new Date(a.created_at).toLocaleDateString()}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              <Button variant="text" onClick={() => navigate('/announcements')} fullWidth sx={{ mt: 1 }}>
                {t('dashboard.viewAll')}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
