import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { invoicesApi, paymentsApi } from '@horizon-hcm/shared/src/api/financial';
import type { Invoice, Payment, InvoiceStatus } from '@horizon-hcm/shared/src/types/financial';
import { queryKeys } from '../../lib/query-keys';
import { useAppStore } from '../../store/app.store';
import PaymentFormDialog from './PaymentFormDialog';

const statusColors: Record<InvoiceStatus, 'default' | 'success' | 'warning' | 'error'> = {
  pending: 'warning',
  paid: 'success',
  overdue: 'error',
  cancelled: 'default',
};

export default function PaymentDashboardPage() {
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: queryKeys.invoices.list(selectedBuildingId || ''),
    queryFn: () => invoicesApi.getAll({ buildingId: selectedBuildingId }),
    enabled: !!selectedBuildingId,
    select: (response) => {
      const body = response.data as any;
      const arr = Array.isArray(body) ? body : (body?.data ?? body?.items ?? []);
      return Array.isArray(arr) ? arr : [];
    },
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: queryKeys.payments.list(selectedBuildingId || ''),
    queryFn: () => paymentsApi.getAll({ buildingId: selectedBuildingId }),
    enabled: !!selectedBuildingId,
    select: (response) => {
      const body = response.data as any;
      const arr = Array.isArray(body) ? body : (body?.data ?? body?.items ?? []);
      return Array.isArray(arr) ? arr : [];
    },
  });

  const handlePayClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedInvoice(null);
  };

  if (!selectedBuildingId) {
    return (
      <Box p={3}>
        <Alert severity="info">Please select a building to view payment dashboard.</Alert>
      </Box>
    );
  }

  if (invoicesLoading || paymentsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const pendingInvoices = (Array.isArray(invoices) ? invoices : []).filter((inv: any) => inv.status === 'pending');
  const overdueInvoices = (Array.isArray(invoices) ? invoices : []).filter((inv: any) => inv.status === 'overdue');
  const paidInvoices = (Array.isArray(invoices) ? invoices : []).filter((inv: any) => inv.status === 'paid');
  const recentPayments = (Array.isArray(payments) ? payments : []).slice(0, 5);

  const totalPending = pendingInvoices.reduce((sum: number, inv: any) => sum + Number(inv.amount), 0);
  const totalOverdue = overdueInvoices.reduce((sum: number, inv: any) => sum + Number(inv.amount), 0);

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>
        Payment Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <WarningIcon color="warning" fontSize="large" />
                <Box>
                  <Typography variant="h6">{pendingInvoices.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Invoices
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    ₪{totalPending.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <WarningIcon color="error" fontSize="large" />
                <Box>
                  <Typography variant="h6">{overdueInvoices.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overdue Invoices
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    ₪{totalOverdue.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircleIcon color="success" fontSize="large" />
                <Box>
                  <Typography variant="h6">{paidInvoices.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Paid Invoices
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Overdue Warning */}
      {overdueInvoices.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<WarningIcon />}>
          You have {overdueInvoices.length} overdue invoice(s) totaling ₪{totalOverdue.toFixed(2)}.
          Please pay as soon as possible to avoid late fees.
        </Alert>
      )}

      {/* Pending Invoices */}
      <Paper sx={{ mb: 3 }}>
        <Box p={2}>
          <Typography variant="h6" mb={2}>
            Pending Invoices
          </Typography>
          {pendingInvoices.length === 0 && overdueInvoices.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No pending invoices
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...overdueInvoices, ...pendingInvoices].map((invoice: any) => {
                    const dueDate = invoice.dueDate || invoice.due_date;
                    return (
                      <TableRow key={invoice.id} hover>
                        <TableCell>{invoice.description}</TableCell>
                        <TableCell>
                          {invoice.currency} {Number(invoice.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>{dueDate ? new Date(dueDate).toLocaleDateString() : '—'}</TableCell>
                        <TableCell>
                          <Chip
                            label={invoice.status}
                            color={statusColors[invoice.status as InvoiceStatus] ?? 'default'}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<PaymentIcon />}
                            onClick={() => handlePayClick(invoice)}
                          >
                            Pay Now
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      {/* Recent Payment History */}
      <Paper>
        <Box p={2}>
          <Typography variant="h6" mb={2}>
            Recent Payment History
          </Typography>
          {recentPayments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No payment history
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentPayments.map((payment: any) => {
                    const paidAt = payment.paidAt || payment.paid_at || payment.createdAt || payment.created_at;
                    return (
                      <TableRow key={payment.id} hover>
                        <TableCell>{payment.transactionId || payment.transaction_id || payment.id}</TableCell>
                        <TableCell>
                          {payment.currency} {Number(payment.amount).toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>
                          {(payment.method || payment.payment_method || '').replace('_', ' ')}
                        </TableCell>
                        <TableCell>{paidAt ? new Date(paidAt).toLocaleDateString() : '—'}</TableCell>
                        <TableCell>
                          <Chip
                            label={payment.status}
                            color={payment.status === 'completed' ? 'success' : 'default'}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      {/* Payment Dialog */}
      {selectedInvoice && (
        <PaymentFormDialog
          open={paymentDialogOpen}
          onClose={handleClosePaymentDialog}
          invoiceId={selectedInvoice.id}
          invoiceAmount={Number(selectedInvoice.amount)}
        />
      )}
    </Box>
  );
}
