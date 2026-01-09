import React from 'react';
import type { MonthStats } from '../../../shared/types';
import { Statistic } from './Statistic';
import { useStore } from '../../../shared/store/useStore';
import { Minimize2, Maximize2 } from 'lucide-react';

interface StatsProps {
  stats: MonthStats;
  year: number;
  month: number;
}

export const Stats: React.FC<StatsProps> = ({ stats, year, month }) => {
  const mode = useStore(state => state.statsPanelMode);
  const setMode = useStore(state => state.setStatsPanelMode);


  return (
    <div className="stats-panel flex flex-col h-full bg-[#171717]/80 backdrop-blur-md rounded-xl border border-[#262626] shadow-2xl relative overflow-hidden transition-all duration-300">

      {/* Minimized Content */}
      <div
        className={`lg:vertical-rl text-white text-md font-medium font-playfair tracking-widest whitespace-nowrap transform absolute inset-0 flex flex-row lg:flex-col items-center justify-center lg:py-4 cursor-pointer hover:bg-[#1a1a1a] transition-all duration-300 ${mode === 'minimized' ? 'opacity-100 pointer-events-auto delay-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMode('full')}
        title="Expand Statistic"
      >
        <Maximize2 size={16} className="mr-2 lg:mr-0 lg:mb-6 transform" />
        <span className='lg:rotate-90 lg:pl-16'>Statistic</span>
      </div>

      {/* Full Content */}
      <div className={`flex flex-col h-full p-4 transition-all duration-300 ${mode === 'full' ? 'opacity-100 pointer-events-auto delay-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0 min-h-[32px]">
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-md text-white">
              <span className="text-md font-playfair tracking-wide">Statistic</span>
            </div>
          </div>


          <button
            onClick={() => setMode('minimized')}
            className="text-[#737373] hover:text-[#e5e5e5] transition-colors p-1 rounded-md hover:bg-[#262626]"
            title="Minimize"
          >
            <Minimize2 size={16} />
          </button>
        </div>

        <Statistic stats={stats} year={year} month={month} />
      </div>
    </div>
  );
};
