import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FeatureFlags {
  enablePolls: boolean;
  enableMeetings: boolean;
  enableDocuments: boolean;
  enableMaintenance: boolean;
  enableReports: boolean;
  enableAnnouncements: boolean;
  enableMessages: boolean;
  enablePayments: boolean;
  enableBulkOperations: boolean;
  enableExport: boolean;
  enableNotifications: boolean;
  enable2FA: boolean;
}

interface FeatureFlagsStore {
  flags: FeatureFlags;
  setFlags: (flags: Partial<FeatureFlags>) => void;
  isFeatureEnabled: (feature: keyof FeatureFlags) => boolean;
  loadFlags: () => Promise<void>;
}

const defaultFlags: FeatureFlags = {
  enablePolls: true,
  enableMeetings: true,
  enableDocuments: true,
  enableMaintenance: true,
  enableReports: true,
  enableAnnouncements: true,
  enableMessages: true,
  enablePayments: true,
  enableBulkOperations: true,
  enableExport: true,
  enableNotifications: true,
  enable2FA: true,
};

export const useFeatureFlagsStore = create<FeatureFlagsStore>()(
  persist(
    (set, get) => ({
      flags: defaultFlags,
      setFlags: (newFlags) =>
        set((state) => ({
          flags: { ...state.flags, ...newFlags },
        })),
      isFeatureEnabled: (feature) => get().flags[feature],
      loadFlags: async () => {
        try {
          // In production, fetch from API
          // const response = await fetch('/api/feature-flags');
          // const flags = await response.json();
          // set({ flags });

          // For now, use defaults
          set({ flags: defaultFlags });
        } catch (error) {
          console.error('Failed to load feature flags:', error);
        }
      },
    }),
    {
      name: 'feature-flags',
    }
  )
);

export function useFeatureFlags() {
  const { flags, isFeatureEnabled, loadFlags } = useFeatureFlagsStore();

  return {
    flags,
    isFeatureEnabled,
    loadFlags,
  };
}

/**
 * Component wrapper for feature flags
 */
interface FeatureGateProps {
  feature: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const { isFeatureEnabled } = useFeatureFlags();

  if (!isFeatureEnabled(feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
