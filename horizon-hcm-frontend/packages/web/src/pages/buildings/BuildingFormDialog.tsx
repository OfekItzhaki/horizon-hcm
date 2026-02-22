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
import { buildingSchema, type BuildingInput } from '@horizon-hcm/shared';
import { buildingsApi } from '@horizon-hcm/shared';
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
          name: building.name,
          address: building.address,
          contactEmail: building.contactEmail,
          contactPhone: building.contactPhone,
        }
      : {
          name: '',
          address: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
          },
          contactEmail: '',
          contactPhone: '',
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: BuildingInput) => buildingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all });
      handleClose();
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to create building. Please try again.';
      setError(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: BuildingInput) => buildingsApi.update(building!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.detail(building!.id) });
      handleClose();
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to update building. Please try again.';
      setError(message);
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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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
                name="address.street"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Street Address"
                    fullWidth
                    error={!!errors.address?.street}
                    helperText={errors.address?.street?.message}
                    disabled={isLoading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="address.city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="City"
                    fullWidth
                    error={!!errors.address?.city}
                    helperText={errors.address?.city?.message}
                    disabled={isLoading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="address.state"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="State"
                    fullWidth
                    error={!!errors.address?.state}
                    helperText={errors.address?.state?.message}
                    disabled={isLoading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="address.postalCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Postal Code"
                    fullWidth
                    error={!!errors.address?.postalCode}
                    helperText={errors.address?.postalCode?.message}
                    disabled={isLoading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="address.country"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Country"
                    fullWidth
                    error={!!errors.address?.country}
                    helperText={errors.address?.country?.message}
                    disabled={isLoading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="contactEmail"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Contact Email"
                    type="email"
                    fullWidth
                    error={!!errors.contactEmail}
                    helperText={errors.contactEmail?.message}
                    disabled={isLoading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="contactPhone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Contact Phone"
                    type="tel"
                    fullWidth
                    error={!!errors.contactPhone}
                    helperText={errors.contactPhone?.message}
                    disabled={isLoading}
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
