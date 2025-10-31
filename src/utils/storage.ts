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
