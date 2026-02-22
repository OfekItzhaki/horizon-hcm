import { Box, Paper, Typography, Button, IconButton, Chip, LinearProgress } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  actions: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
    disabled?: boolean;
  }>;
  isProcessing?: boolean;
  progress?: number;
}

export const BulkActionsBar = ({
  selectedCount,
  onClear,
  actions,
  isProcessing = false,
  progress,
}: BulkActionsBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        minWidth: 400,
        maxWidth: 600,
      }}
    >
      {isProcessing && progress !== undefined && (
        <LinearProgress variant="determinate" value={progress} />
      )}
      <Box p={2} display="flex" alignItems="center" gap={2}>
        <Chip
          label={`${selectedCount} selected`}
          color="primary"
          size="small"
          onDelete={onClear}
          deleteIcon={<CloseIcon />}
        />
        <Box display="flex" gap={1} flexGrow={1}>
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="contained"
              color={action.color || 'primary'}
              size="small"
              startIcon={action.icon}
              onClick={action.onClick}
              disabled={action.disabled || isProcessing}
            >
              {action.label}
            </Button>
          ))}
        </Box>
        <IconButton size="small" onClick={onClear} disabled={isProcessing}>
          <CloseIcon />
        </IconButton>
      </Box>
      {isProcessing && (
        <Box px={2} pb={2}>
          <Typography variant="caption" color="text.secondary">
            Processing... {progress !== undefined && `${Math.round(progress)}%`}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};
