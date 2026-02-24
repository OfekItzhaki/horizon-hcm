import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import { useSessionTimeout } from '../hooks/useSessionTimeout';

export function SessionTimeoutDialog() {
  const { showWarning, timeRemaining, extendSession } = useSessionTimeout();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={showWarning} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning color="warning" />
        Session Timeout Warning
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Your session is about to expire due to inactivity. You will be logged out in:
        </DialogContentText>
        <Typography
          variant="h3"
          align="center"
          color="warning.main"
          sx={{ my: 2, fontWeight: 'bold' }}
        >
          {formatTime(timeRemaining)}
        </Typography>
        <DialogContentText>
          Click &quot;Stay Logged In&quot; to extend your session.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={extendSession} variant="contained" color="primary" autoFocus>
          Stay Logged In
        </Button>
      </DialogActions>
    </Dialog>
  );
}
