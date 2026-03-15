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
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buildingsApi } from '@horizon-hcm/shared';

interface BuildingForm {
  name: string;
  addressLine: string;
  city: string;
  postalCode: string;
  numUnits: number | '';
}

const emptyForm: BuildingForm = {
  name: '',
  addressLine: '',
  city: '',
  postalCode: '',
  numUnits: '',
};

export default function AdminBuildingsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BuildingForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-buildings', search],
    queryFn: async () => {
      const res = await buildingsApi.getAll();
      const payload = res.data as any;
      return Array.isArray(payload) ? payload : (payload?.data ?? []);
    },
    staleTime: 30_000,
  });

  const buildings = (Array.isArray(data) ? data : []).filter(
    (b: any) =>
      !search ||
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.address_line?.toLowerCase().includes(search.toLowerCase()) ||
      b.city?.toLowerCase().includes(search.toLowerCase()),
  );

  const createMutation = useMutation({
    mutationFn: (payload: any) => buildingsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-buildings'] });
      setFormOpen(false);
      setForm(emptyForm);
      setSnackbar({ open: true, message: 'Building created', severity: 'success' });
    },
    onError: () => setSnackbar({ open: true, message: 'Failed to create building', severity: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => buildingsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-buildings'] });
      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setSnackbar({ open: true, message: 'Building updated', severity: 'success' });
    },
    onError: () => setSnackbar({ open: true, message: 'Failed to update building', severity: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => buildingsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-buildings'] });
      setDeleteTarget(null);
      setSnackbar({ open: true, message: 'Building deleted', severity: 'success' });
    },
    onError: () => setSnackbar({ open: true, message: 'Failed to delete building', severity: 'error' }),
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const handleOpenEdit = (building: any) => {
    setEditingId(building.id);
    setForm({
      name: building.name || '',
      addressLine: building.address_line || '',
      city: building.city || '',
      postalCode: building.postal_code || '',
      numUnits: building.num_units || '',
    });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: form.name || undefined,
      addressLine: form.addressLine,
      city: form.city || undefined,
      postalCode: form.postalCode || undefined,
      numUnits: form.numUnits !== '' ? Number(form.numUnits) : undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const paginated = buildings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Building Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Add Building
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by name, address, or city..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {isLoading && <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load buildings</Alert>}

      {!isLoading && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Units</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((b: any) => (
                <TableRow key={b.id} hover>
                  <TableCell>{b.name || '—'}</TableCell>
                  <TableCell>{b.address_line}</TableCell>
                  <TableCell>{b.city || '—'}</TableCell>
                  <TableCell>{b.num_units ?? '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={b.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={b.is_active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenEdit(b)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteTarget({ id: b.id, name: b.name || b.address_line })}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No buildings found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={buildings.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          />
        </TableContainer>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Building' : 'Add Building'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
          />
          <TextField
            label="Address *"
            value={form.addressLine}
            onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            fullWidth
          />
          <TextField
            label="Postal Code"
            value={form.postalCode}
            onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            fullWidth
          />
          <TextField
            label="Number of Units"
            type="number"
            value={form.numUnits}
            onChange={(e) => setForm({ ...form, numUnits: e.target.value === '' ? '' : Number(e.target.value) })}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!form.addressLine || createMutation.isPending || updateMutation.isPending}
          >
            {editingId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Building</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
