import {
  Box, Typography, Grid, Card, CardContent, Button,
  List, ListItem, ListItemText, Chip,
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import PollIcon from '@mui/icons-material/Poll';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, pollsApi, announcementsApi } from '@horizon-hcm/shared';
import { useAppStore } from '../../store';
import { useTranslation } from '../../i18n/i18nContext';

export function OwnerDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const selectedBuildingId = useAppStore((s) => s.selectedBuildingId);

  const today = new Date();
  const yearStart = new Date(today.getFullYear(), 0, 1).toISOString();

  const { data: balanceData } = useQuery({
    queryKey: ['dashboard-balance', selectedBuildingId],
    queryFn: () => reportsApi.getBalance(selectedBuildingId!, { startDate: new Date(yearStart), endDate: today }),
    enabled: !!selectedBuildingId,
  });

  const { data: pollsData } = useQuery({
    queryKey: ['dashboard-polls', selectedBuildingId],
    queryFn: () => pollsApi.getAll(selectedBuildingId!, { status: 'active', limit: 3 }),
    enabled: !!selectedBuildingId,
  });

  const { data: announcementsData } = useQuery({
    queryKey: ['dashboard-announcements-owner', selectedBuildingId],
    queryFn: () => announcementsApi.getAll(selectedBuildingId!, { limit: 3 }),
    enabled: !!selectedBuildingId,
  });

  const balance = balanceData?.data as any;
  const totalIncome = balance?.totalIncome ?? balance?.total_income ?? 0;
  const totalExpenses = balance?.totalExpenses ?? balance?.total_expenses ?? 0;
  const currentBalance = balance?.balance ?? balance?.current_balance ?? 0;

  const activePolls: any[] = (pollsData?.data as any)?.data ?? (pollsData?.data as any) ?? [];
  const announcements: any[] = (announcementsData?.data as any)?.data ?? (announcementsData?.data as any) ?? [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>{t('dashboard.ownerTitle')}</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>{t('dashboard.ownerSubtitle')}</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <PaymentIcon color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h6">{t('dashboard.financialSummary')}</Typography>
              </Box>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">{t('dashboard.totalIncome')}</Typography>
                  <Typography variant="body1" fontWeight="medium">₪{Number(totalIncome).toLocaleString()}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">{t('dashboard.totalExpenses')}</Typography>
                  <Typography variant="body1" fontWeight="medium">₪{Number(totalExpenses).toLocaleString()}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">{t('dashboard.currentBalance')}</Typography>
                  <Typography variant="body1" fontWeight="medium" color="success.main">
                    ₪{Number(currentBalance).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              <Button variant="outlined" onClick={() => navigate('/reports')} fullWidth sx={{ mt: 2 }}>
                {t('dashboard.viewReports')}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <PollIcon color="secondary" sx={{ fontSize: 32 }} />
                <Typography variant="h6">{t('dashboard.activePolls')}</Typography>
              </Box>
              {activePolls.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('dashboard.noActivePolls')}</Typography>
              ) : (
                <List>
                  {activePolls.map((poll: any) => (
                    <ListItem key={poll.id} divider>
                      <ListItemText
                        primary={poll.title}
                        secondary={poll.end_date ? `Ends ${new Date(poll.end_date).toLocaleDateString()}` : ''}
                      />
                      <Button size="small" onClick={() => navigate('/polls')}>{t('dashboard.vote')}</Button>
                    </ListItem>
                  ))}
                </List>
              )}
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
                      {a.is_urgent && <Chip label="Urgent" size="small" color="error" />}
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
