import { api } from '../../services/api';
import { NoteItem, ActivityKey, DynamicCategory } from '../types';
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
        const categories: DynamicCategory[] = JSON.parse(settingsJson);
        if (Array.isArray(categories)) {
          await api.saveSettings(categories);
        }
      } catch (e) {
        console.error('Migration: Failed to parse settings', e);
      }
    }

    // 2. Activities
    onProgress('Migrating activities...');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('twentyfourseven-data-')) {
            const parts = key.replace('twentyfourseven-data-', '').split('-');
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);

            if (!isNaN(year) && !isNaN(month)) {
               const raw = localStorage.getItem(key);
               if (raw) {
                   try {
                       const parsed = JSON.parse(raw);
                       // parsed is object: { "1-0": "A", "1-1": "B" ... } keys are "day-hour"
                       const promises: Promise<any>[] = [];
                       Object.entries(parsed).forEach(([cellKey, value]) => {
                           const [dStr, hStr] = cellKey.split('-');
                           const day = parseInt(dStr);
                           const hour = parseInt(hStr);
                           const val = value as ActivityKey;

                           if (!isNaN(day) && !isNaN(hour) && val) {
                               // Sequential or parallel? Parallel might hit rate limits, but let's try batching or just parallel for now.
                               // Supabase handles concurrency well enough for single user volume.
                               promises.push(api.saveActivity(year, month, day, hour, val));
                           }
                       });
                       await Promise.all(promises);
                   } catch (e) {
                       console.error(`Migration: Failed to parse activities for ${key}`, e);
                   }
               }
            }
        }
    }

    // 3. Notes
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
                        const parsed = JSON.parse(raw); // Record<day, NoteItem[]>
                        // Note: Parsed might be array (legacy) or object
                        let notesList: NoteItem[] = [];
                        if (Array.isArray(parsed)) {
                            // Legacy format? Assuming object structure from useNotes analysis
                            // If array, what structure?
                            // useNotes logic: "if (Array.isArray(parsed)) setNotes({})" -> It treated array as invalid/empty or different format?
                            // Let's assume object Record<string, NoteItem[]>
                            // Actually useNotes.tsx had: if (Array.isArray(parsed)) setNotes({}) which implies it didn't support array.
                        } else {
                            Object.values(parsed).forEach((dayNotes: any) => {
                                if (Array.isArray(dayNotes)) {
                                    notesList.push(...dayNotes);
                                }
                            });
                        }

                        for (const note of notesList) {
                            // Create note
                            // api.createNote accepts Partial<NoteItem>
                            // We should preserve createdAt if possible.
                            // NoteItem has createdAt.
                            const { type } = processNoteContent(note.content);
                            await api.createNote({
                                content: note.content, // Preserve original content
                                type: note.type || type,
                                isDone: note.isDone,
                                isPinned: note.isPinned,
                                createdAt: note.createdAt,
                                completedAt: note.completedAt,
                                deletedAt: note.deletedAt
                            });
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
