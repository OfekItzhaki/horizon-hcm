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
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@horizon-hcm/shared/src/api/financial';
import {
  paymentFormSchema,
  type PaymentFormInput,
} from '@horizon-hcm/shared/src/schemas/financial';
import { queryKeys } from '../../lib/query-keys';

interface PaymentFormDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceAmount: number;
}

export default function PaymentFormDialog({
  open,
  onClose,
  invoiceId,
  invoiceAmount,
}: PaymentFormDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaymentFormInput>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      invoiceId,
      amount: invoiceAmount,
      method: 'credit_card',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    },
  });

  const paymentMethod = watch('method');

  const createPaymentMutation = useMutation({
    mutationFn: (data: PaymentFormInput) => paymentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      reset();
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to process payment');
    },
  });

  const onSubmit = (data: PaymentFormInput) => {
    setError(null);
    createPaymentMutation.mutate(data);
  };

  const handleClose = () => {
    if (!createPaymentMutation.isPending) {
      reset();
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Make Payment</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              {...register('amount')}
              label="Amount"
              type="number"
              fullWidth
              required
              error={!!errors.amount}
              helperText={errors.amount?.message}
              InputProps={{
                readOnly: true,
              }}
            />

            <TextField
              {...register('method')}
              select
              label="Payment Method"
              fullWidth
              required
              error={!!errors.method}
              helperText={errors.method?.message}
            >
              <MenuItem value="credit_card">Credit Card</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
            </TextField>

            {paymentMethod === 'credit_card' && (
              <>
                <TextField
                  {...register('cardNumber')}
                  label="Card Number"
                  fullWidth
                  required
                  placeholder="1234 5678 9012 3456"
                  error={!!errors.cardNumber}
                  helperText={errors.cardNumber?.message}
                  inputProps={{
                    maxLength: 19,
                  }}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    {...register('expiryDate')}
                    label="Expiry Date"
                    fullWidth
                    required
                    placeholder="MM/YY"
                    error={!!errors.expiryDate}
                    helperText={errors.expiryDate?.message}
                    inputProps={{
                      maxLength: 5,
                    }}
                  />

                  <TextField
                    {...register('cvv')}
                    label="CVV"
                    fullWidth
                    required
                    placeholder="123"
                    error={!!errors.cvv}
                    helperText={errors.cvv?.message}
                    inputProps={{
                      maxLength: 4,
                    }}
                  />
                </Box>

                <Alert severity="info" sx={{ mt: 1 }}>
                  Your card details are securely processed and never stored on our servers.
                </Alert>
              </>
            )}

            {paymentMethod === 'bank_transfer' && (
              <Alert severity="info">
                Please transfer the amount to our bank account and provide the transaction
                reference.
              </Alert>
            )}

            {paymentMethod === 'cash' && (
              <Alert severity="info">
                Please visit the building management office to make a cash payment.
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={createPaymentMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createPaymentMutation.isPending}
            startIcon={createPaymentMutation.isPending && <CircularProgress size={20} />}
          >
            {createPaymentMutation.isPending ? 'Processing...' : 'Pay Now'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
