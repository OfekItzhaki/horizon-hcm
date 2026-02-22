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
import { apartmentSchema, type ApartmentInput } from '@horizon-hcm/shared';
import { apartmentsApi } from '@horizon-hcm/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/query-keys';
import type { Apartment } from '@horizon-hcm/shared';

interface ApartmentFormDialogProps {
  open: boolean;
  apartment: Apartment | null;
  buildingId: string;
  onClose: () => void;
}

export default function ApartmentFormDialog({
  open,
  apartment,
  buildingId,
  onClose,
}: ApartmentFormDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!apartment;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ApartmentInput>({
    resolver: zodResolver(apartmentSchema),
    defaultValues: apartment
      ? {
          buildingId: apartment.buildingId,
          unitNumber: apartment.unitNumber,
          floor: apartment.floor,
          size: apartment.size,
        }
      : {
          buildingId,
          unitNumber: '',
          floor: 0,
          size: 0,
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: ApartmentInput) => apartmentsApi.create(buildingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apartments.list(buildingId) });
      handleClose();
    },
    onError: (err: any) => {
      const message =
        err.response?.data?.message || 'Failed to create apartment. Please try again.';
      setError(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ApartmentInput) => apartmentsApi.update(apartment!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apartments.list(buildingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.apartments.detail(apartment!.id) });
      handleClose();
    },
    onError: (err: any) => {
      const message =
        err.response?.data?.message || 'Failed to update apartment. Please try again.';
      setError(message);
    },
  });

  const onSubmit = (data: ApartmentInput) => {
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
      <DialogTitle>{isEdit ? 'Edit Apartment' : 'Add New Apartment'}</DialogTitle>
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
                name="unitNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Unit Number"
                    fullWidth
                    error={!!errors.unitNumber}
                    helperText={errors.unitNumber?.message}
                    disabled={isLoading}
                    autoFocus
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="floor"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Floor"
                    type="number"
                    fullWidth
                    error={!!errors.floor}
                    helperText={errors.floor?.message}
                    disabled={isLoading}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="size"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Size (m²)"
                    type="number"
                    fullWidth
                    error={!!errors.size}
                    helperText={errors.size?.message}
                    disabled={isLoading}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
