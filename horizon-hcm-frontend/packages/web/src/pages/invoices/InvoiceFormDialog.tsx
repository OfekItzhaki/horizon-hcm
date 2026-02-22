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
import { invoiceSchema, type InvoiceInput } from '@horizon-hcm/shared';
import { invoicesApi, apartmentsApi } from '@horizon-hcm/shared';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/query-keys';
import type { Invoice } from '@horizon-hcm/shared';

interface InvoiceFormDialogProps {
  open: boolean;
  invoice: Invoice | null;
  buildingId: string;
  onClose: () => void;
}

export default function InvoiceFormDialog({
  open,
  invoice,
  buildingId,
  onClose,
}: InvoiceFormDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!invoice;

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
  } = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoice
      ? {
          buildingId: invoice.buildingId,
          apartmentId: invoice.apartmentId,
          amount: invoice.amount,
          currency: invoice.currency,
          description: invoice.description,
          dueDate: new Date(invoice.dueDate),
        }
      : {
          buildingId,
          apartmentId: '',
          amount: 0,
          currency: 'ILS',
          description: '',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: InvoiceInput) => invoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.list(buildingId) });
      handleClose();
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to create invoice. Please try again.';
      setError(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InvoiceInput) => invoicesApi.update(invoice!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.list(buildingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(invoice!.id) });
      handleClose();
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to update invoice. Please try again.';
      setError(message);
    },
  });

  const onSubmit = (data: InvoiceInput) => {
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
      <DialogTitle>{isEdit ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
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
                    autoFocus
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

            <Grid item xs={12}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    disabled={isLoading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Amount"
                    type="number"
                    fullWidth
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                    disabled={isLoading}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Currency"
                    fullWidth
                    error={!!errors.currency}
                    helperText={errors.currency?.message}
                    disabled={isLoading}
                  >
                    <MenuItem value="ILS">ILS (₪)</MenuItem>
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              {/* @ts-expect-error - React Hook Form types mismatch with React 18 */}
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Due Date"
                    type="date"
                    fullWidth
                    error={!!errors.dueDate}
                    helperText={errors.dueDate?.message}
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
