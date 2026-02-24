import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  Divider,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { apiClient } from '@horizon-hcm/shared/src/api/client';
import { useAppStore } from '../store/app.store';

interface SearchResult {
  id: string;
  type: 'resident' | 'apartment' | 'announcement' | 'document';
  title: string;
  subtitle?: string;
  url: string;
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export const GlobalSearch = ({ open, onClose }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['globalSearch', selectedBuildingId, debouncedSearchTerm],
    queryFn: async () => {
      const response = await apiClient.get<{ results: SearchResult[] }>(
        `/buildings/${selectedBuildingId}/search`,
        { params: { q: debouncedSearchTerm } }
      );
      return response.data;
    },
    enabled: !!selectedBuildingId && debouncedSearchTerm.length >= 2,
  });

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    onClose();
    setSearchTerm('');
  };

  const handleClose = () => {
    onClose();
    setSearchTerm('');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'resident':
        return 'primary';
      case 'apartment':
        return 'secondary';
      case 'announcement':
        return 'info';
      case 'document':
        return 'success';
      default:
        return 'default';
    }
  };

  const groupedResults = data?.results.reduce(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    },
    {} as Record<string, SearchResult[]>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        <Box p={2}>
          <TextField
            fullWidth
            placeholder="Search residents, apartments, announcements, documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: isLoading ? (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ) : null,
            }}
          />
        </Box>

        {searchTerm.length > 0 && searchTerm.length < 2 && (
          <Box p={2} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Type at least 2 characters to search
            </Typography>
          </Box>
        )}

        {debouncedSearchTerm.length >= 2 && !isLoading && data?.results.length === 0 && (
          <Box p={2} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              No results found for &quot;{debouncedSearchTerm}&quot;
            </Typography>
          </Box>
        )}

        {groupedResults && Object.keys(groupedResults).length > 0 && (
          <List sx={{ maxHeight: '60vh', overflow: 'auto' }}>
            {Object.entries(groupedResults).map(([type, results], index) => (
              <Box key={type}>
                {index > 0 && <Divider />}
                <Box px={2} py={1} bgcolor="action.hover">
                  <Typography variant="subtitle2" textTransform="capitalize">
                    {type}s ({results.length})
                  </Typography>
                </Box>
                {results.map((result) => (
                  <ListItem key={result.id} disablePadding>
                    <ListItemButton onClick={() => handleResultClick(result)}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <span
                              dangerouslySetInnerHTML={{
                                __html: result.title.replace(
                                  new RegExp(`(${debouncedSearchTerm})`, 'gi'),
                                  '<mark>$1</mark>'
                                ),
                              }}
                            />
                            <Chip
                              label={result.type}
                              size="small"
                              color={
                                getTypeColor(result.type) as
                                  | 'default'
                                  | 'primary'
                                  | 'secondary'
                                  | 'error'
                                  | 'info'
                                  | 'success'
                                  | 'warning'
                              }
                            />
                          </Box>
                        }
                        secondary={result.subtitle}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </Box>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};
