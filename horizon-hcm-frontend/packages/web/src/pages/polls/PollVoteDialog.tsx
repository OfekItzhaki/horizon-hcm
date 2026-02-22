import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Alert,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Typography,
  LinearProgress,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../../store/app.store';
import { queryKeys } from '../../lib/query-keys';
import { pollsApi } from '@horizon-hcm/shared/src/api/communication';
import type { Poll } from '@horizon-hcm/shared/src/types/voting';

interface PollVoteDialogProps {
  open: boolean;
  onClose: () => void;
  poll: Poll | null;
}

export default function PollVoteDialog({ open, onClose, poll }: PollVoteDialogProps) {
  const selectedBuildingId = useAppStore((state: any) => state.selectedBuildingId);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Fetch poll results
  const { data: resultsData } = useQuery({
    queryKey: queryKeys.polls.detail(poll?.id || ''),
    queryFn: () => pollsApi.getResults(selectedBuildingId!, poll!.id),
    enabled: !!selectedBuildingId && !!poll && open,
    select: (response) => response.data,
  });

  useEffect(() => {
    if (open && poll) {
      setSelectedOptions([]);
      setError(null);
    }
  }, [open, poll]);

  const voteMutation = useMutation({
    mutationFn: (optionIds: string[]) =>
      pollsApi.vote(selectedBuildingId!, poll!.id, { optionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.detail(poll!.id) });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to submit vote');
    },
  });

  const handleSingleChoice = (optionId: string) => {
    setSelectedOptions([optionId]);
  };

  const handleMultipleChoice = (optionId: string, checked: boolean) => {
    if (checked) {
      setSelectedOptions([...selectedOptions, optionId]);
    } else {
      setSelectedOptions(selectedOptions.filter((id) => id !== optionId));
    }
  };

  const handleSubmit = () => {
    if (selectedOptions.length === 0) {
      setError('Please select at least one option');
      return;
    }

    setError(null);
    voteMutation.mutate(selectedOptions);
  };

  if (!poll) return null;

  const isLoading = voteMutation.isPending;
  const results = resultsData?.options || [];
  const totalVotes = results.reduce((sum, opt) => sum + opt.voteCount, 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{poll.question}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Typography variant="body2" color="text.secondary">
            {poll.type === 'multiple_choice' ? 'Select one or more options' : 'Select one option'}
          </Typography>

          {/* Voting Interface */}
          {poll.type === 'multiple_choice' ? (
            <Box>
              {poll.options.map((option: any) => (
                <FormControlLabel
                  key={option.id}
                  control={
                    <Checkbox
                      checked={selectedOptions.includes(option.id)}
                      onChange={(e) => handleMultipleChoice(option.id, e.target.checked)}
                      disabled={isLoading}
                    />
                  }
                  label={option.text}
                />
              ))}
            </Box>
          ) : (
            <RadioGroup
              value={selectedOptions[0] || ''}
              onChange={(e) => handleSingleChoice(e.target.value)}
            >
              {poll.options.map((option: any) => (
                <FormControlLabel
                  key={option.id}
                  value={option.id}
                  control={<Radio disabled={isLoading} />}
                  label={option.text}
                />
              ))}
            </RadioGroup>
          )}

          {/* Real-time Results (if available) */}
          {results.length > 0 && totalVotes > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" mb={1}>
                Current Results ({totalVotes} votes):
              </Typography>
              {results.map((result) => (
                <Box key={result.id} mb={1}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">{result.text}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {result.voteCount} ({result.percentage.toFixed(1)}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={result.percentage}
                    sx={{ height: 6, borderRadius: 1 }}
                  />
                </Box>
              ))}
            </Box>
          )}

          <Typography variant="caption" color="text.secondary">
            Poll ends: {new Date(poll.endDate).toLocaleString()}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading || selectedOptions.length === 0}
          startIcon={isLoading && <CircularProgress size={20} />}
        >
          Submit Vote
        </Button>
      </DialogActions>
    </Dialog>
  );
}
