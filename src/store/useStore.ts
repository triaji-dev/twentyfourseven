import { create } from 'zustand';
import { getDaysInMonth, loadActivity, saveActivity } from '../utils/storage';
import type { MonthStats, ActivityKey } from '../types';

interface CopiedCell {
  day: number;
  hour: number;
  value: ActivityKey;
}

interface AppState {
  // Current date state
  currentDate: Date;

  // Cell selection state
  selectedCells: Set<string>;
  isSelecting: boolean;
  selectionStart: {
    year: number;
    month: number;
    day: number;
    hour: number;
  } | null;

  // Clipboard state
  copiedCells: CopiedCell[];
  copiedCellIds: Set<string>;

  // Data update trigger
  dataVersion: number;

  // Stats cache
  statsCache: MonthStats | null;

  // Actions
  setCurrentDate: (date: Date) => void;
  nextMonth: () => void;
  prevMonth: () => void;

  // Selection actions
  setSelectedCells: (cells: Set<string>) => void;
  setIsSelecting: (selecting: boolean) => void;
  setSelectionStart: (
    start: { year: number; month: number; day: number; hour: number } | null
  ) => void;
  toggleCellSelection: (cellId: string) => void;
  clearSelection: () => void;
  selectRectangle: (
    start: { year: number; month: number; day: number; hour: number },
    end: { year: number; month: number; day: number; hour: number }
  ) => void;

  // Clipboard actions
  copySelection: () => void;
  pasteToSelection: () => void;
  deleteSelection: () => void;

  // Stats actions
  calculateStats: (year: number, month: number) => MonthStats;
  refreshStats: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  currentDate: new Date(),
  selectedCells: new Set(),
  isSelecting: false,
  selectionStart: null,
  copiedCells: [],
  copiedCellIds: new Set(),
  dataVersion: 0,
  statsCache: null,

  // Date actions
  setCurrentDate: (date: Date) => set({ currentDate: date }),

