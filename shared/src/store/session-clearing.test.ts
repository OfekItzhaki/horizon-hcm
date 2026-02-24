import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth.store';
import type { User } from '../types';

// Property 4: Session Data Clearing
describe('Session Data Clearing on Logout', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().logout();
  });

  it('should clear all authentication data on logout', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'owner',
      buildingId: 'b1',
      apartmentId: 'a1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Login
    useAuthStore.getState().login(user, 'access-token', 'refresh-token');

    // Verify logged in
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).not.toBeNull();
    expect(useAuthStore.getState().accessToken).not.toBeNull();

    // Logout
    useAuthStore.getState().logout();

    // Verify all data cleared
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should clear user data completely', () => {
    const user: User = {
      id: '123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'committee_member',
      buildingId: 'building-1',
      apartmentId: 'apt-1',
      phone: '+1234567890',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useAuthStore.getState().login(user, 'token1', 'token2');
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.user?.email).toBeUndefined();
    expect(state.user?.firstName).toBeUndefined();
    expect(state.user?.role).toBeUndefined();
  });

  it('should clear tokens completely', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'owner',
      buildingId: 'b1',
      apartmentId: 'a1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useAuthStore
      .getState()
      .login(user, 'very-long-access-token-12345', 'very-long-refresh-token-67890');
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it('should reset authentication state to false', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'owner',
      buildingId: 'b1',
      apartmentId: 'a1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useAuthStore.getState().login(user, 'token1', 'token2');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('should handle multiple logout calls safely', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'owner',
      buildingId: 'b1',
      apartmentId: 'a1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useAuthStore.getState().login(user, 'token1', 'token2');

    // Call logout multiple times
    useAuthStore.getState().logout();
    useAuthStore.getState().logout();
    useAuthStore.getState().logout();

    // Should still be in clean state
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should prevent access to user data after logout', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      buildingId: 'b1',
      apartmentId: 'a1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useAuthStore.getState().login(user, 'token1', 'token2');
    useAuthStore.getState().logout();

    // Attempting to access user data should return null
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();

    // Attempting to update user should not work
    useAuthStore.getState().updateUser({ firstName: 'Hacker' });
    expect(useAuthStore.getState().user).toBeNull();
  });
});
