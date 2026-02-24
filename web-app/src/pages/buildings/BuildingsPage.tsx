import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  InputAdornment,
  Grid,
  Chip,
  IconButton,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { buildingsApi } from '@horizon-hcm/shared';
import { queryKeys } from '../../lib/query-keys';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import BuildingFormDialog from './BuildingFormDialog.tsx';
import type { Building } from '@horizon-hcm/shared';

export default function BuildingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  const { data: buildings = [], isLoading } = useQuery({
    queryKey: queryKeys.buildings.all,
    queryFn: async () => {
      const response = await buildingsApi.getAll();
      return response.data;
    },
  });

  const filteredBuildings = buildings.filter((building) => {
    const query = searchQuery.toLowerCase();
    return (
      building.name.toLowerCase().includes(query) ||
      building.address.street.toLowerCase().includes(query) ||
      building.address.city.toLowerCase().includes(query)
    );
  });

  const handleCreate = () => {
    setSelectedBuilding(null);
    setIsFormOpen(true);
  };

  const handleEdit = (building: Building) => {
    setSelectedBuilding(building);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedBuilding(null);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Buildings
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Add Building
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search buildings by name, address, or city..."
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
        </CardContent>
      </Card>

      {isLoading ? (
        <Typography>Loading buildings...</Typography>
      ) : filteredBuildings.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              {searchQuery
                ? 'No buildings found matching your search.'
                : 'No buildings yet. Create your first building!'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredBuildings.map((building) => (
            <Grid item xs={12} sm={6} md={4} key={building.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h2">
                      {building.name}
                    </Typography>
                    <Box>
                      <IconButton size="small" onClick={() => handleEdit(building)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {building.address.street}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {building.address.city}, {building.address.state} {building.address.postalCode}
                  </Typography>

                  <Box display="flex" gap={1} mt={2}>
                    <Chip
                      icon={<ApartmentIcon />}
                      label={`${building.apartmentCount} Apartments`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<PeopleIcon />}
                      label={`${building.residentCount} Residents`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Contact: {building.contactEmail}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Phone: {building.contactPhone}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <BuildingFormDialog open={isFormOpen} building={selectedBuilding} onClose={handleCloseForm} />
    </Box>
  );
}
