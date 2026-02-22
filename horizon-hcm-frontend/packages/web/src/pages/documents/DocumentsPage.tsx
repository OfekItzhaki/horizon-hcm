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
  IconButton,
  Chip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@horizon-hcm/shared/src/api/documents';
import type { Document } from '@horizon-hcm/shared/src/types/financial';
import { queryKeys } from '../../lib/query-keys';
import { useAppStore } from '../../store/app.store';

export default function DocumentsPage() {
  const selectedBuildingId = useAppStore((state: any) => state.selectedBuildingId);
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.documents.list(selectedBuildingId || '', {
      category: categoryFilter === 'all' ? undefined : categoryFilter,
    }),
    queryFn: () =>
      documentsApi.getAll(selectedBuildingId || '', {
        category: categoryFilter === 'all' ? undefined : categoryFilter,
      }),
    enabled: !!selectedBuildingId,
    select: (response) => response.data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(selectedBuildingId || '', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
  });

  const handleDownload = async (doc: Document) => {
    try {
      const response = await documentsApi.download(selectedBuildingId!, doc.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!selectedBuildingId) {
    return (
      <Box p={3}>
        <Alert severity="info">Please select a building to view documents.</Alert>
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
        <Alert severity="error">Failed to load documents. Please try again.</Alert>
      </Box>
    );
  }

  const documents = data?.data || [];

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Documents</Typography>
        <Button variant="contained" startIcon={<UploadIcon />}>
          Upload Document
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            select
            label="Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            sx={{ minWidth: 200 }}
            size="small"
          >
            <MenuItem value="all">All Categories</MenuItem>
            <MenuItem value="financial">Financial</MenuItem>
            <MenuItem value="legal">Legal</MenuItem>
            <MenuItem value="maintenance">Maintenance</MenuItem>
            <MenuItem value="meeting">Meeting Minutes</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No documents found
          </Typography>
        </Paper>
      ) : (
        <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={2}>
          {documents.map((doc: Document) => (
            <Card key={doc.id}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <FileIcon color="primary" />
                  <Typography variant="h6" sx={{ fontSize: '1rem', wordBreak: 'break-word' }}>
                    {doc.fileName}
                  </Typography>
                </Box>

                <Box mb={1}>
                  <Chip label={doc.category} size="small" sx={{ textTransform: 'capitalize' }} />
                </Box>

                <Typography variant="caption" color="text.secondary" display="block">
                  Size: {formatFileSize(doc.fileSize)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  By: {doc.uploadedBy}
                </Typography>
              </CardContent>

              <CardActions>
                <IconButton size="small" onClick={() => handleDownload(doc)} title="Download">
                  <DownloadIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(doc.id)}
                  title="Delete"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
