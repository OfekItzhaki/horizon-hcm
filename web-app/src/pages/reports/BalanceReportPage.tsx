import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Warning as WarningIcon,
  AccountBalance as BalanceIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@horizon-hcm/shared/src/api/financial';
import { queryKeys } from '../../lib/query-keys';
import { useAppStore } from '../../store/app.store';

export default function BalanceReportPage() {
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(),
  });

  const { data: report, isLoading, error } = useQuery({
    queryKey: queryKeys.reports.balance(selectedBuildingId || '', dateRange),
    queryFn: () => reportsApi.getBalance(selectedBuildingId || '', dateRange),
    enabled: !!selectedBuildingId,
    select: (response) => response.data as any,
  });

  const handleExportPDF = async () => {
    try {
      const response = await reportsApi.exportToPDF('balance', {
        buildingId: selectedBuildingId,
        ...dateRange,
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `balance-report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    }
  };

  if (!selectedBuildingId) {
    return (
      <Box p={3}>
        <Alert severity="info">Please select a building to view balance report.</Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load balance report. Please try again.</Alert>
      </Box>
    );
  }

  if (!report) return null;

  // Backend returns { balance, lastUpdated } — handle both flat and nested shapes
  const balance = Number(report?.data?.balance ?? report?.balance ?? 0);
  const totalIncome = Number(report?.data?.totalIncome ?? report?.totalIncome ?? balance);
  const totalExpense = Number(report?.data?.totalExpense ?? report?.totalExpense ?? 0);
  const lastUpdated = report?.data?.lastUpdated ?? report?.lastUpdated;
  const isNegativeBalance = balance < 0;

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Balance Report</Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportPDF}>
          Export PDF
        </Button>
      </Box>

      {/* Date Range Filter */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            label="Start Date"
            type="date"
            value={dateRange.startDate.toISOString().split('T')[0]}
            onChange={(e) => setDateRange({ ...dateRange, startDate: new Date(e.target.value) })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="date"
            value={dateRange.endDate.toISOString().split('T')[0]}
            onChange={(e) => setDateRange({ ...dateRange, endDate: new Date(e.target.value) })}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </Paper>

      {isNegativeBalance && (
        <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3 }}>
          Warning: Current balance is negative (₪{balance.toFixed(2)}). Immediate action required.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <BalanceIcon color="primary" />
                <Typography variant="body2" color="text.secondary">Current Balance</Typography>
              </Box>
              <Typography variant="h4" color={isNegativeBalance ? 'error.main' : 'success.main'}>
                ₪{balance.toFixed(2)}
              </Typography>
              {lastUpdated && (
                <Typography variant="caption" color="text.secondary">
                  Updated: {new Date(lastUpdated).toLocaleString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Income
              </Typography>
              <Typography variant="h4" color="success.main">
                ₪{totalIncome.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Expenses
              </Typography>
              <Typography variant="h4" color="error.main">
                ₪{totalExpense.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