  nextMonth: () =>
    set(state => {
      const newDate = new Date(state.currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return { currentDate: newDate, statsCache: null };
    }),

  prevMonth: () =>
    set(state => {
      const newDate = new Date(state.currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return { currentDate: newDate, statsCache: null };
    }),

  // Selection actions
  setSelectedCells: (cells: Set<string>) => set({ selectedCells: cells }),

  setIsSelecting: (selecting: boolean) => set({ isSelecting: selecting }),

  setSelectionStart: start => set({ selectionStart: start }),

  toggleCellSelection: (cellId: string) =>
    set(state => {
      const newSet = new Set(state.selectedCells);
      if (newSet.has(cellId)) {
        newSet.delete(cellId);
      } else {
        newSet.add(cellId);
      }
      return { selectedCells: newSet };
    }),

  clearSelection: () => set({ selectedCells: new Set() }),

  selectRectangle: (start, end) => {
    const { currentDate } = get();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const minDay = Math.min(start.day, end.day);
    const maxDay = Math.max(start.day, end.day);
    const minHour = Math.min(start.hour, end.hour);
    const maxHour = Math.max(start.hour, end.hour);

    const newSelection = new Set<string>();
    for (let d = minDay; d <= maxDay; d++) {
      for (let h = minHour; h <= maxHour; h++) {
        newSelection.add(`cell-${year}-${month + 1}-${d}-${h}`);
      }
    }
    set({ selectedCells: newSelection });
  },

  // Clipboard actions
  copySelection: () => {
    const { selectedCells, currentDate } = get();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (selectedCells.size === 0) return;

    const copiedData: CopiedCell[] = [];

    selectedCells.forEach(cellId => {
      // Parse cellId: "cell-YYYY-M-D-H"
      const parts = cellId.split('-');
      const day = parseInt(parts[3]);
      const hour = parseInt(parts[4]);
      const value = loadActivity(year, month, day, hour);

      copiedData.push({ day, hour, value });
    });

    set({
      copiedCells: copiedData,
      copiedCellIds: new Set(selectedCells),
    });
  },

  pasteToSelection: () => {
    const {
      selectedCells,
      copiedCells,
      currentDate,
      refreshStats,
      dataVersion,
    } = get();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (copiedCells.length === 0) return;

    // If no cells selected, paste to current focus or do nothing
    if (selectedCells.size === 0) return;

    const selectedArray = Array.from(selectedCells);

    // Case 1: Paste to single cell - paste all copied cells starting from that position
    if (selectedArray.length === 1) {
      const cellId = selectedArray[0];
      const parts = cellId.split('-');
      const startDay = parseInt(parts[3]);
      const startHour = parseInt(parts[4]);

      // Find relative positions of copied cells
      const minDay = Math.min(...copiedCells.map(c => c.day));
      const minHour = Math.min(...copiedCells.map(c => c.hour));

      copiedCells.forEach(cell => {
        const relativeDay = cell.day - minDay;
        const relativeHour = cell.hour - minHour;
        const targetDay = startDay + relativeDay;
        const targetHour = startHour + relativeHour;

        // Check bounds
        const daysInMonth = getDaysInMonth(year, month);
        if (
          targetDay >= 1 &&
          targetDay <= daysInMonth &&
          targetHour >= 0 &&
          targetHour < 24
        ) {
          saveActivity(year, month, targetDay, targetHour, cell.value);
        }
      });
    }
    // Case 2: Paste to multiple cells - paste copied values in pattern
    else {
      // Simple case: paste single copied value to all selected cells
      if (copiedCells.length === 1) {
        const value = copiedCells[0].value;
        selectedArray.forEach(cellId => {
          const parts = cellId.split('-');
          const day = parseInt(parts[3]);
          const hour = parseInt(parts[4]);
          saveActivity(year, month, day, hour, value);
        });
      }
      // Complex case: paste pattern matching
      else {
        const minDay = Math.min(...copiedCells.map(c => c.day));
        const minHour = Math.min(...copiedCells.map(c => c.hour));

        selectedArray.forEach(cellId => {
          const parts = cellId.split('-');
          const targetDay = parseInt(parts[3]);
          const targetHour = parseInt(parts[4]);

          // Find corresponding copied cell by matching relative position
          copiedCells.forEach(cell => {
            const relativeDay = cell.day - minDay;
            const relativeHour = cell.hour - minHour;

            // Simple pattern: use first cell as anchor
            const anchorParts = selectedArray[0].split('-');
            const anchorDay = parseInt(anchorParts[3]);
            const anchorHour = parseInt(anchorParts[4]);

            if (
              targetDay === anchorDay + relativeDay &&
              targetHour === anchorHour + relativeHour
            ) {
              saveActivity(year, month, targetDay, targetHour, cell.value);
            }
          });
        });
      }
    }

    // Increment version to trigger re-render
    set({ dataVersion: dataVersion + 1 });
    refreshStats();
  },

  deleteSelection: () => {
    const { selectedCells, currentDate, refreshStats, dataVersion } = get();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (selectedCells.size === 0) return;

    selectedCells.forEach(cellId => {
      // Parse cellId: "cell-YYYY-M-D-H"
      const parts = cellId.split('-');
      const day = parseInt(parts[3]);
      const hour = parseInt(parts[4]);

      // Delete by saving empty string
      saveActivity(year, month, day, hour, '');
    });

    // Increment version to trigger re-render
    set({ dataVersion: dataVersion + 1 });
    refreshStats();
  },

  // Stats actions
  calculateStats: (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month);
    const stats: Record<string, number> = {
      S: 0,
      F: 0,
      A: 0,
      P: 0,
      C: 0,
      E: 0,
    };
    let totalHours = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      for (let h = 0; h < 24; h++) {
        const activity = loadActivity(year, month, d, h);
        if (activity && ['S', 'F', 'A', 'P', 'C', 'E'].includes(activity)) {
          stats[activity]++;
          totalHours++;
        }
      }
    }

    const result = { stats, totalHours };
    set({ statsCache: result });
    return result;
  },

  refreshStats: () => {
    const { currentDate, calculateStats } = get();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    calculateStats(year, month);
  },
}));
