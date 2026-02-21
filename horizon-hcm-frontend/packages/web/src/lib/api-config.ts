import { configureTokenStorage } from '@horizon-hcm/shared';
import { useAuthStore } from '../store';

// Configure token storage for the API client
export const initializeApiClient = () => {
  configureTokenStorage({
    getTokens: () => {
      const state = useAuthStore.getState();
      if (state.token && state.refreshToken) {
        return {
          accessToken: state.token,
          refreshToken: state.refreshToken,
          expiresIn: 3600, // Default 1 hour
        };
      }
      return null;
    },
    saveTokens: (tokens) => {
      useAuthStore.getState().setTokens(tokens.accessToken, tokens.refreshToken);
    },
    clearTokens: () => {
      useAuthStore.getState().logout();
    },
    onUnauthorized: () => {
      // Redirect to login will be handled by the store clearing
      window.location.href = '/login';
    },
  });
};
