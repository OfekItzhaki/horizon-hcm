import { useEffect, useRef, useState, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { getMutationQueue, dequeueMutation } from '../utils/offlineStorage';

export interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  syncNow: () => Promise<void>;
}

export function useOfflineSync(): OfflineSyncState {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const wasOffline = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    const queue = await getMutationQueue();
    setPendingCount(queue.length);
  }, []);

  const syncNow = useCallback(async () => {
    const queue = await getMutationQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    for (const mutation of queue) {
      try {
        await fetch(mutation.url, {
          method: mutation.method,
          headers: { 'Content-Type': 'application/json' },
          body: mutation.body ? JSON.stringify(mutation.body) : undefined,
        });
        await dequeueMutation(mutation.id);
      } catch {
        // Leave in queue to retry next time
      }
    }
    setIsSyncing(false);
    await refreshPendingCount();
    // Invalidate all queries so UI refreshes with fresh server data
    queryClient.invalidateQueries();
  }, [queryClient, refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);

      // Coming back online — replay queued mutations
      if (online && wasOffline.current) {
        syncNow();
      }
      wasOffline.current = !online;
    });

    return () => unsubscribe();
  }, [syncNow, refreshPendingCount]);

  return { isOnline, isSyncing, pendingCount, syncNow };
}
