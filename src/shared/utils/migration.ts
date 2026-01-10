import { api } from '../../services/api';
import { NoteItem, ActivityKey } from '../types';
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
             // Handle potential { categories: [...] } wrapper
             await api.saveSettings(categories.categories);
        } else {
            onProgress('Warning: Settings format unrecognized.');
        }
      } catch (e) {
        console.error('Migration: Failed to parse settings', e);
        onProgress('Error: Failed to migrate settings.');
      }
    }

    // 2. Activities
    onProgress('Migrating activities...');
    const allActivities: { year: number, month: number, day: number, hour: number, value: ActivityKey }[] = [];
    


    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Key format: twentyfourseven-YEAR-MONTH-DAY-HOUR
        // Example: twentyfourseven-2025-9-29-22
        if (key && key.startsWith('twentyfourseven-') && !key.startsWith('twentyfourseven-notes-') && !key.startsWith('twentyfourseven-settings')) {
            const parts = key.split('-');
            // Expected parts: ["twentyfourseven", "2025", "9", "29", "22"] -> length 5
            
            if (parts.length === 5) {
                const year = parseInt(parts[1]);
                const month = parseInt(parts[2]) - 1; // Convert 1-based (from key) to 0-based (for api.ts/Date)
                const day = parseInt(parts[3]);
                const hour = parseInt(parts[4]);

                if (!isNaN(year) && !isNaN(month) && !isNaN(day) && !isNaN(hour)) {

                    const raw = localStorage.getItem(key);
                    if (raw) {
                        // Value might be pure string or JSON string.
                        // Typically simple string in local storage if not stringified object.
                        // But if it was stored with setItem(key, JSON.stringify(val)), it has quotes.
                        let val: ActivityKey = '';
                        try {
                            const parsed = JSON.parse(raw);
                            val = typeof parsed === 'string' ? parsed : raw as ActivityKey;
                        } catch {
                            val = raw as ActivityKey;
                        }

                        if (val) {
                            allActivities.push({ year, month, day, hour, value: val });
                        }
                    }
                }
            } else if (key.startsWith('twentyfourseven-data-')) {
                 // Legacy/Alternative format handling (just in case mixed data)
                 // Format: twentyfourseven-data-YEAR-MONTH
                 const partsLegacy = key.replace('twentyfourseven-data-', '').split('-');
                 const year = parseInt(partsLegacy[0]);
                 const month = parseInt(partsLegacy[1]);
                 if (!isNaN(year) && !isNaN(month)) {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        try {
                            const parsed = JSON.parse(raw);
                            Object.entries(parsed).forEach(([cellKey, value]) => {
                                const [dStr, hStr] = cellKey.split('-');
                                const day = parseInt(dStr);
                                const hour = parseInt(hStr);
                                if (!isNaN(day) && !isNaN(hour) && value) {
                                    allActivities.push({ year, month, day, hour, value: value as ActivityKey });
                                }
                            });
                        } catch (e) {
                            console.error(`Migration: Failed to parse legacy activity ${key}`, e);
                        }
                    }
                 }
            }
        }
    }
    


    if (allActivities.length > 0) {
        onProgress(`Saving ${allActivities.length} activities...`);
        try {
            await api.saveActivitiesBulk(allActivities);
        } catch (e) {
            console.error('Migration: Bulk save failed', e);
            throw e; // Re-throw to be caught by main try-catch
        }
    } else {
        onProgress('Warning: No activities found to migrate.');
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
                            // Legacy format not supported or empty
                        } else {
                            Object.values(parsed).forEach((dayNotes: any) => {
                                if (Array.isArray(dayNotes)) {
                                    notesList.push(...dayNotes);
                                }
                            });
                        }

                        // Helper to ensure valid ISO string for Supabase timestamptz
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
