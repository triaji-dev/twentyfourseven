import { useMemo } from 'react';
import { useAllActivities } from '../../../hooks/useSupabaseQuery';

export const useStats = (year: number, month: number) => {
  const { data: allActivities = [], isLoading } = useAllActivities();

  return useMemo(() => {
    const stats: Record<string, number> = {};
    const allTimeStats: Record<string, number> = {};
    let totalHours = 0;
    let allTimeTotalHours = 0;

    allActivities.forEach(a => {
      const val = a.value?.trim();
      if (val && /^[A-Z]$/.test(val)) {
        // Calculate All Time Stats
        allTimeStats[val] = (allTimeStats[val] || 0) + 1;
        allTimeTotalHours++;

        // Calculate Monthly Stats
        const activityYear = parseInt(a.date.split('-')[0]);
        const activityMonth = parseInt(a.date.split('-')[1]) - 1; // Month is 0-indexed in JS Date
        
        if (activityYear === year && activityMonth === month) {
           stats[val] = (stats[val] || 0) + 1;
           totalHours++;
        }
      }
    });

    return { stats, totalHours, allTimeStats, allTimeTotalHours, allActivities, isLoading };
  }, [allActivities, year, month, isLoading]);
};
