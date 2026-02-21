import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppStore } from './types';

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
    }
  )
);
