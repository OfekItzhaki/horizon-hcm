import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HelpOutline as HelpIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { meetingsApi } from '@horizon-hcm/shared/src/api/meetings';
import { queryKeys } from '../../lib/query-keys';
import { useAppStore } from '../../store/app.store';
import type { Meeting } from '@horizon-hcm/shared/src/types/meeting';

interface MeetingDetailDialogProps {
  open: boolean;
  onClose: () => void;
  meeting: Meeting;
}

export const MeetingDetailDialog = ({ open, onClose, meeting }: MeetingDetailDialogProps) => {
  const queryClient = useQueryClient();
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);
  const [error, setError] = useState<string | null>(null);

  const rsvpMutation = useMutation({
    mutationFn: ({
      meetingId,
      status,
    }: {
      meetingId: string;
      status: 'attending' | 'not_attending' | 'maybe';
    }) => meetingsApi.rsvp(selectedBuildingId!, meetingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.list(selectedBuildingId!) });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update RSVP');
    },
  });

  const handleRSVP = (status: 'attending' | 'not_attending' | 'maybe') => {
    setError(null);
    rsvpMutation.mutate({ meetingId: meeting.id, status });
  };

  const meetingDate = new Date(meeting.date);
  const isPastMeeting = meetingDate < new Date();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{meeting.title}</Typography>
          {meeting.cancelledAt && <Chip label="Cancelled" color="error" size="small" />}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={3}>
          {error && <Alert severity="error">{error}</Alert>}

          {meeting.cancelledAt && (
            <Alert severity="warning">
              This meeting has been cancelled on {format(new Date(meeting.cancelledAt), 'PPP')}
            </Alert>
          )}

          <Box display="flex" alignItems="center" gap={1}>
            <EventIcon color="action" />
            <Typography>
              {format(meetingDate, 'PPP')} at {format(meetingDate, 'p')}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <LocationIcon color="action" />
            <Typography>{meeting.location}</Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <PeopleIcon color="action" />
            <Typography>{meeting.attendees?.length || 0} attendees</Typography>
          </Box>

          {meeting.agenda && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Agenda
                </Typography>
                <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">
                  {meeting.agenda}
                </Typography>
              </Box>
            </>
          )}

          {!isPastMeeting && !meeting.cancelledAt && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  RSVP
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleRSVP('attending')}
                    disabled={rsvpMutation.isPending}
                  >
                    Attending
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<HelpIcon />}
                    onClick={() => handleRSVP('maybe')}
                    disabled={rsvpMutation.isPending}
                  >
                    Maybe
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleRSVP('not_attending')}
                    disabled={rsvpMutation.isPending}
                  >
                    Not Attending
                  </Button>
                </Stack>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={rsvpMutation.isPending}>
          {rsvpMutation.isPending ? <CircularProgress size={24} /> : 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
