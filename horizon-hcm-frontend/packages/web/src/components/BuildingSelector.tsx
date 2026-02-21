import { useState, useMemo } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { useAppStore } from '../store';
import { useBuildings } from '../hooks/useBuildings';
import { useQueryClient } from '@tanstack/react-query';

export function BuildingSelector() {
  const queryClient = useQueryClient();
  const { selectedBuildingId, setSelectedBuilding } = useAppStore();
  const { data: buildings, isLoading } = useBuildings();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter buildings based on search query
  const filteredBuildings = useMemo(() => {
    if (!buildings) return [];
    if (!searchQuery) return buildings;

    const query = searchQuery.toLowerCase();
    return buildings.filter(
      (building) =>
        building.name.toLowerCase().includes(query) ||
        building.address.city.toLowerCase().includes(query) ||
        building.address.street.toLowerCase().includes(query)
    );
  }, [buildings, searchQuery]);

  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuilding(buildingId);

    // Invalidate queries that depend on building selection
    queryClient.invalidateQueries({ queryKey: ['apartments'] });
    queryClient.invalidateQueries({ queryKey: ['residents'] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: ['announcements'] });
    queryClient.invalidateQueries({ queryKey: ['maintenance'] });
  };

  // Show loading state
  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={20} />
        <Typography variant="body2">Loading buildings...</Typography>
      </Box>
    );
  }

  // Show message if no buildings
  if (!buildings || buildings.length === 0) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <ApartmentIcon fontSize="small" color="disabled" />
        <Typography variant="body2" color="text.secondary">
          No buildings available
        </Typography>
      </Box>
    );
  }

  // Single building - just display it
  if (buildings.length === 1) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <ApartmentIcon fontSize="small" color="primary" />
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {buildings[0].name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {buildings[0].address.city}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Multiple buildings - show selector with search for many buildings
  const showSearch = buildings.length > 5;

  return (
    <FormControl size="small" sx={{ minWidth: 250 }}>
      <InputLabel id="building-selector-label">Building</InputLabel>
      <Select
        labelId="building-selector-label"
        value={selectedBuildingId || ''}
        label="Building"
        onChange={(e) => handleBuildingChange(e.target.value)}
        startAdornment={<ApartmentIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />}
      >
        {showSearch && (
          <Box sx={{ px: 2, py: 1 }}>
            <TextField
              size="small"
              placeholder="Search buildings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              fullWidth
            />
          </Box>
        )}

        {filteredBuildings.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No buildings found
            </Typography>
          </MenuItem>
        ) : (
          filteredBuildings.map((building) => (
            <MenuItem key={building.id} value={building.id}>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {building.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {building.address.street}, {building.address.city}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  );
}
