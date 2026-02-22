import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { lightTheme } from './src/theme';
import RootNavigator from './src/navigation/RootNavigator';
import { configureAPIClient } from '@horizon-hcm/shared/src/api/client';
import { useAuthStore } from '@horizon-hcm/shared';

// Configure API client with backend URL and token management
configureAPIClient({
  baseURL: 'http://localhost:3001/api',
  getTokens: () => {
    const state = useAuthStore.getState();
    return {
      accessToken: state.accessToken || '',
      refreshToken: state.refreshToken || '',
    };
  },
  saveTokens: (tokens) => {
    useAuthStore.getState().setTokens(tokens.accessToken, tokens.refreshToken);
  },
  clearTokens: () => {
    useAuthStore.getState().logout();
  },
  onUnauthorized: () => {
    useAuthStore.getState().logout();
  },
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={lightTheme}>
          <StatusBar style="auto" />
          <RootNavigator />
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
