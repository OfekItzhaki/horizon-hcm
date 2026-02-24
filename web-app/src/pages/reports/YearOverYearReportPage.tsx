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
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

export default function YearOverYearReportPage() {
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);
  const currentYear = new Date().getFullYear();
  const [selectedYears, setSelectedYears] = useState([currentYear - 1, currentYear]);

  const {
    data: report,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.reports.yearOverYear(selectedBuildingId || '', selectedYears),
    queryFn: () => reportsApi.getYearOverYear(selectedBuildingId || '', selectedYears),
    enabled: !!selectedBuildingId,
    select: (response) => response.data,
  });

  const handleExportPDF = async () => {
    try {
      const response = await reportsApi.exportToPDF('year_over_year', {
        buildingId: selectedBuildingId,
        years: selectedYears,
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `year-over-year-report-${new Date().toISOString().split('T')[0]}.pdf`
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
      const response = await reportsApi.exportToExcel('year_over_year', {
        buildingId: selectedBuildingId,
        years: selectedYears,
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `year-over-year-report-${new Date().toISOString().split('T')[0]}.xlsx`
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
        <Alert severity="info">Please select a building to view year-over-year report.</Alert>
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
        <Alert severity="error">Failed to load year-over-year report. Please try again.</Alert>
      </Box>
    );
  }

  if (!report) {
    return null;
  }

  const { data } = report;
  const changePercentage = data.comparison?.changePercentage || 0;
  const isPositiveChange = changePercentage > 0;
  const isSignificantChange = Math.abs(changePercentage) > 20;

  // Generate available years for selection
  const availableYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Year-over-Year Report</Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportPDF}>
            Export PDF
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportExcel}>
            Export Excel
          </Button>
        </Box>
      </Box>

      {/* Year Selection */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            select
            label="Previous Year"
            value={selectedYears[0]}
            onChange={(e) => setSelectedYears([parseInt(e.target.value), selectedYears[1]])}
            sx={{ minWidth: 150 }}
          >
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </TextField>
          <Typography variant="body1">vs</Typography>
          <TextField
            select
            label="Current Year"
            value={selectedYears[1]}
            onChange={(e) => setSelectedYears([selectedYears[0], parseInt(e.target.value)])}
            sx={{ minWidth: 150 }}
          >
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {/* Significant Change Alert */}
      {isSignificantChange && (
        <Alert
          severity={isPositiveChange ? 'success' : 'warning'}
          icon={isPositiveChange ? <TrendingUpIcon /> : <TrendingDownIcon />}
          sx={{ mb: 3 }}
        >
          Significant {isPositiveChange ? 'increase' : 'decrease'} of{' '}
          {Math.abs(changePercentage).toFixed(1)}% compared to previous year
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedYears[0]} Total
              </Typography>
              <Typography variant="h4">
                ₪{data.comparison?.previous.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedYears[1]} Total
              </Typography>
              <Typography variant="h4">₪{data.comparison?.current.toFixed(2) || '0.00'}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Year-over-Year Change
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {isPositiveChange ? (
                  <TrendingUpIcon color="success" />
                ) : (
                  <TrendingDownIcon color="error" />
                )}
                <Typography variant="h4" color={isPositiveChange ? 'success.main' : 'error.main'}>
                  {isPositiveChange ? '+' : ''}
                  {changePercentage.toFixed(1)}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mt={1}>
                {isPositiveChange ? '+' : ''}₪{data.comparison?.change.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Year-over-Year Trend Chart */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" mb={2}>
          Year-over-Year Trend
        </Typography>
        {/* @ts-expect-error - Recharts types incompatible with React 18 */}
        <ResponsiveContainer width="100%" height={350}>
          {/* @ts-expect-error - Recharts types incompatible with React 18 */}
          <LineChart data={data.trend}>
            <CartesianGrid strokeDasharray="3 3" />
            {/* @ts-expect-error - Recharts types incompatible with React 18 */}
            <XAxis
              dataKey="date"
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString('en-US', { month: 'short' })
              }
            />
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
            <Line
              type="monotone"
              dataKey="income"
              stroke="#00C49F"
              name={`${selectedYears[1]} Income`}
              strokeWidth={2}
            />
            {/* @ts-expect-error - Recharts types incompatible with React 18 */}
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#FF8042"
              name={`${selectedYears[1]} Expense`}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Monthly Breakdown */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" mb={2}>
          Monthly Breakdown
        </Typography>
        {/* @ts-expect-error - Recharts types incompatible with React 18 */}
        <ResponsiveContainer width="100%" height={350}>
          {/* @ts-expect-error - Recharts types incompatible with React 18 */}
          <BarChart data={data.trend}>
            <CartesianGrid strokeDasharray="3 3" />
            {/* @ts-expect-error - Recharts types incompatible with React 18 */}
            <XAxis
              dataKey="date"
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString('en-US', { month: 'short' })
              }
            />
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
            <Bar dataKey="income" fill="#00C49F" name="Income" />
            {/* @ts-expect-error - Recharts types incompatible with React 18 */}
            <Bar dataKey="expense" fill="#FF8042" name="Expense" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Category Comparison */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" mb={2}>
          Category Comparison
        </Typography>
        <Grid container spacing={2}>
          {data.categories.map((category) => {
            const prevAmount = category.amount * 0.85; // Mock previous year data
            const change = ((category.amount - prevAmount) / prevAmount) * 100;
            const isIncrease = change > 0;
            const isSignificant = Math.abs(change) > 20;

            return (
              <Grid item xs={12} md={6} key={category.category}>
                <Box
                  p={2}
                  border={1}
                  borderColor="divider"
                  borderRadius={1}
                  bgcolor={
                    isSignificant ? (isIncrease ? 'success.50' : 'error.50') : 'background.paper'
                  }
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body1" fontWeight="bold">
                      {category.category}
                    </Typography>
                    {isSignificant && (
                      <Chip
                        label={`${Math.abs(change).toFixed(0)}% ${isIncrease ? 'increase' : 'decrease'}`}
                        color={isIncrease ? 'success' : 'error'}
                        size="small"
                      />
                    )}
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        {selectedYears[0]}
                      </Typography>
                      <Typography variant="h6">₪{prevAmount.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        {selectedYears[1]}
                      </Typography>
                      <Typography variant="h6">₪{category.amount.toFixed(2)}</Typography>
                    </Grid>
                  </Grid>
                  <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                    {isIncrease ? (
                      <TrendingUpIcon fontSize="small" color={isIncrease ? 'success' : 'error'} />
                    ) : (
                      <TrendingDownIcon fontSize="small" color="error" />
                    )}
                    <Typography variant="body2" color={isIncrease ? 'success.main' : 'error.main'}>
                      {isIncrease ? '+' : ''}
                      {change.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    </Box>
  );
}
