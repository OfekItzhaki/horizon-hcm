import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[], enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlOrMeta = shortcut.ctrlKey || shortcut.metaKey;
        const matchesCtrl = ctrlOrMeta ? event.ctrlKey || event.metaKey : true;
        const matchesShift = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (matchesCtrl && matchesShift && matchesKey) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
};

// Global keyboard shortcuts hook
export const useGlobalKeyboardShortcuts = (
  onSearch: () => void,
  onToggleSidebar: () => void,
  onCreateInvoice: () => void,
  onCreateAnnouncement: () => void,
  onLogout: () => void,
  onHelp: () => void
) => {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrlKey: true,
      action: onSearch,
      description: 'Open global search',
    },
    {
      key: 'b',
      ctrlKey: true,
      action: onToggleSidebar,
      description: 'Toggle navigation sidebar',
    },
    {
      key: 'i',
      ctrlKey: true,
      action: onCreateInvoice,
      description: 'Create new invoice',
    },
    {
      key: 'a',
      ctrlKey: true,
      action: onCreateAnnouncement,
      description: 'Create new announcement',
    },
    {
      key: 'l',
      ctrlKey: true,
      action: onLogout,
      description: 'Logout',
    },
    {
      key: '/',
      ctrlKey: true,
      action: onHelp,
      description: 'Show keyboard shortcuts help',
    },
    {
      key: 'Escape',
      action: () => {
        // Close any open modals/dialogs
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(event);
      },
      description: 'Close modals',
    },
  ];

  useKeyboardShortcuts(shortcuts);
};

// Hook for form navigation shortcuts
export const useFormKeyboardShortcuts = (onSubmit?: () => void) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab for form navigation (browser default)
      // Enter to submit forms
      if (event.key === 'Enter' && onSubmit) {
        const target = event.target as HTMLElement;
        // Only submit if not in a textarea
        if (target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          onSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSubmit]);
};
