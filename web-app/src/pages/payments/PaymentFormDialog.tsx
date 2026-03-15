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
import { apiClient } from '@horizon-hcm/shared/src/api/client';
import { queryKeys } from '../../lib/query-keys';

interface PaymentFormDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceAmount: number;
}

interface FormValues {
  method: 'credit_card' | 'bank_transfer' | 'cash';
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

export default function PaymentFormDialog({
  open,
  onClose,
  invoiceId,
  invoiceAmount,
}: PaymentFormDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { handleSubmit, watch, reset, register, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      method: 'credit_card',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    },
  });

  const paymentMethod = watch('method');

  const payMutation = useMutation({
    mutationFn: (data: FormValues) =>
      apiClient.post(`/invoices/${invoiceId}/pay`, {
        method: data.method,
        amount: invoiceAmount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      reset();
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to process payment');
    },
  });

  const onSubmit = (data: FormValues) => {
    if (data.method === 'credit_card') {
      if (!data.cardNumber || !data.expiryDate || !data.cvv) {
        setError('Please fill in all card details');
        return;
      }
    }
    setError(null);
    payMutation.mutate(data);
  };

  const handleClose = () => {
    if (!payMutation.isPending) {
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
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Amount"
              type="number"
              value={invoiceAmount}
              fullWidth
              InputProps={{ readOnly: true }}
            />

            <TextField
              select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setValue('method', e.target.value as FormValues['method'])}
              fullWidth
              required
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
                  inputProps={{ maxLength: 19 }}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    {...register('expiryDate')}
                    label="Expiry Date"
                    fullWidth
                    required
                    placeholder="MM/YY"
                    inputProps={{ maxLength: 5 }}
                  />
                  <TextField
                    {...register('cvv')}
                    label="CVV"
                    fullWidth
                    required
                    placeholder="123"
                    inputProps={{ maxLength: 4 }}
                  />
                </Box>
                <Alert severity="info">
                  Your card details are securely processed and never stored on our servers.
                </Alert>
              </>
            )}

            {paymentMethod === 'bank_transfer' && (
              <Alert severity="info">
                Please transfer the amount to our bank account and provide the transaction reference.
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
          <Button onClick={handleClose} disabled={payMutation.isPending}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={payMutation.isPending}
            startIcon={payMutation.isPending ? <CircularProgress size={20} /> : undefined}
          >
            {payMutation.isPending ? 'Processing...' : 'Pay Now'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
