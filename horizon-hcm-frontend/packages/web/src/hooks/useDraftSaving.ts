import { useEffect, useRef, useState } from 'react';
import { useToast } from '../components/Toast';

const AUTOSAVE_INTERVAL = 30000; // 30 seconds

interface DraftOptions {
  key: string;
  data: any;
  enabled?: boolean;
}

export function useDraftSaving({ key, data, enabled = true }: DraftOptions) {
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const intervalRef = useRef<number>();
  const { showInfo } = useToast();

  // Load draft on mount
  useEffect(() => {
    if (!enabled) return;

    const savedDraft = localStorage.getItem(`draft-${key}`);
    if (savedDraft) {
      setHasDraft(true);
      const savedData = JSON.parse(savedDraft);
      setLastSaved(new Date(savedData.timestamp));
    }
  }, [key, enabled]);

  // Auto-save draft
  useEffect(() => {
    if (!enabled || !data) return;

    intervalRef.current = setInterval(() => {
      saveDraft();
    }, AUTOSAVE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [data, enabled]);

  const saveDraft = () => {
    if (!data) return;

    try {
      const draftData = {
        data,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(`draft-${key}`, JSON.stringify(draftData));
      setHasDraft(true);
      setLastSaved(new Date());
      showInfo('Draft saved');
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const loadDraft = (): any | null => {
    try {
      const savedDraft = localStorage.getItem(`draft-${key}`);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        return parsed.data;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  };

  const clearDraft = () => {
    localStorage.removeItem(`draft-${key}`);
    setHasDraft(false);
    setLastSaved(null);
  };

  return {
    hasDraft,
    lastSaved,
    saveDraft,
    loadDraft,
    clearDraft,
  };
}

/**
 * Hook to warn before leaving page with unsaved changes
 */
export function useUnsavedChangesWarning(hasUnsavedChanges: boolean) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);
}
