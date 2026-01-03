import React from 'react';
import type { MonthStats } from '../types';
import { Statistic } from './Statistic';
import { Notes } from './Notes';
import { useStore } from '../store/useStore';

interface StatsProps {
  stats: MonthStats;
  year: number;
  month: number;
}

export const Stats: React.FC<StatsProps> = ({ stats, year, month }) => {
  const mainTab = useStore(state => state.activePanel);
  const setMainTab = useStore(state => state.setActivePanel);

  return (
    <div className="stats-panel flex flex-col h-full bg-[#171717]/80 backdrop-blur-md rounded-xl p-4 border border-[#262626] shadow-2xl relative overflow-hidden">
        {/* Main Tabs */}
        <div className="flex gap-4 mb-6 flex-shrink-0">
        <button
          onClick={() => setMainTab('statistic')}
          className={`text-md font-playfair tracking-wide transition-colors ${mainTab === 'statistic' ? 'text-white' : 'text-[#737373] hover:text-[#a3a3a3]'}`}
           style={{
            background: mainTab === 'statistic' ? '#262626' : 'transparent',
            padding: '4px 12px',
            borderRadius: '6px',
          }}
        >
          Statistic
        </button>
        <button
          onClick={() => setMainTab('notes')}
          className={`text-md font-playfair tracking-wide transition-colors ${mainTab === 'notes' ? 'text-white' : 'text-[#737373] hover:text-[#a3a3a3]'}`}
           style={{
            background: mainTab === 'notes' ? '#262626' : 'transparent',
            padding: '4px 12px',
            borderRadius: '6px',
          }}
        >
          Notes
        </button>
      </div>

      {mainTab === 'statistic' ? (
        <Statistic stats={stats} year={year} month={month} />
      ) : (
        <Notes year={year} month={month} />
      )}
    </div>
  );
};
