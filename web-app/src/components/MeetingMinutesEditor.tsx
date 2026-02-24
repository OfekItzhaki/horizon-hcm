import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import { Delete, AttachFile } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsApi } from '@horizon-hcm/shared/src/api/meetings';
import { useAppStore } from '../store/app.store';
import { queryKeys } from '../lib/query-keys';

interface MeetingMinutesEditorProps {
  open: boolean;
  onClose: () => void;
  meetingId: string;
  existingMinutes?: string;
}

interface FormData {
  minutes: string;
}

export function MeetingMinutesEditor({
  open,
  onClose,
  meetingId,
  existingMinutes,
}: MeetingMinutesEditorProps) {
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      minutes: existingMinutes || '',
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: { minutes: string; attachments?: File[] }) => {
      const formData = new FormData();
      formData.append('minutes', data.minutes);
      if (data.attachments) {
        data.attachments.forEach((file) => {
          formData.append('attachments', file);
        });
      }
      return meetingsApi.addMinutes(selectedBuildingId!, meetingId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.detail(meetingId) });
      handleClose();
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Failed to save minutes');
    },
  });

  const onSubmit = (data: FormData) => {
    setError(null);
    saveMutation.mutate({
      minutes: data.minutes,
      attachments,
    });
  };

  const handleClose = () => {
    if (!saveMutation.isPending) {
      setError(null);
      setAttachments([]);
      onClose();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setAttachments([...attachments, ...Array.from(event.target.files)]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>
          {existingMinutes ? 'Edit Meeting Minutes' : 'Add Meeting Minutes'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Typography variant="body2" color="text.secondary">
              Document the key points, decisions, and action items from the meeting.
            </Typography>

            <TextField
              label="Meeting Minutes"
              {...register('minutes', { required: 'Minutes are required' })}
              error={!!errors.minutes}
              helperText={errors.minutes?.message}
              multiline
              rows={12}
              fullWidth
              disabled={saveMutation.isPending}
              placeholder="Enter meeting minutes here..."
            />

            <Box>
              <input
                type="file"
                id="minutes-attachments"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              <label htmlFor="minutes-attachments">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<AttachFile />}
                  disabled={saveMutation.isPending}
                >
                  Attach Documents
                </Button>
              </label>
            </Box>

            {attachments.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Attachments ({attachments.length})
                </Typography>
                <List dense>
                  {attachments.map((file, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveAttachment(index)}
                          disabled={saveMutation.isPending}
                        >
                          <Delete />
                        </IconButton>
                      }
                    >
                      <AttachFile sx={{ mr: 2 }} />
                      <ListItemText
                        primary={file.name}
                        secondary={`${(file.size / 1024).toFixed(1)} KB`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saveMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saveMutation.isPending}
            startIcon={saveMutation.isPending && <CircularProgress size={20} />}
          >
            {existingMinutes ? 'Update' : 'Save'} Minutes
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
