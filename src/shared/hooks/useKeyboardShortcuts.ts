import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export const useKeyboardShortcuts = () => {
  const selectedCells = useStore(state => state.selectedCells);
  const copiedCells = useStore(state => state.copiedCells);
  const copySelection = useStore(state => state.copySelection);
  const pasteToSelection = useStore(state => state.pasteToSelection);
  const deleteSelection = useStore(state => state.deleteSelection);
  const refreshStats = useStore(state => state.refreshStats);
  const expandSelection = useStore(state => state.expandSelection);

  const undo = useStore(state => state.undo);
  const redo = useStore(state => state.redo);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const hasMultipleSelection = selectedCells.size > 1;
      const hasCopiedCells = copiedCells.length > 0;
      const clearCopiedCells = useStore.getState().clearCopiedCells;

      // Shift+Arrow: Expand selection (rectangle selection)
      if (
        e.shiftKey &&
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
      ) {
        // Blur input if focused, to allow rectangle selection
        if (isInputFocused) {
          (target as HTMLInputElement).blur();
        }

        e.preventDefault();

        const directionMap: {
          [key: string]: 'up' | 'down' | 'left' | 'right';
        } = {
          ArrowUp: 'up',
          ArrowDown: 'down',
          ArrowLeft: 'left',
          ArrowRight: 'right',
        };

        expandSelection(directionMap[e.key]);
        return;
      }

      // Undo: Ctrl+Z (global, termasuk saat input focus)
      if (isCmdOrCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Shift+Z (global, termasuk saat input focus)
      if (isCmdOrCtrl && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }

      // Copy: Ctrl+C / Cmd+C
      if (isCmdOrCtrl && e.key === 'c') {
        const selection = window.getSelection();
        const hasTextSelection = selection && selection.toString().length > 0;

        // If user has text selected on the page (not just in input), allow default copy
        if (hasTextSelection) {
          return;
        }

        // If multiple cells selected, copy them (even if input is focused)
        if (hasMultipleSelection) {
          e.preventDefault();
          copySelection();
          return;
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
          clearCopiedCells();
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
    copiedCells,
    copySelection,
    pasteToSelection,
    deleteSelection,
    refreshStats,
    undo,
    redo,
    expandSelection,
  ]);
};
