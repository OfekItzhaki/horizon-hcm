import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsApi } from '@horizon-hcm/shared/src/api/meetings';
import { queryKeys } from '../../lib/query-keys';
import { useAppStore } from '../../store/app.store';
import type { Meeting } from '@horizon-hcm/shared/src/types/meeting';

const meetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(1, 'Location is required'),
  agenda: z.string().optional(),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

interface MeetingFormDialogProps {
  open: boolean;
  onClose: () => void;
  meeting?: Meeting;
}

export const MeetingFormDialog = ({ open, onClose, meeting }: MeetingFormDialogProps) => {
  const queryClient = useQueryClient();
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: meeting
      ? {
          title: meeting.title,
          date: new Date(meeting.date).toISOString().split('T')[0],
          time: new Date(meeting.date).toTimeString().slice(0, 5),
          location: meeting.location,
          agenda: meeting.agenda || '',
        }
      : {
          title: '',
          date: '',
          time: '',
          location: '',
          agenda: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => meetingsApi.create(selectedBuildingId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.list(selectedBuildingId!) });
      handleClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create meeting');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      meetingsApi.update(selectedBuildingId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.list(selectedBuildingId!) });
      handleClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update meeting');
    },
  });

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  const onSubmit = (data: MeetingFormData) => {
    setError(null);

    // Combine date and time into ISO string
    const dateTime = new Date(`${data.date}T${data.time}`);

    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('date', dateTime.toISOString());
    formData.append('location', data.location);
    if (data.agenda) {
      formData.append('agenda', data.agenda);
    }

    if (meeting) {
      // For update, use JSON payload
      const payload = {
        title: data.title,
        date: dateTime.toISOString(),
        location: data.location,
        agenda: data.agenda || undefined,
      };
      updateMutation.mutate({ id: meeting.id, data: payload });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{meeting ? 'Edit Meeting' : 'Schedule Meeting'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              {...register('title')}
              label="Title"
              fullWidth
              error={!!errors.title}
              helperText={errors.title?.message}
              disabled={isLoading}
            />

            <TextField
              {...register('date')}
              label="Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!!errors.date}
              helperText={errors.date?.message}
              disabled={isLoading}
            />

            <TextField
              {...register('time')}
              label="Time"
              type="time"
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!!errors.time}
              helperText={errors.time?.message}
              disabled={isLoading}
            />

            <TextField
              {...register('location')}
              label="Location"
              fullWidth
              error={!!errors.location}
              helperText={errors.location?.message}
              disabled={isLoading}
            />

            <TextField
              {...register('agenda')}
              label="Agenda"
              fullWidth
              multiline
              rows={4}
              error={!!errors.agenda}
              helperText={errors.agenda?.message}
              disabled={isLoading}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : meeting ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
