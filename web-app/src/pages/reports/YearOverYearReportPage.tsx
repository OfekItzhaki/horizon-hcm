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

interface YearOverYearData {
  currentYear: { income: number; expenses: number };
  previousYear: { income: number; expenses: number };
  change: { income: number; expenses: number };
  changePercent: { income: number; expenses: number };
  monthlyBreakdown: Array<{ month: number; income: number; expenses: number }>;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
    select: (response) => response.data as unknown as YearOverYearData,
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
      link.setAttribute('download', `year-over-year-report-${new Date().toISOString().split('T')[0]}.pdf`);
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
      link.setAttribute('download', `year-over-year-report-${new Date().toISOString().split('T')[0]}.xlsx`);
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

  if (!report) return null;

  const incomeChange = report.changePercent?.income ?? 0;
  const isPositiveChange = incomeChange > 0;
  const isSignificantChange = Math.abs(incomeChange) > 20;

  const availableYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // Map monthly breakdown to chart-friendly format
  const monthlyChartData = (report.monthlyBreakdown || []).map((m) => ({
    month: MONTH_NAMES[m.month - 1],
    income: m.income,
    expenses: m.expenses,
  }));

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
              <MenuItem key={year} value={year}>{year}</MenuItem>
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
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {isSignificantChange && (
        <Alert
          severity={isPositiveChange ? 'success' : 'warning'}
          icon={isPositiveChange ? <TrendingUpIcon /> : <TrendingDownIcon />}
          sx={{ mb: 3 }}
        >
          Significant {isPositiveChange ? 'increase' : 'decrease'} of {Math.abs(incomeChange).toFixed(1)}% in income compared to previous year
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedYears[0]} Income
              </Typography>
              <Typography variant="h5">₪{(report.previousYear?.income ?? 0).toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedYears[1]} Income
              </Typography>
              <Typography variant="h5">₪{(report.currentYear?.income ?? 0).toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Income Change
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {isPositiveChange ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />}
                <Typography variant="h5" color={isPositiveChange ? 'success.main' : 'error.main'}>
                  {isPositiveChange ? '+' : ''}{incomeChange.toFixed(1)}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {(report.change?.income ?? 0) >= 0 ? '+' : ''}₪{(report.change?.income ?? 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedYears[1]} Expenses
              </Typography>
              <Typography variant="h5">₪{(report.currentYear?.expenses ?? 0).toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Monthly Income Trend */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" mb={2}>{selectedYears[1]} Monthly Trend</Typography>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={monthlyChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => `₪${value.toFixed(2)}`} />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#00C49F" name="Income" strokeWidth={2} />
            <Line type="monotone" dataKey="expenses" stroke="#FF8042" name="Expenses" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Monthly Bar Breakdown */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" mb={2}>Monthly Breakdown</Typography>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={monthlyChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => `₪${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="income" fill="#00C49F" name="Income" />
            <Bar dataKey="expenses" fill="#FF8042" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
