import { create } from 'zustand';
import { getDaysInMonth, loadActivity, saveActivity } from '../utils/storage';
import type { MonthStats, ActivityKey } from '../types';

interface CopiedCell {
  day: number;
  hour: number;
  value: ActivityKey;
}

interface ActiveCell {
  year: number;
  month: number;
  day: number;
  hour: number;
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
  selectionEnd: {
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

  // Active cell tracking
  activeCell: ActiveCell | null;

  // Stats cache
  statsCache: MonthStats | null;

  // Undo/Redo state
  history: Array<{ [cellId: string]: ActivityKey }>;
  future: Array<{ [cellId: string]: ActivityKey }>;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

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
  setSelectionEnd: (
    end: { year: number; month: number; day: number; hour: number } | null
  ) => void;
  expandSelection: (direction: 'up' | 'down' | 'left' | 'right') => void;
  toggleCellSelection: (cellId: string) => void;
  clearSelection: () => void;
  selectRectangle: (
    start: { year: number; month: number; day: number; hour: number },
    end: { year: number; month: number; day: number; hour: number }
  ) => void;

  // Clipboard actions
  copySelection: () => void;
  pasteToSelection: (clipboardText?: string) => void;
  deleteSelection: () => void;
  clearCopiedCells: () => void;

  // Active cell actions
  setActiveCell: (cell: ActiveCell | null) => void;

  // Stats actions
  calculateStats: (year: number, month: number) => MonthStats;
  calculateDayStats: (year: number, month: number, day: number) => MonthStats;
  calculateAllTimeStats: () => MonthStats;
  refreshStats: () => void;
  triggerUpdate: () => void;
}

// Fungsi untuk mengambil semua nilai cell
export function getAllCellValues(
  year: number,
  month: number
): { [cellId: string]: ActivityKey } {
  const daysInMonth = getDaysInMonth(year, month);
  const result: { [cellId: string]: ActivityKey } = {};
  for (let day = 1; day <= daysInMonth; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const value = loadActivity(year, month, day, hour);
      const cellId = `cell-${year}-${month + 1}-${day}-${hour}`;
      result[cellId] = value || '';
    }
  }
  return result;
}

