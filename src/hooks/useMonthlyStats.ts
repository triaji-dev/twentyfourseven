import { useState, useEffect, useCallback } from 'react';
import { getDaysInMonth, loadActivity } from '../utils/storage';
import type { MonthStats } from '../types';

export const useMonthlyStats = (year: number, month: number): MonthStats => {
  const [stats, setStats] = useState<MonthStats>({ stats: {}, totalHours: 0 });

  const calculateStats = useCallback(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const newStats: Record<string, number> = {
      S: 0,
      F: 0,
      A: 0,
      P: 0,
      C: 0,
      E: 0,
    };
    let totalHours = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      for (let h = 0; h < 24; h++) {
        const activity = loadActivity(year, month, d, h);
        if (activity && ['S', 'F', 'A', 'P', 'C', 'E'].includes(activity)) {
          newStats[activity]++;
          totalHours++;
        }
      }
    }

    setStats({ stats: newStats, totalHours });
  }, [year, month]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  return stats;
};
