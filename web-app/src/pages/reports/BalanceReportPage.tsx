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
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { reportsApi } from '@horizon-hcm/shared/src/api/financial';
import { queryKeys } from '../../lib/query-keys';
import { useAppStore } from '../../store/app.store';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function BalanceReportPage() {
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(),
  });

  const {
    data: report,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.reports.balance(selectedBuildingId || '', dateRange),
    queryFn: () => reportsApi.getBalance(selectedBuildingId || '', dateRange),
    enabled: !!selectedBuildingId,
    select: (response) => response.data,
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

  const handleExportExcel = async () => {
    try {
      const response = await reportsApi.exportToExcel('balance', {
        buildingId: selectedBuildingId,
        ...dateRange,
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `balance-report-${new Date().toISOString().split('T')[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Excel:', err);
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

  if (!report) {
    return null;
  }

  const { data } = report;
  const isNegativeBalance = data.balance < 0;
  const changePercentage = data.comparison?.changePercentage || 0;
  const isPositiveChange = changePercentage > 0;

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Balance Report</Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportPDF}>
            Export PDF
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportExcel}>
            Export Excel
          </Button>
        </Box>
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

      {/* Negative Balance Warning */}
      {isNegativeBalance && (
        <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3 }}>
          Warning: Current balance is negative (₪{data.balance.toFixed(2)}). Immediate action
          required.
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Income
              </Typography>
              <Typography variant="h4" color="success.main">
                ₪{data.totalIncome.toFixed(2)}
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
                ₪{data.totalExpense.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Balance
              </Typography>
              <Typography variant="h4" color={isNegativeBalance ? 'error.main' : 'success.main'}>
                ₪{data.balance.toFixed(2)}
              </Typography>
              {data.comparison && (
                <Box display="flex" alignItems="center" gap={1} mt={1}>
                  {isPositiveChange ? (
                    <TrendingUpIcon color="success" fontSize="small" />
                  ) : (
                    <TrendingDownIcon color="error" fontSize="small" />
                  )}
                  <Typography
                    variant="body2"
                    color={isPositiveChange ? 'success.main' : 'error.main'}
                  >
                    {Math.abs(changePercentage).toFixed(1)}% vs previous period
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Balance Trend Chart */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" mb={2}>
          Balance Trend
        </Typography>
        {/* @ts-expect-error - Recharts types incompatible with React 18 */}
        <ResponsiveContainer width="100%" height={300}>
          {/* @ts-expect-error - Recharts types incompatible with React 18 */}
          <LineChart data={data.trend}>
            <CartesianGrid strokeDasharray="3 3" />
            {/* @ts-expect-error - Recharts types incompatible with React 18 */}
            <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
            {/* @ts-expect-error - Recharts types incompatible with React 18 */}
            <YAxis />
            {/* @ts-expect-error - Recharts types incompatible with React 18 */}
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
              formatter={(value: number) => `₪${value.toFixed(2)}`}
            />
            {/* @ts-expect-error - Recharts types incompatible with React 18 */}
            <Legend />
            {/* @ts-expect-error - Recharts types incompatible with React 18 */}
            <Line type="monotone" dataKey="income" stroke="#00C49F" name="Income" />
            {/* @ts-expect-error - Recharts types incompatible with React 18 */}
            <Line type="monotone" dataKey="expense" stroke="#FF8042" name="Expense" />
            {/* @ts-expect-error - Recharts types incompatible with React 18 */}
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#0088FE"
              name="Balance"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Category Breakdown */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Category Breakdown
            </Typography>
            {/* @ts-expect-error - Recharts types incompatible with React 18 */}
            <ResponsiveContainer width="100%" height={300}>
              {/* @ts-expect-error - Recharts types incompatible with React 18 */}
              <PieChart>
                {/* @ts-expect-error - Recharts types incompatible with React 18 */}
                <Pie
                  data={data.categories}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.category}: ₪${entry.amount.toFixed(0)}`}
                >
                  {data.categories.map((_entry, index) => (
                    // @ts-expect-error - Recharts types incompatible with React 18
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                {/* @ts-expect-error - Recharts types incompatible with React 18 */}
                <Tooltip formatter={(value: number) => `₪${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Category Details
            </Typography>
            <Box>
              {data.categories.map((category, index) => (
                <Box
                  key={category.category}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  py={1}
                  borderBottom={index < data.categories.length - 1 ? 1 : 0}
                  borderColor="divider"
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      width={16}
                      height={16}
                      bgcolor={COLORS[index % COLORS.length]}
                      borderRadius={1}
                    />
                    <Typography variant="body2">{category.category}</Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="body2" fontWeight="bold">
                      ₪{category.amount.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {category.percentage.toFixed(1)}% ({category.transactions} transactions)
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
