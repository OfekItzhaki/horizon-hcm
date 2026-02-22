import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppStore } from './types';

// Storage adapter that works for both web and mobile
const getStorage = () => {
  // Check if we're in a React Native environment
  if (typeof window === 'undefined' || !window.localStorage) {
    // Return a no-op storage for React Native (will be overridden by AsyncStorage)
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return window.localStorage;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // State
      selectedBuildingId: null,
      language: 'en',
      theme: 'light',
      sidebarOpen: true,

      // Actions
      setSelectedBuilding: (buildingId) => set({ selectedBuildingId: buildingId }),

      setLanguage: (language) => set({ language }),

      setTheme: (theme) => set({ theme }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => getStorage()),
    }
  )
);
