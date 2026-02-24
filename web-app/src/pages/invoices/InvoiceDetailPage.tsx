import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ArrowBack, Edit, Cancel, Payment, Download, AttachFile } from '@mui/icons-material';
import { invoicesApi } from '@horizon-hcm/shared/src/api/financial';
import { useAuthStore } from '../../store/auth.store';
import { queryKeys } from '../../lib/query-keys';
import { useState } from 'react';
import PaymentFormDialog from '../payments/PaymentFormDialog';

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const {
    data: invoice,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.invoices.detail(invoiceId!),
    queryFn: () => invoicesApi.getById(invoiceId!),
    enabled: !!invoiceId,
  });

  const cancelMutation = useMutation({
    mutationFn: () => invoicesApi.cancel(invoiceId!, 'Cancelled by user'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      navigate('/invoices');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const isCommitteeMember = user?.role === 'committee_member' || user?.role === 'admin';
  const isResident = user?.role === 'owner' || user?.role === 'tenant';
  const canPay = isResident && invoice?.data.status === 'pending';
  const canEdit = isCommitteeMember && invoice?.data.status === 'pending';
  const canCancel = isCommitteeMember && invoice?.data.status === 'pending';

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !invoice) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load invoice details</Alert>
      </Box>
    );
  }

  const invoiceData = invoice.data;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
        <Box sx={{ flex: 1 }} />
        {canPay && (
          <Button
            variant="contained"
            startIcon={<Payment />}
            onClick={() => setPaymentDialogOpen(true)}
          >
            Pay Now
          </Button>
        )}
        {canEdit && (
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/invoices/${invoiceId}/edit`)}
          >
            Edit
          </Button>
        )}
        {canCancel && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Cancel />}
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            Cancel Invoice
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Invoice #{invoiceData.id.slice(0, 8)}
            </Typography>
            <Chip
              label={invoiceData.status.toUpperCase()}
              color={getStatusColor(invoiceData.status)}
              sx={{ mt: 1 }}
            />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h4" color="primary">
              {invoiceData.currency} {invoiceData.amount.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Due: {new Date(invoiceData.dueDate).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Invoice Details
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Invoice ID" secondary={invoiceData.id} />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Created Date"
                      secondary={new Date(invoiceData.createdAt).toLocaleDateString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Due Date"
                      secondary={new Date(invoiceData.dueDate).toLocaleDateString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Description" secondary={invoiceData.description} />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recipient Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Apartment ID" secondary={invoiceData.apartmentId} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Created By" secondary={invoiceData.createdBy} />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {invoiceData.attachments && invoiceData.attachments.length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Attached Documents
                  </Typography>
                  <List>
                    {invoiceData.attachments.map((attachment, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <Button startIcon={<Download />} size="small">
                            Download
                          </Button>
                        }
                      >
                        <AttachFile sx={{ mr: 2 }} />
                        <ListItemText primary={attachment.fileName || `Document ${index + 1}`} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Paper>

      {paymentDialogOpen && (
        <PaymentFormDialog
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          invoiceId={invoiceData.id}
          invoiceAmount={invoiceData.amount}
        />
      )}
    </Box>
  );
}
