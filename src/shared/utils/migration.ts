import { api } from '../../services/api';
import { NoteItem } from '../types';
import { processNoteContent } from './notes';

export const migrateLocalData = async (
  onProgress: (message: string) => void
): Promise<void> => {
  try {
    // 1. Settings
    onProgress('Migrating settings...');
    const settingsKey = 'twentyfourseven-settings';
    const settingsJson = localStorage.getItem(settingsKey);
    if (settingsJson) {
      try {
        const categories = JSON.parse(settingsJson);
        if (Array.isArray(categories)) {
          await api.saveSettings(categories);
        } else if (categories && typeof categories === 'object' && categories.categories) {
          await api.saveSettings(categories.categories);
        } else {
          onProgress('Warning: Settings format unrecognized.');
        }
      } catch (e) {
        console.error('Migration: Failed to parse settings', e);
        onProgress('Error: Failed to migrate settings.');
      }
    }

    // 2. Notes
    onProgress('Migrating notes...');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('twentyfourseven-notes-')) {
        const parts = key.replace('twentyfourseven-notes-', '').split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);

        if (!isNaN(year) && !isNaN(month)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              let notesList: NoteItem[] = [];
              if (!Array.isArray(parsed)) {
                Object.values(parsed).forEach((dayNotes: any) => {
                  if (Array.isArray(dayNotes)) {
                    notesList.push(...dayNotes);
                  }
                });
              }

              const safeISO = (val: any): string | undefined => {
                if (!val) return undefined;
                const d = new Date(val);
                return isNaN(d.getTime()) ? undefined : d.toISOString();
              };

              for (const note of notesList) {
                const { type } = processNoteContent(note.content);
                const payload = {
                  content: note.content,
                  type: note.type || type,
                  isDone: note.isDone,
                  isPinned: note.isPinned,
                  createdAt: safeISO(note.createdAt),
                  completedAt: safeISO(note.completedAt),
                  deletedAt: safeISO(note.deletedAt),
                  updatedAt: safeISO(note.updatedAt),
                  id: note.id
                };

                try {
                  await api.createNote(payload);
                } catch (error) {
                  console.error(`Migration: Failed to save note ${note.id}`, error);
                  // Continue with other notes instead of crashing entire migration
                }
              }
            } catch (e) {
              console.error(`Migration: Failed to parse notes for ${key}`, e);
            }
          }
        }
      }
    }

    onProgress('Migration complete! Please reload.');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  }
};
