import { useState } from 'react';
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
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../../store/app.store';
import { queryKeys } from '../../lib/query-keys';
import { maintenanceApi } from '@horizon-hcm/shared/src/api/maintenance';
import type { MaintenanceRequest } from '@horizon-hcm/shared/src/types/maintenance';

interface MaintenanceFormDialogProps {
  open: boolean;
  onClose: () => void;
  request?: MaintenanceRequest | null;
}

interface MaintenanceFormData {
  title: string;
  description: string;
  category: string;
  priority: string;
}

export default function MaintenanceFormDialog({ open, onClose }: MaintenanceFormDialogProps) {
  const selectedBuildingId = useAppStore((state: any) => state.selectedBuildingId);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaintenanceFormData>();

  const createMutation = useMutation({
    mutationFn: (formData: any) => maintenanceApi.create(selectedBuildingId!, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
      handleClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create request');
    },
  });

  const onSubmit = (data: MaintenanceFormData) => {
    setError(null);
    // For now, send as JSON (file upload would need FormData)
    createMutation.mutate({
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
    });
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      reset();
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Create Maintenance Request</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Title"
              {...register('title', { required: 'Title is required' })}
              error={!!errors.title}
              helperText={errors.title?.message}
              fullWidth
            />

            <TextField
              label="Description"
              {...register('description', { required: 'Description is required' })}
              error={!!errors.description}
              helperText={errors.description?.message}
              multiline
              rows={4}
              fullWidth
            />

            <TextField
              select
              label="Category"
              {...register('category')}
              defaultValue="general"
              fullWidth
            >
              <MenuItem value="plumbing">Plumbing</MenuItem>
              <MenuItem value="electrical">Electrical</MenuItem>
              <MenuItem value="hvac">HVAC</MenuItem>
              <MenuItem value="general">General</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>

            <TextField
              select
              label="Priority"
              {...register('priority')}
              defaultValue="normal"
              fullWidth
            >
              <MenuItem value="urgent">Urgent</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending}
            startIcon={createMutation.isPending && <CircularProgress size={20} />}
          >
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