// Fungsi untuk mengembalikan semua nilai cell
export function restoreCellValues(
  values: { [cellId: string]: ActivityKey },
  year: number,
  month: number
) {
  Object.entries(values).forEach(([cellId, value]) => {
    const parts = cellId.split('-');
    const day = parseInt(parts[3]);
    const hour = parseInt(parts[4]);
    saveActivity(year, month, day, hour, value);
  });
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  currentDate: new Date(),
  selectedCells: new Set(),
  isSelecting: false,
  selectionStart: null,
  selectionEnd: null,
  copiedCells: [],
  copiedCellIds: new Set(),
  dataVersion: 0,
  activeCell: null,
  statsCache: null,
  clearCopiedCells: () => set({ copiedCellIds: new Set(), copiedCells: [] }),

  history: [],
  future: [],
  pushHistory: () => {
    const year = get().currentDate.getFullYear();
    const month = get().currentDate.getMonth();
    const current = getAllCellValues(year, month);
    set(state => ({
      history: [...state.history, current],
      future: [],
    }));
  },
  undo: () => {
    const state = get();
    if (state.history.length === 0) return;

    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();

    // Simpan state saat ini ke future sebelum restore
    const current = getAllCellValues(year, month);

    // Ambil state sebelumnya dari history
    const prev = state.history[state.history.length - 1];

    // Restore ke state sebelumnya
    restoreCellValues(prev, year, month);

    // Update store
    set({
      history: state.history.slice(0, -1),
      future: [current, ...state.future],
      dataVersion: state.dataVersion + 1, // Trigger re-render
    });

    // Refresh stats setelah undo
    get().refreshStats();
  },
  redo: () => {
    const state = get();
    if (state.future.length === 0) return;

    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();

    // Simpan state saat ini ke history sebelum restore
    const current = getAllCellValues(year, month);

    // Ambil state berikutnya dari future
    const next = state.future[0];

    // Restore ke state berikutnya
    restoreCellValues(next, year, month);

    // Update store
    set({
      history: [...state.history, current],
      future: state.future.slice(1),
      dataVersion: state.dataVersion + 1, // Trigger re-render
    });

    // Refresh stats setelah redo
    get().refreshStats();
  },

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

  setSelectionStart: start =>
    set({ selectionStart: start, selectionEnd: start }),

  setSelectionEnd: end => set({ selectionEnd: end }),

  expandSelection: (direction: 'up' | 'down' | 'left' | 'right') => {
    const { selectionStart, selectionEnd, currentDate } = get();

    // Ensure we have a start and end
    if (!selectionStart) {
      return;
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Use selectionEnd if exists, otherwise use selectionStart
    let endDay = selectionEnd ? selectionEnd.day : selectionStart.day;
    let endHour = selectionEnd ? selectionEnd.hour : selectionStart.hour;

    // Move end position based on direction
    if (direction === 'right') {
      endDay = Math.min(endDay + 1, daysInMonth);
    } else if (direction === 'left') {
      endDay = Math.max(endDay - 1, 1);
    } else if (direction === 'down') {
      endHour = Math.min(endHour + 1, 23);
    } else if (direction === 'up') {
      endHour = Math.max(endHour - 1, 0);
    }

    const newEnd = { year, month, day: endDay, hour: endHour };

    // Update selectionEnd
    set({ selectionEnd: newEnd });

    // Select rectangle from start to new end
    get().selectRectangle(selectionStart, newEnd);
  },

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

  pasteToSelection: (clipboardText?: string) => {
    const {
      selectedCells,
      copiedCells,
      currentDate,
      refreshStats,
      dataVersion,
      pushHistory,
    } = get();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    pushHistory();

    // Jika ada clipboardText (dari event paste), parse sebagai TSV
    if (clipboardText) {
      const rows = clipboardText.trim().split('\n');
      const data = rows.map(row => row.split('\t'));

      // Ambil anchor cell
      const selectedArray = Array.from(selectedCells);
      if (selectedArray.length === 0) return;
      const anchorCellId = selectedArray[0];
      const anchorParts = anchorCellId.split('-');
      const anchorDay = parseInt(anchorParts[3]);
      const anchorHour = parseInt(anchorParts[4]);

      // Paste data ke grid dengan validasi tipe ActivityKey
      // Row di spreadsheet = Hour (vertikal di grid)
      // Column di spreadsheet = Day (horizontal di grid)
      const daysInMonth = getDaysInMonth(year, month);

      for (let r = 0; r < data.length; r++) {
        for (let c = 0; c < data[r].length; c++) {
          const targetHour = anchorHour + r; // Row spreadsheet -> Hour grid
          const targetDay = anchorDay + c; // Column spreadsheet -> Day grid

          const value = (data[r][c] || '')
            .toString()
            .trim()
            .toUpperCase() as ActivityKey;

          if (
            targetDay >= 1 &&
            targetDay <= daysInMonth &&
            targetHour >= 0 &&
            targetHour < 24 &&
            (value === '' || /^[A-Z]$/.test(value))
          ) {
            saveActivity(year, month, targetDay, targetHour, value);
          }
        }
      }
      set({ dataVersion: dataVersion + 1 });
      refreshStats();
      return;
    }

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
    const {
      selectedCells,
      currentDate,
      refreshStats,
      dataVersion,
      pushHistory,
    } = get();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    pushHistory();

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
    const stats: Record<string, number> = {};
    let totalHours = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      for (let h = 0; h < 24; h++) {
        const activity = loadActivity(year, month, d, h);
        if (activity && /^[A-Z]$/.test(activity)) {
          stats[activity] = (stats[activity] || 0) + 1;
          totalHours++;
        }
      }
    }

    const result = { stats, totalHours };
    set({ statsCache: result });
    return result;
  },

  calculateDayStats: (year: number, month: number, day: number) => {
    const stats: Record<string, number> = {};
    let totalHours = 0;

    for (let h = 0; h < 24; h++) {
      const activity = loadActivity(year, month, day, h);
      if (activity && /^[A-Z]$/.test(activity)) {
        stats[activity] = (stats[activity] || 0) + 1;
        totalHours++;
      }
    }

    return { stats, totalHours };
  },

  calculateAllTimeStats: () => {
    const stats: Record<string, number> = {};
    let totalHours = 0;

    // Iterate through all localStorage keys with our prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('twentyfourseven-') && key !== 'twentyfourseven-settings') {
        const value = localStorage.getItem(key);
        if (value && /^[A-Z]$/.test(value)) {
          stats[value] = (stats[value] || 0) + 1;
          totalHours++;
        }
      }
    }

    return { stats, totalHours };
  },

  setActiveCell: (cell: ActiveCell | null) => set({ activeCell: cell }),

  refreshStats: () => {
    const { currentDate, calculateStats } = get();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    calculateStats(year, month);
  },
  triggerUpdate: () => set(state => ({ dataVersion: state.dataVersion + 1 })),
}));
