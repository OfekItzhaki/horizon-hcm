import { useState, useEffect } from 'react';

export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOffline, isOnline: !isOffline };
}

/**
 * Queue for offline actions
 */
interface QueuedAction {
  id: string;
  action: () => Promise<void>;
  timestamp: number;
}

class OfflineQueue {
  private queue: QueuedAction[] = [];
  private processing = false;

  add(action: () => Promise<void>): string {
    const id = Date.now().toString() + Math.random().toString(36);
    this.queue.push({
      id,
      action,
      timestamp: Date.now(),
    });
    this.saveToStorage();
    return id;
  }

  async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];
      try {
        await item.action();
        this.queue.shift();
        this.saveToStorage();
      } catch (error) {
        console.error('Failed to process queued action:', error);
        // Keep item in queue for retry
        break;
      }
    }

    this.processing = false;
  }

  clear(): void {
    this.queue = [];
    this.saveToStorage();
  }

  getSize(): number {
    return this.queue.length;
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        'offline-queue',
        JSON.stringify(
          this.queue.map((item) => ({
            id: item.id,
            timestamp: item.timestamp,
          }))
        )
      );
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }
}

export const offlineQueue = new OfflineQueue();

export function useOfflineQueue() {
  const { isOnline } = useOffline();
  const [queueSize, setQueueSize] = useState(offlineQueue.getSize());

  useEffect(() => {
    if (isOnline) {
      offlineQueue.processQueue().then(() => {
        setQueueSize(offlineQueue.getSize());
      });
    }
  }, [isOnline]);

  const addToQueue = (action: () => Promise<void>) => {
    const id = offlineQueue.add(action);
    setQueueSize(offlineQueue.getSize());
    return id;
  };

  return {
    addToQueue,
    queueSize,
    isProcessing: isOnline && queueSize > 0,
  };
}
