import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { meetingsApi } from '@horizon-hcm/shared/src/api/meetings';
import type { Meeting } from '@horizon-hcm/shared/src/types/meeting';
import { queryKeys } from '../../lib/query-keys';
import { useAppStore } from '../../store/app.store';
import { MeetingFormDialog } from './MeetingFormDialog';
import { MeetingDetailDialog } from './MeetingDetailDialog';

export default function MeetingsPage() {
  const selectedBuildingId = useAppStore((state: any) => state.selectedBuildingId);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | undefined>();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.meetings.list(selectedBuildingId || ''),
    queryFn: () => meetingsApi.getAll(selectedBuildingId || ''),
    enabled: !!selectedBuildingId,
    select: (response) => response.data,
  });

  const getMeetingStatus = (meeting: Meeting) => {
    const now = new Date();
    const meetingDate = new Date(meeting.date);

    if (meeting.cancelledAt) return 'cancelled';
    if (meetingDate < now) return 'past';
    return 'upcoming';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'success';
      case 'past':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!selectedBuildingId) {
    return (
      <Box p={3}>
        <Alert severity="info">Please select a building to view meetings.</Alert>
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
        <Alert severity="error">Failed to load meetings. Please try again.</Alert>
      </Box>
    );
  }

  const meetings = data?.data || [];

  const handleCreate = () => {
    setSelectedMeeting(undefined);
    setFormOpen(true);
  };

  const handleEdit = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setFormOpen(true);
  };

  const handleView = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setDetailOpen(true);
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Meetings</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Schedule Meeting
        </Button>
      </Box>

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No meetings scheduled
          </Typography>
        </Paper>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {meetings.map((meeting: Meeting) => {
            const status = getMeetingStatus(meeting);

            return (
              <Card key={meeting.id}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <EventIcon color="primary" />
                        <Typography variant="h6">{meeting.title}</Typography>
                        <Chip
                          label={status}
                          color={getStatusColor(status) as any}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" display="block">
                      📅 {new Date(meeting.date).toLocaleDateString()} at{' '}
                      {new Date(meeting.date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" display="block">
                      📍 {meeting.location}
                    </Typography>
                    {meeting.agenda && (
                      <Typography variant="body2" color="text.secondary" display="block" mt={1}>
                        Agenda: {meeting.agenda}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary" display="block" mt={1}>
                      Attendees: {meeting.attendees?.length || 0} confirmed
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions>
                  <IconButton size="small" title="View" onClick={() => handleView(meeting)}>
                    <ViewIcon />
                  </IconButton>
                  <IconButton size="small" title="Edit" onClick={() => handleEdit(meeting)}>
                    <EditIcon />
                  </IconButton>
                  <Button size="small" variant="outlined" onClick={() => handleView(meeting)}>
                    RSVP
                  </Button>
                </CardActions>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Dialogs */}
      <MeetingFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        meeting={selectedMeeting}
      />
      <MeetingDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        meeting={selectedMeeting!}
      />
    </Box>
  );
}
