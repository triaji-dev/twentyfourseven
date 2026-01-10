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
          console.log('Migration: Found categories array, saving...');
          await api.saveSettings(categories);
        } else if (categories && typeof categories === 'object' && categories.categories) {
             // Handle potential { categories: [...] } wrapper
             console.log('Migration: Found wrapped categories object, saving...');
             await api.saveSettings(categories.categories);
        } else {
            console.warn('Migration: Settings format unrecognized', categories);
            onProgress('Warning: Settings format unrecognized.');
        }
      } catch (e) {
        console.error('Migration: Failed to parse settings', e);
        onProgress('Error: Failed to migrate settings.');
      }
    } else {
        console.log('Migration: No settings found in localStorage.');
    }

    // 2. Activities
    onProgress('Migrating activities...');
    const allActivities: { year: number, month: number, day: number, hour: number, value: ActivityKey }[] = [];
    
    console.log(`Migration: Scanning ${localStorage.length} localStorage items...`);
    let foundKeysCount = 0;
    
    // DEBUG: Log first 20 keys to see what we are dealing with
    console.log('--- DEBUG KEYS START ---');
    for(let j=0; j<Math.min(localStorage.length, 20); j++) {
        console.log(`Key[${j}]:`, localStorage.key(j));
    }
    console.log('--- DEBUG KEYS END ---');

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
                    foundKeysCount++;
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
                                    foundKeysCount++;
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
    
    console.log(`Migration: Found ${foundKeysCount} matching keys.`);
    console.log(`Migration: Collected ${allActivities.length} individual activity records.`);

    if (allActivities.length > 0) {
        onProgress(`Saving ${allActivities.length} activities...`);
        try {
            await api.saveActivitiesBulk(allActivities);
            console.log('Migration: Bulk save completed.');
        } catch (e) {
            console.error('Migration: Bulk save failed', e);
            throw e; // Re-throw to be caught by main try-catch
        }
    } else {
        console.warn('Migration: No activities found to save.');
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
                                deletedAt: note.deletedAt,
                                updatedAt: note.updatedAt,
                                id: note.id // Important for UPSERT/Restore
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
