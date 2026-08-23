import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // Current date state
  currentDate: Date;
  setCurrentDate: (date: Date) => void;

  // Panel layout state
  notesPanelMode: 'full' | 'minimized';
  setNotesPanelMode: (mode: 'full' | 'minimized') => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentDate: new Date(),
      setCurrentDate: (date: Date) => set({ currentDate: date }),

      notesPanelMode: 'full',
      setNotesPanelMode: (mode) => set({ notesPanelMode: mode }),
    }),
    {
      name: 'twentyfourseven-ui-store',
      partialize: (state) => ({
        notesPanelMode: state.notesPanelMode,
      }),
    }
  )
);
