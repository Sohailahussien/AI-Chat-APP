import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  onToggleSidebar: () => void;
  onToggleTheme?: () => void;
}

export function useKeyboardShortcuts({ onToggleSidebar, onToggleTheme }: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        onToggleSidebar();
      }
      
      // Ctrl/Cmd + T to toggle theme
      if ((event.ctrlKey || event.metaKey) && event.key === 't' && onToggleTheme) {
        event.preventDefault();
        onToggleTheme();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onToggleSidebar, onToggleTheme]);
} 