import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth.store';
import type { User } from '../types';

// Property 1: Token Storage and Retrieval
describe('Auth Store - Token Storage', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().logout();
  });

  it('should store access and refresh tokens on login', () => {
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

    useAuthStore.getState().login(user, 'access-token-123', 'refresh-token-456');

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('access-token-123');
    expect(state.refreshToken).toBe('refresh-token-456');
    expect(state.isAuthenticated).toBe(true);
  });

  it('should retrieve stored user data', () => {
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

    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.user?.email).toBe('test@example.com');
  });

  it('should update tokens without affecting user data', () => {
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

    useAuthStore.getState().login(user, 'old-access', 'old-refresh');
    useAuthStore.getState().setTokens('new-access', 'new-refresh');

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new-access');
    expect(state.refreshToken).toBe('new-refresh');
    expect(state.user).toEqual(user);
  });
});

// Property 2: Session Clearing on Logout
describe('Auth Store - Session Clearing', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('should clear all auth data on logout', () => {
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

    useAuthStore.getState().login(user, 'access-token', 'refresh-token');
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should handle logout when not authenticated', () => {
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should clear tokens but preserve logout state', () => {
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
    useAuthStore.getState().logout();

    // Try to access after logout
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
  });
});

// Property 3: User Data Update
describe('Auth Store - User Data Update', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('should update user data while preserving tokens', () => {
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

    useAuthStore.getState().login(user, 'access-token', 'refresh-token');
    useAuthStore.getState().updateUser({ firstName: 'Updated', lastName: 'Name' });

    const state = useAuthStore.getState();
    expect(state.user?.firstName).toBe('Updated');
    expect(state.user?.lastName).toBe('Name');
    expect(state.user?.email).toBe('test@example.com');
    expect(state.accessToken).toBe('access-token');
    expect(state.refreshToken).toBe('refresh-token');
  });

  it('should handle partial user updates', () => {
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
    useAuthStore.getState().updateUser({ email: 'newemail@example.com' });

    const state = useAuthStore.getState();
    expect(state.user?.email).toBe('newemail@example.com');
    expect(state.user?.firstName).toBe('Test');
    expect(state.user?.lastName).toBe('User');
  });

  it('should not update user when not authenticated', () => {
    useAuthStore.getState().updateUser({ firstName: 'Should', lastName: 'Fail' });

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
  });
});

// Property 4: Authentication State Consistency
describe('Auth Store - Authentication State', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('should set isAuthenticated to true on login', () => {
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
  });

  it('should set isAuthenticated to false on logout', () => {
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
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('should maintain authentication state across token updates', () => {
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

    useAuthStore.getState().login(user, 'old-token', 'old-refresh');
    useAuthStore.getState().setTokens('new-token', 'new-refresh');

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
