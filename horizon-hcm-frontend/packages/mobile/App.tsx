import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { lightTheme, darkTheme } from './src/theme';
import RootNavigator from './src/navigation/RootNavigator';
import { configureAPIClient } from '@horizon-hcm/shared/src/api/client';
import { useAuthStore, useAppStore } from '@horizon-hcm/shared';
import { websocketService } from './src/utils/websocket';

// Configure API client with backend URL and token management
configureAPIClient({
  baseURL: 'http://localhost:3001/api',
  getTokens: () => {
    const state = useAuthStore.getState();
    if (!state.accessToken || !state.refreshToken) return null;
    return {
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      expiresIn: 3600, // Default 1 hour
    };
  },
  saveTokens: (tokens) => {
    useAuthStore.getState().setTokens(tokens.accessToken, tokens.refreshToken);
  },
  clearTokens: () => {
    useAuthStore.getState().logout();
    websocketService.disconnect();
  },
  onUnauthorized: () => {
    useAuthStore.getState().logout();
    websocketService.disconnect();
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
  const theme = useAppStore((state) => state.theme);
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  const user = useAuthStore((state) => state.user);
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);
  const appState = useRef(AppState.currentState);

  // Connect WebSocket when user logs in
  useEffect(() => {
    if (user) {
      websocketService.connect();
    } else {
      websocketService.disconnect();
    }

    return () => {
      websocketService.disconnect();
    };
  }, [user]);

  // Join building room when building is selected
  useEffect(() => {
    if (selectedBuildingId && websocketService.isConnected()) {
      websocketService.joinBuilding(selectedBuildingId);
    }

    return () => {
      if (selectedBuildingId) {
        websocketService.leaveBuilding(selectedBuildingId);
      }
    };
  }, [selectedBuildingId]);

  // Handle app lifecycle (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // App is coming to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground');
        
        // Reconnect WebSocket if user is logged in
        if (user && !websocketService.isConnected()) {
          websocketService.connect();
          
          // Rejoin building room if building is selected
          if (selectedBuildingId) {
            websocketService.joinBuilding(selectedBuildingId);
          }
        }
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries();
      }
      
      // App is going to background
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        console.log('App has gone to the background');
        // Keep WebSocket connected for push notifications
        // But you could disconnect here if you want to save battery
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user, selectedBuildingId]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={currentTheme}>
          <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
          <RootNavigator />
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
