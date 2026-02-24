import { create } from 'zustand';
import type { NotificationStore } from './types';

export const useNotificationStore = create<NotificationStore>((set) => ({
  // State
  unreadCount: 0,

  // Actions
  setUnreadCount: (count) => set({ unreadCount: count }),

  incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),

  decrementUnreadCount: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  resetUnreadCount: () => set({ unreadCount: 0 }),
}));
