import { useState, useEffect } from 'react';
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
  FormControlLabel,
  Checkbox,
  IconButton,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../../store/app.store';
import { queryKeys } from '../../lib/query-keys';
import { pollsApi } from '@horizon-hcm/shared/src/api/communication';
import type { Poll } from '@horizon-hcm/shared/src/types/voting';

interface PollFormDialogProps {
  open: boolean;
  onClose: () => void;
  poll?: Poll | null;
}

interface FormData {
  question: string;
  options: Array<{ text: string }>;
  startDate: string;
  endDate: string;
  type: 'single_choice' | 'multiple_choice';
  anonymous: boolean;
}

export default function PollFormDialog({ open, onClose, poll }: PollFormDialogProps) {
  const selectedBuildingId = useAppStore((state: any) => state.selectedBuildingId);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      question: '',
      options: [{ text: '' }, { text: '' }],
      startDate: '',
      endDate: '',
      type: 'single_choice',
      anonymous: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  useEffect(() => {
    if (poll) {
      reset({
        question: poll.question,
        options: poll.options.map((opt: any) => ({ text: opt.text })),
        startDate: new Date(poll.startDate).toISOString().slice(0, 16),
        endDate: new Date(poll.endDate).toISOString().slice(0, 16),
        type: poll.type,
        anonymous: poll.anonymous,
      });
    } else {
      reset({
        question: '',
        options: [{ text: '' }, { text: '' }],
        startDate: '',
        endDate: '',
        type: 'single_choice',
        anonymous: true,
      });
    }
  }, [poll, reset]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Poll>) => pollsApi.create(selectedBuildingId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.all });
      handleClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create poll');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Poll>) => pollsApi.update(selectedBuildingId!, poll!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.all });
      handleClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update poll');
    },
  });

  const onSubmit = (data: FormData) => {
    setError(null);

    // Validate at least 2 options
    const validOptions = data.options.filter((opt) => opt.text.trim());
    if (validOptions.length < 2) {
      setError('Poll must have at least 2 options');
      return;
    }

    const payload: Partial<Poll> = {
      question: data.question,
      options: validOptions.map((opt) => ({ text: opt.text.trim() })) as any,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      type: data.type,
      anonymous: data.anonymous,
    };

    if (poll) {
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
        <DialogTitle>{poll ? 'Edit Poll' : 'Create Poll'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Question"
              {...register('question', { required: 'Question is required' })}
              error={!!errors.question}
              helperText={errors.question?.message}
              fullWidth
              disabled={isLoading}
            />

            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2">Options (minimum 2)</Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => append({ text: '' })}
                  disabled={isLoading}
                >
                  Add Option
                </Button>
              </Box>

              {fields.map((field, index) => (
                <Box key={field.id} display="flex" gap={1} mb={1}>
                  <TextField
                    label={`Option ${index + 1}`}
                    {...register(`options.${index}.text` as const, {
                      required: index < 2 ? 'Required' : false,
                    })}
                    error={!!errors.options?.[index]?.text}
                    helperText={errors.options?.[index]?.text?.message}
                    fullWidth
                    disabled={isLoading}
                  />
                  {fields.length > 2 && (
                    <IconButton onClick={() => remove(index)} disabled={isLoading} color="error">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Box>

            <TextField
              label="Start Date"
              type="datetime-local"
              {...register('startDate', { required: 'Start date is required' })}
              error={!!errors.startDate}
              helperText={errors.startDate?.message}
              InputLabelProps={{ shrink: true }}
              fullWidth
              disabled={isLoading}
            />

            <TextField
              label="End Date"
              type="datetime-local"
              {...register('endDate', { required: 'End date is required' })}
              error={!!errors.endDate}
              helperText={errors.endDate?.message}
              InputLabelProps={{ shrink: true }}
              fullWidth
              disabled={isLoading}
            />

            <FormControlLabel
              control={
                <Checkbox
                  {...register('type')}
                  checked={control._formValues.type === 'multiple_choice'}
                  onChange={(e) => {
                    const newType = e.target.checked ? 'multiple_choice' : 'single_choice';
                    control._formValues.type = newType;
                  }}
                  disabled={isLoading}
                />
              }
              label="Allow Multiple Choices"
            />

            <FormControlLabel
              control={<Checkbox {...register('anonymous')} disabled={isLoading} />}
              label="Anonymous Voting"
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
            {poll ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
