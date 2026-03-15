import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { reportsApi } from '@horizon-hcm/shared/src/api/financial';
import { queryKeys } from '../../lib/query-keys';
import { useAppStore } from '../../store/app.store';

interface BudgetCategory {
  name: string;
  budgeted: number | null;
  actual: number;
  variance: number | null;
  variancePercent: number | null;
  isFavorable: boolean | null;
}

export default function BudgetComparisonReportPage() {
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
    queryKey: queryKeys.reports.budget(selectedBuildingId || '', dateRange),
    queryFn: () => reportsApi.getBudgetComparison(selectedBuildingId || '', dateRange),
    enabled: !!selectedBuildingId,
    select: (response) => response.data as unknown as { categories: BudgetCategory[] },
  });

  const handleExportPDF = async () => {
    try {
      const response = await reportsApi.exportToPDF('budget_comparison', {
        buildingId: selectedBuildingId,
        ...dateRange,
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `budget-comparison-${new Date().toISOString().split('T')[0]}.pdf`);
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
      const response = await reportsApi.exportToExcel('budget_comparison', {
        buildingId: selectedBuildingId,
        ...dateRange,
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `budget-comparison-${new Date().toISOString().split('T')[0]}.xlsx`);
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
        <Alert severity="info">Please select a building to view budget comparison report.</Alert>
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
        <Alert severity="error">Failed to load budget comparison report. Please try again.</Alert>
      </Box>
    );
  }

  if (!report) return null;

  const categories: BudgetCategory[] = report.categories || [];

  const chartData = categories.map((cat) => ({
    category: cat.name,
    budgeted: cat.budgeted ?? 0,
    actual: cat.actual,
  }));

  const overBudgetCategories = categories.filter(
    (cat) => cat.variancePercent !== null && cat.variancePercent > 10
  );

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Budget Comparison Report</Typography>
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

      {overBudgetCategories.length > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          {overBudgetCategories.length} categor{overBudgetCategories.length === 1 ? 'y' : 'ies'} exceeding budget by more than 10%
        </Alert>
      )}

      {/* Budget vs Actual Chart */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" mb={2}>Budget vs Actual Comparison</Typography>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip formatter={(value: number) => `₪${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="budgeted" fill="#8884d8" name="Budgeted">
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill="#8884d8" />
              ))}
            </Bar>
            <Bar dataKey="actual" fill="#82ca9d" name="Actual">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.actual > entry.budgeted ? '#ff8042' : '#82ca9d'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Detailed Budget Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell align="right">Budgeted</TableCell>
              <TableCell align="right">Actual</TableCell>
              <TableCell align="right">Variance</TableCell>
              <TableCell align="right">Variance %</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => {
              const isOverBudget = category.variancePercent !== null && category.variancePercent > 10;
              const isWarning = category.variancePercent !== null && category.variancePercent > 0 && category.variancePercent <= 10;
              const variance = category.variance ?? 0;

              return (
                <TableRow key={category.name} hover>
                  <TableCell>{category.name}</TableCell>
                  <TableCell align="right">
                    {category.budgeted !== null ? `₪${category.budgeted.toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell align="right">₪{category.actual.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    {category.variance !== null ? (
                      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                        {variance > 0 ? (
                          <TrendingUpIcon fontSize="small" color="error" />
                        ) : (
                          <TrendingDownIcon fontSize="small" color="success" />
                        )}
                        <Typography variant="body2" color={variance > 0 ? 'error.main' : 'success.main'}>
                          {variance > 0 ? '+' : ''}₪{variance.toFixed(2)}
                        </Typography>
                      </Box>
                    ) : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {category.variancePercent !== null ? (
                      <Typography
                        variant="body2"
                        color={isOverBudget ? 'error.main' : isWarning ? 'warning.main' : 'text.primary'}
                        fontWeight={isOverBudget || isWarning ? 'bold' : 'normal'}
                      >
                        {category.variancePercent > 0 ? '+' : ''}{category.variancePercent.toFixed(1)}%
                      </Typography>
                    ) : '—'}
                  </TableCell>
                  <TableCell align="center">
                    {category.budgeted === null ? (
                      <Chip label="No Budget Set" size="small" />
                    ) : isOverBudget ? (
                      <Chip label="Over Budget" color="error" size="small" />
                    ) : isWarning ? (
                      <Chip label="Near Limit" color="warning" size="small" />
                    ) : (
                      <Chip label="On Track" color="success" size="small" />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
