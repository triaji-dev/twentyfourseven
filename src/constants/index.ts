import type { Categories } from '../types';

export const CATEGORIES: Categories = {
  S: { name: 'Sleep', color: '#E8F5E9', darkColor: '#2E7D32' },
  F: { name: 'Family', color: '#FFF9E6', darkColor: '#F57C00' },
  A: { name: 'Architecture', color: '#E3F2FD', darkColor: '#1976D2' },
  P: { name: 'Programming', color: '#FCE4EC', darkColor: '#C2185B' },
  C: { name: 'Creativity', color: '#F3E5F5', darkColor: '#7B1FA2' },
  E: { name: 'Entertainment', color: '#FFF3E0', darkColor: '#EF6C00' },
};

export const VALID_VALUES = Object.keys(CATEGORIES) as Array<
  keyof typeof CATEGORIES
>;

export const STORAGE_PREFIX = 'twentyfourseven';

export const DAYS_OF_WEEK_FULL = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

export const DAY_ABBREVIATIONS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
