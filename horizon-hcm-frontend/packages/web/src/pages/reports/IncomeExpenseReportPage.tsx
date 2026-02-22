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
  Divider,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { reportsApi } from '@horizon-hcm/shared/src/api/financial';
import { queryKeys } from '../../lib/query-keys';
import { useAppStore } from '../../store/app.store';

const INCOME_COLORS = ['#00C49F', '#00E5A0', '#00FFA8'];
const EXPENSE_COLORS = ['#FF8042', '#FF6B35', '#FF5722'];

export default function IncomeExpenseReportPage() {
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
    queryKey: queryKeys.reports.incomeExpense(selectedBuildingId || '', dateRange),
    queryFn: () => reportsApi.getIncomeExpense(selectedBuildingId || '', dateRange),
    enabled: !!selectedBuildingId,
    select: (response) => response.data,
  });

  const handleExportPDF = async () => {
    try {
      const response = await reportsApi.exportToPDF('income_expense', {
        buildingId: selectedBuildingId,
        ...dateRange,
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `income-expense-report-${new Date().toISOString().split('T')[0]}.pdf`
      );
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
      const response = await reportsApi.exportToExcel('income_expense', {
        buildingId: selectedBuildingId,
        ...dateRange,
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `income-expense-report-${new Date().toISOString().split('T')[0]}.xlsx`
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
        <Alert severity="info">Please select a building to view income/expense report.</Alert>
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
        <Alert severity="error">Failed to load income/expense report. Please try again.</Alert>
      </Box>
    );
  }

  if (!report) {
    return null;
  }

  const { data } = report;
  const incomeCategories = data.categories.filter((c) => c.amount > 0);
  const expenseCategories = data.categories
    .filter((c) => c.amount < 0)
    .map((c) => ({
      ...c,
      amount: Math.abs(c.amount),
    }));

  const topExpenses = [...expenseCategories].sort((a, b) => b.amount - a.amount).slice(0, 5);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Income & Expense Report</Typography>
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
                Net Income
              </Typography>
              <Typography
                variant="h4"
                color={data.totalIncome - data.totalExpense >= 0 ? 'success.main' : 'error.main'}
              >
                ₪{(data.totalIncome - data.totalExpense).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trend Chart */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" mb={2}>
          Income & Expense Trend
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
            <Line type="monotone" dataKey="income" stroke="#00C49F" name="Income" strokeWidth={2} />
            {/* @ts-expect-error - Recharts types incompatible with React 18 */}
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#FF8042"
              name="Expense"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Category Breakdown */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Income by Category
            </Typography>
            {/* @ts-expect-error - Recharts types incompatible with React 18 */}
            <ResponsiveContainer width="100%" height={300}>
              {/* @ts-expect-error - Recharts types incompatible with React 18 */}
              <PieChart>
                {/* @ts-expect-error - Recharts types incompatible with React 18 */}
                <Pie
                  data={incomeCategories}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.category}: ₪${entry.amount.toFixed(0)}`}
                >
                  {incomeCategories.map((_entry, index) => (
                    // @ts-expect-error - Recharts types incompatible with React 18
                    <Cell
                      key={`cell-${index}`}
                      fill={INCOME_COLORS[index % INCOME_COLORS.length]}
                    />
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
              Expenses by Category
            </Typography>
            {/* @ts-expect-error - Recharts types incompatible with React 18 */}
            <ResponsiveContainer width="100%" height={300}>
              {/* @ts-expect-error - Recharts types incompatible with React 18 */}
              <PieChart>
                {/* @ts-expect-error - Recharts types incompatible with React 18 */}
                <Pie
                  data={expenseCategories}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.category}: ₪${entry.amount.toFixed(0)}`}
                >
                  {expenseCategories.map((_entry, index) => (
                    // @ts-expect-error - Recharts types incompatible with React 18
                    <Cell
                      key={`cell-${index}`}
                      fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]}
                    />
                  ))}
                </Pie>
                {/* @ts-expect-error - Recharts types incompatible with React 18 */}
                <Tooltip formatter={(value: number) => `₪${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Expense Categories */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" mb={2}>
          Top 5 Expense Categories
        </Typography>
        <Box>
          {topExpenses.map((category, index) => (
            <Box key={category.category}>
              <Box display="flex" justifyContent="space-between" alignItems="center" py={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h6" color="text.secondary">
                    #{index + 1}
                  </Typography>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {category.category}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {category.transactions} transactions
                    </Typography>
                  </Box>
                </Box>
                <Box textAlign="right">
                  <Typography variant="h6" color="error.main">
                    ₪{category.amount.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {category.percentage.toFixed(1)}% of total
                  </Typography>
                </Box>
              </Box>
              {index < topExpenses.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Month-over-Month Comparison */}
      {data.comparison && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" mb={2}>
            Month-over-Month Comparison
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Current Period
                </Typography>
                <Typography variant="h5">₪{data.comparison.current.toFixed(2)}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Previous Period
                </Typography>
                <Typography variant="h5">₪{data.comparison.previous.toFixed(2)}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Change
                </Typography>
                <Typography
                  variant="h5"
                  color={data.comparison.change >= 0 ? 'success.main' : 'error.main'}
                >
                  {data.comparison.change >= 0 ? '+' : ''}₪{data.comparison.change.toFixed(2)} (
                  {data.comparison.changePercentage.toFixed(1)}%)
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}
