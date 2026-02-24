import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../../store/app.store';
import { queryKeys } from '../../lib/query-keys';
import { announcementsApi } from '@horizon-hcm/shared/src/api/communication';
import type { Announcement } from '@horizon-hcm/shared/src/types/communication';

interface AnnouncementFormDialogProps {
  open: boolean;
  onClose: () => void;
  announcement?: Announcement | null;
}

interface FormData {
  title: string;
  content: string;
  priority: 'urgent' | 'normal' | 'low';
  targetAudienceType: 'all' | 'owners' | 'tenants' | 'specific';
  scheduledFor?: string;
  requiresConfirmation: boolean;
}

export default function AnnouncementFormDialog({
  open,
  onClose,
  announcement,
}: AnnouncementFormDialogProps) {
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      content: '',
      priority: 'normal',
      targetAudienceType: 'all',
      requiresConfirmation: false,
    },
  });

  useEffect(() => {
    if (announcement) {
      reset({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        targetAudienceType: announcement.targetAudience.type,
        scheduledFor: announcement.scheduledFor
          ? new Date(announcement.scheduledFor).toISOString().slice(0, 16)
          : undefined,
        requiresConfirmation: announcement.requiresConfirmation,
      });
    } else {
      reset({
        title: '',
        content: '',
        priority: 'normal',
        targetAudienceType: 'all',
        requiresConfirmation: false,
      });
    }
  }, [announcement, reset]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Announcement>) => announcementsApi.create(selectedBuildingId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
      handleClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create announcement');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Announcement>) =>
      announcementsApi.update(selectedBuildingId!, announcement!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
      handleClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update announcement');
    },
  });

  const onSubmit = (data: FormData) => {
    setError(null);

    const payload: Partial<Announcement> = {
      title: data.title,
      content: data.content,
      priority: data.priority,
      targetAudience: {
        type: data.targetAudienceType,
      },
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
      requiresConfirmation: data.requiresConfirmation,
    };

    if (announcement) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleClose = () => {
    if (!createMutation.isPending && !updateMutation.isPending) {
      reset();
      setError(null);
      onClose();
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{announcement ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Title"
              {...register('title', { required: 'Title is required' })}
              error={!!errors.title}
              helperText={errors.title?.message}
              fullWidth
              disabled={isLoading}
            />

            <TextField
              label="Content"
              {...register('content', { required: 'Content is required' })}
              error={!!errors.content}
              helperText={errors.content?.message}
              multiline
              rows={4}
              fullWidth
              disabled={isLoading}
            />

            <TextField
              select
              label="Priority"
              {...register('priority')}
              defaultValue="normal"
              fullWidth
              disabled={isLoading}
            >
              <MenuItem value="urgent">Urgent</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </TextField>

            <TextField
              select
              label="Target Audience"
              {...register('targetAudienceType')}
              defaultValue="all"
              fullWidth
              disabled={isLoading}
            >
              <MenuItem value="all">All Residents</MenuItem>
              <MenuItem value="owners">Owners Only</MenuItem>
              <MenuItem value="tenants">Tenants Only</MenuItem>
            </TextField>

            <TextField
              label="Schedule For (Optional)"
              type="datetime-local"
              {...register('scheduledFor')}
              InputLabelProps={{ shrink: true }}
              fullWidth
              disabled={isLoading}
            />

            <FormControlLabel
              control={<Checkbox {...register('requiresConfirmation')} disabled={isLoading} />}
              label="Requires Confirmation"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading && <CircularProgress size={20} />}
          >
            {announcement ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
