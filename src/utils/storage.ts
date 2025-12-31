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

export const getCellClass = (value: ActivityKey): string => {
  const validValues = ['S', 'F', 'A', 'P', 'C', 'E'];
  return validValues.includes(value) ? value : 'empty';
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

      // Validate data structure
      const validValues = ['S', 'F', 'A', 'P', 'C', 'E', ''];
      let importedCount = 0;

      for (const [key, value] of Object.entries(data)) {
        // Validate key format (twentyfourseven-YYYY-M-D-H)
        if (key.startsWith(STORAGE_PREFIX) && validValues.includes(value)) {
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
