import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  MenuItem,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '@horizon-hcm/shared';
import { queryKeys } from '../../lib/query-keys';
import { useAppStore } from '../../store';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import { format } from 'date-fns';
import InvoiceFormDialog from './InvoiceFormDialog.tsx';
import type { Invoice } from '@horizon-hcm/shared';

export default function InvoicesPage() {
  const selectedBuilding = useAppStore((state) => state.selectedBuildingId);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: queryKeys.invoices.list(selectedBuilding || ''),
    queryFn: async () => {
      if (!selectedBuilding) return [];
      const response = await invoicesApi.getAll({ buildingId: selectedBuilding });
      return response.data;
    },
    enabled: !!selectedBuilding,
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    setSelectedInvoice(null);
    setIsFormOpen(true);
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedInvoice(null);
  };

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

  if (!selectedBuilding) {
    return (
      <Box>
        <Typography variant="h4" component="h1" mb={3}>
          Invoices
        </Typography>
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              Please select a building to view invoices.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Invoices
        </Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined">Bulk Create</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            Create Invoice
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {isLoading ? (
        <Typography>Loading invoices...</Typography>
      ) : filteredInvoices.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              {searchQuery || statusFilter !== 'all'
                ? 'No invoices found matching your filters.'
                : 'No invoices yet. Create your first invoice!'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>Apartment</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {invoice.description}
                    </Typography>
                  </TableCell>
                  <TableCell>{invoice.apartmentId}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {invoice.currency} {invoice.amount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.status.toUpperCase()}
                      color={getStatusColor(invoice.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{format(new Date(invoice.createdAt), 'MMM dd, yyyy')}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(invoice)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <InvoiceFormDialog
        open={isFormOpen}
        invoice={selectedInvoice}
        buildingId={selectedBuilding}
        onClose={handleCloseForm}
      />
    </Box>
  );
}
