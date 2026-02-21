import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { lightTheme, darkTheme } from './theme';
import { queryClient } from './lib/query-client';
import { router } from './routes';
import { useAppStore } from './store';

function App() {
  const theme = useAppStore((state) => state.theme);
  const selectedTheme = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={selectedTheme}>
        <CssBaseline />
        {/* @ts-expect-error - React Router types mismatch with React 18 */}
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
