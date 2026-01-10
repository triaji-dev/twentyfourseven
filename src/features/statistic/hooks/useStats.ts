import { useMemo } from 'react';
import { useActivities } from '../../../hooks/useSupabaseQuery';

export const useStats = (year: number, month: number) => {
  const { data: activities = [] } = useActivities(year, month);

  return useMemo(() => {
    const stats: Record<string, number> = {};
    let totalHours = 0;

    activities.forEach(a => {
      // Simplified check for single letter uppercase
      if (/^[A-Z]$/.test(a.value)) {
        stats[a.value] = (stats[a.value] || 0) + 1;
        totalHours++;
      }
    });

    return { stats, totalHours };
  }, [activities]);
};
