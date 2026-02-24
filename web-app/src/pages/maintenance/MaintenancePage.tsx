import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Pagination,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { maintenanceApi } from '@horizon-hcm/shared/src/api/maintenance';
import type { MaintenanceRequest } from '@horizon-hcm/shared/src/types/maintenance';
import { queryKeys } from '../../lib/query-keys';
import { useAppStore } from '../../store/app.store';
import MaintenanceFormDialog from './MaintenanceFormDialog';
import MaintenanceDetailDialog from './MaintenanceDetailDialog';

const statusColors: Record<string, any> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'default',
  rejected: 'error',
} as const;

const priorityColors: Record<string, any> = {
  urgent: 'error',
  high: 'warning',
  medium: 'info',
  normal: 'primary',
  low: 'default',
} as const;

export default function MaintenancePage() {
  const selectedBuildingId = useAppStore((state: any) => state.selectedBuildingId);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.maintenance.list(selectedBuildingId || '', {
      status: statusFilter === 'all' ? undefined : statusFilter,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      page,
      limit,
    }),
    queryFn: () =>
      maintenanceApi.getAll(selectedBuildingId || '', {
        status: statusFilter === 'all' ? undefined : statusFilter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        page,
        limit,
      }),
    enabled: !!selectedBuildingId,
    select: (response) => response.data,
  });

  const handleCreate = () => {
    setSelectedRequest(null);
    setFormOpen(true);
  };

  const handleEdit = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setFormOpen(true);
  };

  const handleView = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setDetailOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedRequest(null);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedRequest(null);
  };

  if (!selectedBuildingId) {
    return (
      <Box p={3}>
        <Alert severity="info">Please select a building to view maintenance requests.</Alert>
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
        <Alert severity="error">Failed to load maintenance requests. Please try again.</Alert>
      </Box>
    );
  }

  const requests = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / limit);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Maintenance Requests</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Create Request
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 150 }}
            size="small"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>

          <TextField
            select
            label="Category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 150 }}
            size="small"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="plumbing">Plumbing</MenuItem>
            <MenuItem value="electrical">Electrical</MenuItem>
            <MenuItem value="hvac">HVAC</MenuItem>
            <MenuItem value="general">General</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No maintenance requests found
          </Typography>
        </Paper>
      ) : (
        <>
          <Box display="flex" flexDirection="column" gap={2} mb={3}>
            {requests.map((request: MaintenanceRequest) => (
              <Card key={request.id}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="h6">{request.title}</Typography>
                        <Chip
                          label={request.status.replace('_', ' ')}
                          color={statusColors[request.status] as any}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                        <Chip
                          label={request.priority}
                          color={priorityColors[request.priority] as any}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {request.description}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Tracking: #{request.trackingNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Category: {request.category}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Created: {new Date(request.createdAt).toLocaleDateString()}
                      </Typography>
                      {request.photos && request.photos.length > 0 && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          📷 {request.photos.length} photo(s)
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>

                <CardActions>
                  <IconButton size="small" onClick={() => handleView(request)} title="View">
                    <ViewIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleEdit(request)} title="Edit">
                    <EditIcon />
                  </IconButton>
                </CardActions>
              </Card>
            ))}
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center">
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Form Dialog */}
      <MaintenanceFormDialog open={formOpen} onClose={handleCloseForm} request={selectedRequest} />

      {/* Detail Dialog */}
      <MaintenanceDetailDialog
        open={detailOpen}
        onClose={handleCloseDetail}
        request={selectedRequest}
      />
    </Box>
  );
}
