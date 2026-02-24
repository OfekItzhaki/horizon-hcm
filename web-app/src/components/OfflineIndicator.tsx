import { useState, useEffect } from 'react';
import { Alert, Slide } from '@mui/material';
import { WifiOff } from '@mui/icons-material';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Slide direction="down" in={!isOnline} mountOnEnter unmountOnExit>
      <Alert
        severity="warning"
        icon={<WifiOff />}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          borderRadius: 0,
        }}
      >
        You are currently offline. Some features may not be available.
      </Alert>
    </Slide>
  );
}
