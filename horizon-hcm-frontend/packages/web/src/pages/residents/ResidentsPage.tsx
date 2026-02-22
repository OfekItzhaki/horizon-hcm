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
  Avatar,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { residentsApi } from '@horizon-hcm/shared';
import { queryKeys } from '../../lib/query-keys';
import { useAppStore } from '../../store';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import ResidentFormDialog from './ResidentFormDialog.tsx';
import type { Resident } from '@horizon-hcm/shared';

export default function ResidentsPage() {
  const selectedBuilding = useAppStore((state) => state.selectedBuildingId);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

  const { data: residents = [], isLoading } = useQuery({
    queryKey: queryKeys.residents.list(selectedBuilding || ''),
    queryFn: async () => {
      if (!selectedBuilding) return [];
      const response = await residentsApi.getByBuilding(selectedBuilding);
      return response.data;
    },
    enabled: !!selectedBuilding,
  });

  const filteredResidents = residents.filter((resident) => {
    const matchesSearch =
      resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || resident.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreate = () => {
    setSelectedResident(null);
    setIsFormOpen(true);
  };

  const handleEdit = (resident: Resident) => {
    setSelectedResident(resident);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedResident(null);
  };

  const getRoleColor = (role: string) => {
    return role === 'owner' ? 'primary' : 'secondary';
  };

  if (!selectedBuilding) {
    return (
      <Box>
        <Typography variant="h4" component="h1" mb={3}>
          Residents
        </Typography>
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              Please select a building to view residents.
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
          Residents
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Add Resident
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              placeholder="Search by name or email..."
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
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="owner">Owners</MenuItem>
              <MenuItem value="tenant">Tenants</MenuItem>
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {isLoading ? (
        <Typography>Loading residents...</Typography>
      ) : filteredResidents.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              {searchQuery || roleFilter !== 'all'
                ? 'No residents found matching your filters.'
                : 'No residents yet. Add your first resident!'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Resident</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Apartment</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Move-in Date</TableCell>
                <TableCell>Move-out Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredResidents.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar>{resident.name.charAt(0).toUpperCase()}</Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {resident.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {resident.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={resident.role === 'owner' ? 'Owner' : 'Tenant'}
                      color={getRoleColor(resident.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">Apt {resident.apartmentId}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{resident.phone}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(resident.moveInDate), 'MMM dd, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {resident.moveOutDate
                        ? format(new Date(resident.moveOutDate), 'MMM dd, yyyy')
                        : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(resident)}>
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

      <ResidentFormDialog
        open={isFormOpen}
        resident={selectedResident}
        buildingId={selectedBuilding}
        onClose={handleCloseForm}
      />
    </Box>
  );
}
