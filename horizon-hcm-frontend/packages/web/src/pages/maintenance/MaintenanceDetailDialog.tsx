import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import type { MaintenanceRequest } from '@horizon-hcm/shared/src/types/maintenance';

interface MaintenanceDetailDialogProps {
  open: boolean;
  onClose: () => void;
  request: MaintenanceRequest | null;
}

export default function MaintenanceDetailDialog({
  open,
  onClose,
  request,
}: MaintenanceDetailDialogProps) {
  if (!request) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" component="span" flex={1}>
            {request.title}
          </Typography>
          <Chip label={request.status} size="small" sx={{ textTransform: 'capitalize' }} />
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Tracking Number: #{request.trackingNumber}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Category: {request.category}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Priority: {request.priority}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Created: {new Date(request.createdAt).toLocaleString()}
            </Typography>
          </Box>

          <Divider />

          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {request.description}
          </Typography>

          {request.photos && request.photos.length > 0 && (
            <Box>
              <Typography variant="subtitle2" mb={1}>
                Photos ({request.photos.length}):
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {request.photos.map((photo, index) => (
                  <Box
                    key={index}
                    component="img"
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1 }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
