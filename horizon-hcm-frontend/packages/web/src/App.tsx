import { useEffect } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { lightTheme, darkTheme } from './theme';
import { queryClient } from './lib/query-client';
import { initializeApiClient } from './lib/api-config';
import { router } from './routes';
import { useAppStore } from './store';
import { useWebSocket } from './hooks/useWebSocket';
import { I18nProvider, useTranslation } from './i18n/i18nContext';

function AppContent() {
  const theme = useAppStore((state) => state.theme);
  const selectedTheme = theme === 'dark' ? darkTheme : lightTheme;
  const { dir } = useTranslation();

  // Initialize API client configuration on mount
  useEffect(() => {
    initializeApiClient();
  }, []);

  // Set HTML dir attribute for RTL support
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = dir === 'rtl' ? 'he' : 'en';
  }, [dir]);

  // Initialize WebSocket connection
  useWebSocket();

  return (
    <ThemeProvider theme={selectedTheme}>
      <CssBaseline />
      {/* @ts-expect-error - React Router types mismatch with React 18 */}
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
