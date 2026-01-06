import React, { useRef } from 'react';
import type { MonthStats } from '../types';
import { Statistic } from './Statistic';
import { Notes, NotesHandle } from './Notes';
import { useStore } from '../store/useStore';
import { Download } from 'lucide-react';

interface StatsProps {
  stats: MonthStats;
  year: number;
  month: number;
}

export const Stats: React.FC<StatsProps> = ({ stats, year, month }) => {
  const mainTab = useStore(state => state.activePanel);
  const setMainTab = useStore(state => state.setActivePanel);
  const notesRef = useRef<NotesHandle>(null);

  return (
    <div className="stats-panel flex flex-col h-full bg-[#171717]/80 backdrop-blur-md rounded-xl p-4 border border-[#262626] shadow-2xl relative overflow-hidden">
      {/* Main Tabs */}
      <div className="flex gap-4 mb-6 flex-shrink-0">
        <button
          onClick={() => setMainTab('statistic')}
          className={`text-md font-playfair tracking-wide transition-colors px-3 py-1 rounded-md ${mainTab === 'statistic' ? 'text-white bg-[#262626]' : 'text-[#737373] hover:text-[#a3a3a3] bg-transparent'}`}
        >
          Statistic
        </button>
        <div
          onClick={() => setMainTab('notes')}
          className={`flex items-center gap-2 cursor-pointer transition-colors px-3 py-1 rounded-md ${mainTab === 'notes' ? 'text-white bg-[#262626]' : 'text-[#737373] hover:text-[#a3a3a3] bg-transparent'}`}
        >
          <span className="text-md font-playfair tracking-wide">Note</span>
          {mainTab === 'notes' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                notesRef.current?.downloadNotes();
              }}
              className="text-[#737373] hover:text-[#e5e5e5] transition-colors p-0.5"
              title="Download Notes"
            >
              <Download size={14} />
            </button>
          )}
        </div>
      </div>

      {mainTab === 'statistic' ? (
        <Statistic stats={stats} year={year} month={month} />
      ) : (
        <Notes ref={notesRef} year={year} month={month} />
      )}
    </div>
  );
};
