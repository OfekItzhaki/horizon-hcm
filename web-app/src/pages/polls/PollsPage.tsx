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
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  HowToVote as VoteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pollsApi } from '@horizon-hcm/shared/src/api/communication';
import type { Poll } from '@horizon-hcm/shared/src/types/voting';
import { queryKeys } from '../../lib/query-keys';
import { useAppStore } from '../../store/app.store';
import PollFormDialog from './PollFormDialog';
import PollVoteDialog from './PollVoteDialog';

export default function PollsPage() {
  const selectedBuildingId = useAppStore((state: any) => state.selectedBuildingId);
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [voteOpen, setVoteOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.polls.list(selectedBuildingId || '', {
      status: statusFilter === 'all' ? undefined : statusFilter,
      page,
      limit,
    }),
    queryFn: () =>
      pollsApi.getAll(selectedBuildingId || '', {
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit,
      }),
    enabled: !!selectedBuildingId,
    select: (response) => response.data,
  });

  const deletePollMutation = useMutation({
    mutationFn: (id: string) => pollsApi.delete(selectedBuildingId || '', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.all });
    },
  });

  const handleCreate = () => {
    setSelectedPoll(null);
    setFormOpen(true);
  };

  const handleEdit = (poll: Poll) => {
    setSelectedPoll(poll);
    setFormOpen(true);
  };

  const handleVote = (poll: Poll) => {
    setSelectedPoll(poll);
    setVoteOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this poll?')) {
      deletePollMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedPoll(null);
  };

  const handleCloseVote = () => {
    setVoteOpen(false);
    setSelectedPoll(null);
  };

  const getPollStatus = (poll: Poll) => {
    const now = new Date();
    const startDate = new Date(poll.startDate);
    const endDate = new Date(poll.endDate);

    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'closed';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'upcoming':
        return 'info';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  if (!selectedBuildingId) {
    return (
      <Box p={3}>
        <Alert severity="info">Please select a building to view polls.</Alert>
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
        <Alert severity="error">Failed to load polls. Please try again.</Alert>
      </Box>
    );
  }

  const polls = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / limit);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Polls</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Create Poll
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 150 }}
            size="small"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="upcoming">Upcoming</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {/* Polls List */}
      {polls.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No polls found
          </Typography>
        </Paper>
      ) : (
        <>
          <Box display="flex" flexDirection="column" gap={2} mb={3}>
            {polls.map((poll: Poll) => {
              const status = getPollStatus(poll);
              const totalVotes = poll.options.reduce(
                (sum: number, opt: any) => sum + (opt.votes || 0),
                0
              );

              return (
                <Card key={poll.id}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Typography variant="h6">{poll.question}</Typography>
                          <Chip
                            label={status}
                            color={getStatusColor(status) as any}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                          {poll.type === 'multiple_choice' && (
                            <Chip label="Multiple Choice" size="small" />
                          )}
                        </Box>
                      </Box>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Start: {new Date(poll.startDate).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        End: {new Date(poll.endDate).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Total Votes: {totalVotes}
                      </Typography>
                    </Box>

                    {/* Poll Options with Results */}
                    {status === 'closed' && (
                      <Box>
                        <Typography variant="subtitle2" mb={1}>
                          Results:
                        </Typography>
                        {poll.options.map((option: any) => {
                          const percentage =
                            totalVotes > 0 ? ((option.votes || 0) / totalVotes) * 100 : 0;

                          return (
                            <Box key={option.id} mb={1}>
                              <Box display="flex" justifyContent="space-between" mb={0.5}>
                                <Typography variant="body2">{option.text}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {option.votes || 0} votes ({percentage.toFixed(1)}%)
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={percentage}
                                sx={{ height: 8, borderRadius: 1 }}
                              />
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </CardContent>

                  <CardActions>
                    {status === 'active' && (
                      <IconButton size="small" onClick={() => handleVote(poll)} title="Vote">
                        <VoteIcon />
                      </IconButton>
                    )}
                    <IconButton size="small" onClick={() => handleEdit(poll)} title="Edit">
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(poll.id)}
                      title="Delete"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              );
            })}
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
      <PollFormDialog open={formOpen} onClose={handleCloseForm} poll={selectedPoll} />

      {/* Vote Dialog */}
      <PollVoteDialog open={voteOpen} onClose={handleCloseVote} poll={selectedPoll} />
    </Box>
  );
}
