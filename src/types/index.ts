// Dynamic activity key - any single uppercase letter
export type ActivityKey = string;

export interface DynamicCategory {
  key: string;        // Single uppercase letter (A-Z)
  name: string;       // Display name
  color: string;      // Hex color for background
}

export interface CellData {
  year: number;
  month: number;
  day: number;
  hour: number;
  value: ActivityKey;
}

export interface MonthStats {
  stats: Record<string, number>;
  totalHours: number;
}

// Default categories to use on first load
export const DEFAULT_CATEGORIES: DynamicCategory[] = [
  { key: 'S', name: 'Sleep', color: '#10b981' },
  { key: 'F', name: 'Family', color: '#f97316' },
  { key: 'A', name: 'Architecture', color: '#0284c7' },
  { key: 'P', name: 'Programming', color: '#db2777' },
  { key: 'C', name: 'Creativity', color: '#8b5cf6' },
  { key: 'E', name: 'Entertainment', color: '#06b6d4' },
];
