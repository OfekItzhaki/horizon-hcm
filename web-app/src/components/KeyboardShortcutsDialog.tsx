import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Chip,
} from '@mui/material';
import { Keyboard as KeyboardIcon } from '@mui/icons-material';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
}

const shortcuts: { category: string; items: Shortcut[] }[] = [
  {
    category: 'Navigation',
    items: [
      { keys: ['Ctrl', 'K'], description: 'Open global search' },
      { keys: ['Ctrl', 'B'], description: 'Toggle sidebar' },
    ],
  },
  {
    category: 'Actions',
    items: [
      { keys: ['Ctrl', 'I'], description: 'Create invoice' },
      { keys: ['Ctrl', 'A'], description: 'Create announcement' },
      { keys: ['Ctrl', 'L'], description: 'Logout' },
    ],
  },
  {
    category: 'General',
    items: [
      { keys: ['Ctrl', '/'], description: 'Show this help' },
      { keys: ['Esc'], description: 'Close modals' },
      { keys: ['Tab'], description: 'Navigate form fields' },
      { keys: ['Enter'], description: 'Submit forms' },
    ],
  },
];

export const KeyboardShortcutsDialog = ({ open, onClose }: KeyboardShortcutsDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <KeyboardIcon />
          <Typography variant="h6">Keyboard Shortcuts</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={3}>
          {shortcuts.map((section, index) => (
            <Box key={section.category}>
              {index > 0 && <Divider sx={{ mb: 2 }} />}
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {section.category}
              </Typography>
              <Box display="flex" flexDirection="column" gap={1.5}>
                {section.items.map((shortcut, idx) => (
                  <Box key={idx} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">{shortcut.description}</Typography>
                    <Box display="flex" gap={0.5}>
                      {shortcut.keys.map((key, keyIdx) => (
                        <Chip
                          key={keyIdx}
                          label={key}
                          size="small"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            height: '24px',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
