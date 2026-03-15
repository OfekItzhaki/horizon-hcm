import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@horizon-hcm/shared';

const ACTION_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  'auth.login': 'success',
  'auth.logout': 'default',
  'auth.login_failed': 'error',
  'auth.password_reset': 'warning',
  'data.create': 'primary',
  'data.update': 'info',
  'data.delete': 'error',
  'data.read': 'default',
  'permission.grant': 'success',
  'permission.revoke': 'warning',
  'security.': 'error',
};

function getActionColor(action: string) {
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (action.startsWith(key)) return color;
  }
  return 'default' as const;
}

export default function AuditLogPage() {
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resourceType: '',
    startDate: '',
    endDate: '',
  });
  const [applied, setApplied] = useState(filters);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-logs', applied, page, rowsPerPage],
    queryFn: async () => {
      const res = await adminApi.getAuditLogs({
        userId: applied.userId || undefined,
        action: applied.action || undefined,
        resourceType: applied.resourceType || undefined,
        startDate: applied.startDate || undefined,
        endDate: applied.endDate || undefined,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      });
      return res.data;
    },
    staleTime: 10_000,
  });

  const logs = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleApply = () => {
    setApplied(filters);
    setPage(0);
  };

  const handleReset = () => {
    const empty = { userId: '', action: '', resourceType: '', startDate: '', endDate: '' };
    setFilters(empty);
    setApplied(empty);
    setPage(0);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Audit Log</Typography>
        <Button startIcon={<RefreshIcon />} onClick={() => refetch()}>
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="User ID"
              size="small"
              fullWidth
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Action"
              size="small"
              fullWidth
              placeholder="e.g. auth.login"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Resource Type"
              size="small"
              fullWidth
              value={filters.resourceType}
              onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="End Date"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Box display="flex" gap={1}>
              <Button variant="contained" size="small" onClick={handleApply}>
                Apply
              </Button>
              <Button size="small" onClick={handleReset}>
                Reset
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {isLoading && <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load audit logs</Alert>}

      {!isLoading && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Resource Type</TableCell>
                <TableCell>Resource ID</TableCell>
                <TableCell>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log: any) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip label={log.action} size="small" color={getActionColor(log.action)} />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {log.user_id ? log.user_id.slice(0, 8) + '…' : '—'}
                  </TableCell>
                  <TableCell>{log.resource_type || '—'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {log.resource_id ? log.resource_id.slice(0, 8) + '…' : '—'}
                  </TableCell>
                  <TableCell>{log.ip_address || '—'}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No audit logs found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </TableContainer>
      )}
    </Box>
  );
}
