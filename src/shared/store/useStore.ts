import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SelectedDate {
  year: number;
  month: number;
  day: number;
}

interface AppState {
  // Current date state
  currentDate: Date;
  setCurrentDate: (date: Date) => void;

  // Selected date filter
  selectedDate: SelectedDate | null;
  setSelectedDate: (date: SelectedDate | null) => void;

  // Panel layout state
  notesPanelMode: 'full' | 'minimized';
  setNotesPanelMode: (mode: 'full' | 'minimized') => void;

  // Mobile active tab
  mobileTab: 'explorer' | 'notes';
  setMobileTab: (tab: 'explorer' | 'notes') => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentDate: new Date(),
      setCurrentDate: (date: Date) => set({ currentDate: date }),

      selectedDate: null,
      setSelectedDate: (date: SelectedDate | null) => set({ selectedDate: date }),

      notesPanelMode: 'full',
      setNotesPanelMode: (mode) => set({ notesPanelMode: mode }),

      mobileTab: 'notes',
      setMobileTab: (tab) => set({ mobileTab: tab }),
    }),
    {
      name: 'twentyfourseven-ui-store',
      partialize: (state) => ({
        notesPanelMode: state.notesPanelMode,
      }),
    }
  )
);
