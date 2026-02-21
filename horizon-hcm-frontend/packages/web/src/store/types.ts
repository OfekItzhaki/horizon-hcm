import type { User } from '@horizon-hcm/shared';

// Auth Store Interface
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface AuthActions {
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setTokens: (token: string, refreshToken: string) => void;
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

// WebSocket Store Interface
export interface WebSocketState {
  connected: boolean;
  socket: any | null;
}

export interface WebSocketActions {
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
}

export type WebSocketStore = WebSocketState & WebSocketActions;
