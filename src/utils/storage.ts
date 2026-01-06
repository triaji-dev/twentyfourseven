import { STORAGE_PREFIX } from '../constants';
import type { ActivityKey } from '../types';

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const loadActivity = (
  year: number,
  month: number,
  day: number,
  hour: number
): ActivityKey => {
  const id = `${STORAGE_PREFIX}-${year}-${month + 1}-${day}-${hour}`;
  return (localStorage.getItem(id) as ActivityKey) || '';
};

export const getNotes = (year: number, month: number, day: number): any[] => {
  const montlyNotesId = `${STORAGE_PREFIX}-notes-${year}-${month}`;
  const stored = localStorage.getItem(montlyNotesId);
  if (!stored) return [];
  try {
    const notesByDay = JSON.parse(stored);
    return notesByDay[day] || [];
  } catch {
    return [];
  }
};

export const saveActivity = (
  year: number,
  month: number,
  day: number,
  hour: number,
  value: ActivityKey
): void => {
  const id = `${STORAGE_PREFIX}-${year}-${month + 1}-${day}-${hour}`;
  if (value === '') {
    localStorage.removeItem(id);
  } else {
    localStorage.setItem(id, value);
  }
};

// Migrate all activity entries from old key to new key when category is renamed
export const migrateActivityKey = (oldKey: string, newKey: string): void => {
  if (oldKey === newKey) return;
  
  const keysToUpdate: string[] = [];
  
  // Find all activity entries with the old key
  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (storageKey && storageKey.startsWith(STORAGE_PREFIX) && !storageKey.includes('-notes-') && !storageKey.includes('-settings')) {
      const value = localStorage.getItem(storageKey);
      if (value === oldKey) {
        keysToUpdate.push(storageKey);
      }
    }
  }
  
  // Update all found entries to the new key
  keysToUpdate.forEach(storageKey => {
    localStorage.setItem(storageKey, newKey);
  });
};

export const getCellClass = (value: ActivityKey): string => {
  // Return value as class if it's a single uppercase letter, else empty
  if (value && /^[A-Z]$/.test(value)) {
    return value;
  }
  return 'empty';
};

// Export all twentyfourseven data to JSON
export const exportAllData = (): void => {
  const data: Record<string, string> = {};

  // Collect all localStorage items with our prefix
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      const value = localStorage.getItem(key);
      if (value) {
        data[key] = value;
      }
    }
  }

  // Create and download JSON file
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `twentyfourseven-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Import data from JSON file
export const importAllData = (
  file: File,
  onSuccess: () => void,
  onError: (error: string) => void
): void => {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const data = JSON.parse(content) as Record<string, string>;

      let importedCount = 0;

      for (const [key, value] of Object.entries(data)) {
        // Check if it's our prefix
        if (!key.startsWith(STORAGE_PREFIX)) continue;
        
        const isSettings = key === STORAGE_PREFIX + '-settings';
        const isNote = key.includes('-notes-');
        
        // Validation:
        // 1. Settings: accept JSON object with categories
        // 2. Notes: accept any string (it's stringified JSON)
        // 3. Activity: accept single uppercase letter or empty string
        let isValidValue = false;
        if (isSettings) {
          // Settings should be valid JSON with categories array
          try {
            const parsed = JSON.parse(value);
            isValidValue = parsed.categories && Array.isArray(parsed.categories);
          } catch {
            isValidValue = false;
          }
        } else if (isNote) {
          isValidValue = true;
        } else {
          isValidValue = value === '' || /^[A-Z]$/.test(value);
        }
        
        if (isValidValue) {
          if (value === '') {
            localStorage.removeItem(key);
          } else {
            localStorage.setItem(key, value);
          }
          importedCount++;
        }
      }

      if (importedCount === 0) {
        onError('No valid data found in the file');
        return;
      }

      onSuccess();
    } catch {
      onError('Invalid JSON file format');
    }
  };

  reader.onerror = () => {
    onError('Failed to read file');
  };

  reader.readAsText(file);
};
