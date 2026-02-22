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
import { apartmentsApi } from '@horizon-hcm/shared';
import { queryKeys } from '../../lib/query-keys';
import { useAppStore } from '../../store';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import ApartmentFormDialog from './ApartmentFormDialog.tsx';
import type { Apartment } from '@horizon-hcm/shared';

export default function ApartmentsPage() {
  const selectedBuilding = useAppStore((state) => state.selectedBuildingId);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);

  const { data: apartments = [], isLoading } = useQuery({
    queryKey: queryKeys.apartments.list(selectedBuilding || ''),
    queryFn: async () => {
      if (!selectedBuilding) return [];
      const response = await apartmentsApi.getByBuilding(selectedBuilding);
      return response.data;
    },
    enabled: !!selectedBuilding,
  });

  const filteredApartments = apartments.filter((apartment) => {
    const matchesSearch = apartment.unitNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || apartment.occupancyStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    setSelectedApartment(null);
    setIsFormOpen(true);
  };

  const handleEdit = (apartment: Apartment) => {
    setSelectedApartment(apartment);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedApartment(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vacant':
        return 'default';
      case 'owner_occupied':
        return 'success';
      case 'tenant_occupied':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'vacant':
        return 'Vacant';
      case 'owner_occupied':
        return 'Owner Occupied';
      case 'tenant_occupied':
        return 'Tenant Occupied';
      default:
        return status;
    }
  };

  if (!selectedBuilding) {
    return (
      <Box>
        <Typography variant="h4" component="h1" mb={3}>
          Apartments
        </Typography>
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              Please select a building to view apartments.
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
          Apartments
        </Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<UploadIcon />}>
            Import CSV
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            Add Apartment
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              placeholder="Search by unit number..."
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
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="vacant">Vacant</MenuItem>
              <MenuItem value="owner_occupied">Owner Occupied</MenuItem>
              <MenuItem value="tenant_occupied">Tenant Occupied</MenuItem>
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {isLoading ? (
        <Typography>Loading apartments...</Typography>
      ) : filteredApartments.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              {searchQuery || statusFilter !== 'all'
                ? 'No apartments found matching your filters.'
                : 'No apartments yet. Create your first apartment!'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Unit Number</TableCell>
                <TableCell>Floor</TableCell>
                <TableCell>Size (m²)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Tenants</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredApartments.map((apartment) => (
                <TableRow key={apartment.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {apartment.unitNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{apartment.floor}</TableCell>
                  <TableCell>{apartment.size}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(apartment.occupancyStatus)}
                      color={getStatusColor(apartment.occupancyStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{apartment.owner ? apartment.owner.name : '-'}</TableCell>
                  <TableCell>
                    {apartment.tenants.length > 0
                      ? apartment.tenants.map((t) => t.name).join(', ')
                      : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(apartment)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ApartmentFormDialog
        open={isFormOpen}
        apartment={selectedApartment}
        buildingId={selectedBuilding}
        onClose={handleCloseForm}
      />
    </Box>
  );
}
