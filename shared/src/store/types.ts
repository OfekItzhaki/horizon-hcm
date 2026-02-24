import type { User } from '../types';

// Auth Store Interface
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface AuthActions {
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export type AuthStore = AuthState & AuthActions;

// App Store Interface
export interface AppState {
  selectedBuildingId: string | null;
  language: 'en' | 'he';
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
}

export interface AppActions {
  setSelectedBuilding: (buildingId: string) => void;
  setSelectedBuildingId: (buildingId: string) => void;
  setLanguage: (language: 'en' | 'he') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export type AppStore = AppState & AppActions;

// Notification Store Interface
export interface NotificationState {
  unreadCount: number;
}

export interface NotificationActions {
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;
}

export type NotificationStore = NotificationState & NotificationActions;
