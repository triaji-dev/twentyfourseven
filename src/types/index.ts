export type ActivityKey = 'S' | 'F' | 'A' | 'P' | 'C' | 'E' | '';

export interface Category {
  name: string;
  color: string;
  darkColor: string;
}

export type Categories = {
  [key in Exclude<ActivityKey, ''>]: Category;
};

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
