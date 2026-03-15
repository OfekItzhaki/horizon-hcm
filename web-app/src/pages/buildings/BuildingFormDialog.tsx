import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { buildingSchema, type BuildingInput, buildingsApi } from '@horizon-hcm/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/query-keys';
import type { Building } from '@horizon-hcm/shared';

interface BuildingFormDialogProps {
  open: boolean;
  building: Building | null;
  onClose: () => void;
}

export default function BuildingFormDialog({ open, building, onClose }: BuildingFormDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!building;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BuildingInput>({
    resolver: zodResolver(buildingSchema),
    defaultValues: building
      ? {
          name: building.name || '',
          addressLine: building.address_line || '',
          city: building.city || '',
          postalCode: building.postal_code || '',
          numUnits: building.num_units,
        }
      : {
          name: '',
          addressLine: '',
          city: '',
          postalCode: '',
          numUnits: undefined,
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: BuildingInput) => buildingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all });
      handleClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create building.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: BuildingInput) => buildingsApi.update(building!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all });
      handleClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update building.');
    },
  });

  const onSubmit = (data: BuildingInput) => {
    setError(null);
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Building' : 'Add New Building'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Building Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    disabled={isLoading}
                    autoFocus
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="addressLine"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Address *"
                    fullWidth
                    error={!!errors.addressLine}
                    helperText={errors.addressLine?.message}
                    disabled={isLoading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="City"
                    fullWidth
                    error={!!errors.city}
                    helperText={errors.city?.message}
                    disabled={isLoading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="postalCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Postal Code"
                    fullWidth
                    error={!!errors.postalCode}
                    helperText={errors.postalCode?.message}
                    disabled={isLoading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="numUnits"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    label="Number of Units"
                    type="number"
                    fullWidth
                    error={!!errors.numUnits}
                    helperText={errors.numUnits?.message}
                    disabled={isLoading}
                    inputProps={{ min: 1 }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
