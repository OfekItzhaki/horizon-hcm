import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsApi } from '@horizon-hcm/shared/src/api/communication';
import type { Announcement } from '@horizon-hcm/shared/src/types/communication';
import { queryKeys } from '../../lib/query-keys';
import { useAppStore } from '../../store/app.store';

interface AnnouncementDetailDialogProps {
  open: boolean;
  onClose: () => void;
  announcement: Announcement | null;
}

const priorityColors = {
  urgent: 'error',
  normal: 'primary',
  low: 'default',
} as const;

export default function AnnouncementDetailDialog({
  open,
  onClose,
  announcement,
}: AnnouncementDetailDialogProps) {
  const selectedBuildingId = useAppStore((state: any) => state.selectedBuildingId);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const markAsReadMutation = useMutation({
    mutationFn: () => announcementsApi.markAsRead(selectedBuildingId!, announcement!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to mark as read');
    },
  });

  const confirmReadMutation = useMutation({
    mutationFn: () => announcementsApi.confirmRead(selectedBuildingId!, announcement!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to confirm read');
    },
  });

  // Mark as read when dialog opens
  useState(() => {
    if (open && announcement && selectedBuildingId) {
      markAsReadMutation.mutate();
    }
  });

  if (!announcement) return null;

  const handleConfirm = () => {
    setError(null);
    confirmReadMutation.mutate();
  };

  const isLoading = confirmReadMutation.isPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" component="span" flex={1}>
            {announcement.title}
          </Typography>
          <Chip
            label={announcement.priority}
            color={priorityColors[announcement.priority]}
            size="small"
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Published:{' '}
              {announcement.publishedAt
                ? new Date(announcement.publishedAt).toLocaleString()
                : 'Not published'}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Target:{' '}
              {announcement.targetAudience.type === 'all'
                ? 'All Residents'
                : announcement.targetAudience.type}
            </Typography>
            {announcement.scheduledFor && !announcement.publishedAt && (
              <Typography variant="caption" color="text.secondary" display="block">
                Scheduled for: {new Date(announcement.scheduledFor).toLocaleString()}
              </Typography>
            )}
          </Box>

          <Divider />

          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {announcement.content}
          </Typography>

          {announcement.requiresConfirmation && (
            <Alert severity="info">
              This announcement requires your confirmation that you have read it.
            </Alert>
          )}

          <Box>
            <Typography variant="caption" color="text.secondary">
              Read by: {announcement.readBy?.length || 0} residents
            </Typography>
            {announcement.requiresConfirmation && (
              <Typography variant="caption" color="text.secondary" display="block">
                Confirmed by: {announcement.confirmedBy?.length || 0} residents
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Close
        </Button>
        {announcement.requiresConfirmation && (
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={isLoading}
            startIcon={isLoading && <CircularProgress size={20} />}
          >
            Confirm Read
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
