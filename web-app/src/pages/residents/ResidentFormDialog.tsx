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
  MenuItem,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { residentSchema, type ResidentInput } from '@horizon-hcm/shared';
import { residentsApi, apartmentsApi } from '@horizon-hcm/shared';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/query-keys';
import type { Resident } from '@horizon-hcm/shared';

interface ResidentFormDialogProps {
  open: boolean;
  resident: Resident | null;
  buildingId: string;
  onClose: () => void;
}

export default function ResidentFormDialog({
  open,
  resident,
  buildingId,
  onClose,
}: ResidentFormDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!resident;

  // Fetch apartments for the building
  const { data: apartments = [] } = useQuery({
    queryKey: queryKeys.apartments.list(buildingId),
    queryFn: async () => {
      const response = await apartmentsApi.getByBuilding(buildingId);
      return response.data;
    },
    enabled: open && !!buildingId,
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResidentInput>({
    resolver: zodResolver(residentSchema),
    defaultValues: resident
      ? {
          userId: resident.userId,
          apartmentId: resident.apartmentId,
          buildingId: resident.buildingId,
          role: resident.role,
          name: resident.name,
          email: resident.email,
          phone: resident.phone,
          moveInDate: new Date(resident.moveInDate),
          moveOutDate: resident.moveOutDate ? new Date(resident.moveOutDate) : undefined,
        }
      : {
          userId: '',
          apartmentId: '',
          buildingId,
          role: 'tenant',
          name: '',
          email: '',
          phone: '',
          moveInDate: new Date(),
          moveOutDate: undefined,
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: ResidentInput) => residentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.residents.list(buildingId) });
      handleClose();
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to create resident. Please try again.';
      setError(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ResidentInput) => residentsApi.update(resident!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.residents.list(buildingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.residents.detail(resident!.id) });
      handleClose();
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to update resident. Please try again.';
      setError(message);
    },
  });

  const onSubmit = (data: ResidentInput) => {
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
      <DialogTitle>{isEdit ? 'Edit Resident' : 'Add New Resident'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Full Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    disabled={isLoading}
                    autoFocus
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Role"
                    fullWidth
                    error={!!errors.role}
                    helperText={errors.role?.message}
                    disabled={isLoading}
                  >
                    <MenuItem value="owner">Owner</MenuItem>
                    <MenuItem value="tenant">Tenant</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="apartmentId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Apartment"
                    fullWidth
                    error={!!errors.apartmentId}
                    helperText={errors.apartmentId?.message}
                    disabled={isLoading}
                  >
                    {apartments.map((apt) => (
                      <MenuItem key={apt.id} value={apt.id}>
                        Unit {apt.unitNumber} - Floor {apt.floor}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={isLoading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone"
                    type="tel"
                    fullWidth
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    disabled={isLoading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="moveInDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Move-in Date"
                    type="date"
                    fullWidth
                    error={!!errors.moveInDate}
                    helperText={errors.moveInDate?.message}
                    disabled={isLoading}
                    InputLabelProps={{ shrink: true }}
                    value={
                      field.value instanceof Date
                        ? field.value.toISOString().split('T')[0]
                        : field.value
                    }
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="moveOutDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Move-out Date (Optional)"
                    type="date"
                    fullWidth
                    error={!!errors.moveOutDate}
                    helperText={errors.moveOutDate?.message}
                    disabled={isLoading}
                    InputLabelProps={{ shrink: true }}
                    value={
                      field.value instanceof Date
                        ? field.value.toISOString().split('T')[0]
                        : field.value || ''
                    }
                    onChange={(e) =>
                      field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                    }
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="userId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="User ID (Optional)"
                    fullWidth
                    error={!!errors.userId}
                    helperText={errors.userId?.message || 'Link to existing user account'}
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
