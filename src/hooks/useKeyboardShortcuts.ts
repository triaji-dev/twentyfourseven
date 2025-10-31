import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export const useKeyboardShortcuts = () => {
  const selectedCells = useStore(state => state.selectedCells);
  const copiedCells = useStore(state => state.copiedCells);
  const copySelection = useStore(state => state.copySelection);
  const pasteToSelection = useStore(state => state.pasteToSelection);
  const deleteSelection = useStore(state => state.deleteSelection);
  const refreshStats = useStore(state => state.refreshStats);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT';
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const hasMultipleSelection = selectedCells.size > 1;
      const hasCopiedCells = copiedCells.length > 0;

      // Copy: Ctrl+C / Cmd+C
      if (isCmdOrCtrl && e.key === 'c') {
        // If multiple cells selected, copy them (even if input is focused)
        if (hasMultipleSelection) {
          e.preventDefault();
          copySelection();
          return;
        }

        // Don't prevent default if user is selecting text in input
        if (isInputFocused && window.getSelection()?.toString()) {
          return; // Allow normal copy in input fields
        }

        e.preventDefault();
        copySelection();
      }
      // Paste: Ctrl+V / Cmd+V
      else if (isCmdOrCtrl && e.key === 'v') {
        // If has copied cells and any cell selected (single or multiple), paste them
        if (hasCopiedCells && selectedCells.size > 0) {
          e.preventDefault();
          pasteToSelection();
          refreshStats();
          return;
        }

        // Don't prevent default if user is pasting in input
        if (isInputFocused) {
          return; // Allow normal paste in input fields
        }

        e.preventDefault();
        pasteToSelection();
        refreshStats();
      }
      // Delete: Delete / Backspace
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        // If multiple cells selected, delete them (even if input is focused)
        if (hasMultipleSelection) {
          e.preventDefault();
          deleteSelection();
          refreshStats();
          return;
        }

        // Only trigger delete selection if NO input is focused
        if (!isInputFocused) {
          e.preventDefault();
          deleteSelection();
          refreshStats();
        }
        // If input is focused, allow normal delete/backspace behavior
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedCells,
    copySelection,
    pasteToSelection,
    deleteSelection,
    refreshStats,
  ]);
};
