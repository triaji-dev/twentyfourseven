import { useEffect } from 'react';
import { useStore } from '../../../shared/store/useStore';

export const useStats = (year: number, month: number) => {
  const calculateStats = useStore(state => state.calculateStats);
  const statsCache = useStore(state => state.statsCache);

  // Calculate stats on mount and when date changes
  useEffect(() => {
    calculateStats(year, month);
  }, [year, month, calculateStats]);

  return statsCache || { stats: {}, totalHours: 0 };
};
