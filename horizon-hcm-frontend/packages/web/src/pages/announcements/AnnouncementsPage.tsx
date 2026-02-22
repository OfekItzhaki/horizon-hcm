import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Pagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsApi } from '@horizon-hcm/shared/src/api/communication';
import type { Announcement } from '@horizon-hcm/shared/src/types/communication';
import { queryKeys } from '../../lib/query-keys';
import { useAppStore } from '../../store/app.store';
import AnnouncementFormDialog from './AnnouncementFormDialog';
import AnnouncementDetailDialog from './AnnouncementDetailDialog';

const priorityColors = {
  urgent: 'error',
  normal: 'primary',
  low: 'default',
} as const;

export default function AnnouncementsPage() {
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.announcements.list(selectedBuildingId || '', {
      priority: priorityFilter === 'all' ? undefined : priorityFilter,
      page,
      limit,
    }),
    queryFn: () =>
      announcementsApi.getAll(selectedBuildingId || '', {
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
        page,
        limit,
      }),
    enabled: !!selectedBuildingId,
    select: (response) => response.data,
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id: string) => announcementsApi.delete(selectedBuildingId || '', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
    },
  });

  const handleCreate = () => {
    setSelectedAnnouncement(null);
    setFormOpen(true);
  };

  const handleView = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDetailOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      deleteAnnouncementMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedAnnouncement(null);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedAnnouncement(null);
  };

  if (!selectedBuildingId) {
    return (
      <Box p={3}>
        <Alert severity="info">Please select a building to view announcements.</Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load announcements. Please try again.</Alert>
      </Box>
    );
  }

  const announcements = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / limit);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Announcements</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Create Announcement
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            select
            label="Priority"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 150 }}
            size="small"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="urgent">Urgent</MenuItem>
            <MenuItem value="normal">Normal</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No announcements found
          </Typography>
        </Paper>
      ) : (
        <>
          <Box display="flex" flexDirection="column" gap={2} mb={3}>
            {announcements.map((announcement: Announcement) => (
              <Card key={announcement.id}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="h6">{announcement.title}</Typography>
                        <Chip
                          label={announcement.priority}
                          color={priorityColors[announcement.priority]}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                        {announcement.requiresConfirmation && (
                          <Chip label="Requires Confirmation" color="warning" size="small" />
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {announcement.content}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {announcement.publishedAt
                          ? `Published: ${new Date(announcement.publishedAt).toLocaleDateString()}`
                          : announcement.scheduledFor
                            ? `Scheduled: ${new Date(announcement.scheduledFor).toLocaleDateString()}`
                            : `Created: ${new Date(announcement.createdAt).toLocaleDateString()}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Target:{' '}
                        {announcement.targetAudience.type === 'all'
                          ? 'All Residents'
                          : announcement.targetAudience.type}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Read by: {announcement.readBy?.length || 0} residents
                        {announcement.requiresConfirmation &&
                          ` | Confirmed: ${announcement.confirmedBy?.length || 0}`}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>

                <CardActions>
                  <IconButton size="small" onClick={() => handleView(announcement)} title="View">
                    <ViewIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleEdit(announcement)} title="Edit">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(announcement.id)}
                    title="Delete"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            ))}
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center">
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Form Dialog */}
      <AnnouncementFormDialog
        open={formOpen}
        onClose={handleCloseForm}
        announcement={selectedAnnouncement}
      />

      {/* Detail Dialog */}
      <AnnouncementDetailDialog
        open={detailOpen}
        onClose={handleCloseDetail}
        announcement={selectedAnnouncement}
      />
    </Box>
  );
}
