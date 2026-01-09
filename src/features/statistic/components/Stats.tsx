import React from 'react';
import type { MonthStats } from '../../../shared/types';
import { Statistic } from './Statistic';

interface StatsProps {
  stats: MonthStats;
  year: number;
  month: number;
}

export const Stats: React.FC<StatsProps> = ({ stats, year, month }) => {
  return (
    <div className="stats-panel flex flex-col h-full bg-[#171717]/80 backdrop-blur-md rounded-xl p-4 border border-[#262626] shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 mb-6 flex-shrink-0 min-h-[32px]">
        <div className="px-3 py-1 rounded-md text-white bg-[#262626]">
          <span className="text-md font-playfair tracking-wide">Statistic</span>
        </div>
      </div>

      <Statistic stats={stats} year={year} month={month} />
    </div>
  );
};
