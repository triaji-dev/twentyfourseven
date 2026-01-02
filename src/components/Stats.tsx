import React, { useRef, useEffect, useState, useMemo } from 'react';
import { getDaysInMonth } from '../utils/storage';
import { useSettings } from '../store/useSettings';
import { useStore } from '../store/useStore';
import type { MonthStats } from '../types';

type StatsTab = 'daily' | 'monthly' | 'alltime';

interface StatsProps {
  stats: MonthStats;
  year: number;
  month: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const Stats: React.FC<StatsProps> = ({ stats, year, month }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const categories = useSettings((state) => state.categories);
  const activeCell = useStore((state) => state.activeCell);
  const calculateDayStats = useStore((state) => state.calculateDayStats);
  const calculateAllTimeStats = useStore((state) => state.calculateAllTimeStats);
  const dataVersion = useStore((state) => state.dataVersion);
  
  // Notes types
  interface NoteItem {
    id: string;
    content: string;
    createdAt: string; // ISO string
  }

  const [activeTab, setActiveTab] = useState<StatsTab>('monthly');
  const [mainTab, setMainTab] = useState<'statistic' | 'notes'>('statistic');
  
  // Notes state: Map day -> NoteItem[]
  const [notes, setNotes] = useState<Record<number, NoteItem[]>>({});
  const [newNote, setNewNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isViewAll, setIsViewAll] = useState(false);
  const [allTimeNotes, setAllTimeNotes] = useState<Array<{ date: Date; notes: NoteItem[] }>>([]);
  
  // Actions
  const setActiveCell = useStore((state) => state.setActiveCell);

  // Helper to fetch all notes
  const fetchAllNotes = () => {
    const all: Array<{ date: Date; notes: NoteItem[] }> = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('twentyfourseven-notes-')) {
            const parts = key.split('-'); // prefix-notes-year-month
            const y = parseInt(parts[2]);
            const m = parseInt(parts[3]);
            try {
              const monthNotes = JSON.parse(localStorage.getItem(key) || '{}');
              Object.entries(monthNotes).forEach(([d, dayNotes]) => {
                  const items = dayNotes as NoteItem[];
                  if (items.length > 0) {
                    all.push({
                      date: new Date(y, m, parseInt(d)),
                      notes: items
                    });
                  }
              });
            } catch (e) {
              // ignore error
            }
        }
    }
    // Sort descending by date
    return all.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  // Load notes for current month
  useEffect(() => {
    // If viewing all, don't overwrite with month data necessarily, 
    // but we usually want to keep 'notes' state for the current month view.
    const key = `twentyfourseven-notes-${year}-${month}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setNotes({});
        } else {
          setNotes(parsed);
        }
      } catch (e) {
        setNotes({});
      }
    } else {
      setNotes({});
    }
  }, [year, month]);

  // Load all notes when entering view all
  useEffect(() => {
    if (isViewAll) {
      setAllTimeNotes(fetchAllNotes());
    }
  }, [isViewAll, year, month, notes]); // Refresh if current notes change

  // ... handleAddNote same ...
  // ... handleDeleteNote same ...
  
  // Toggle View All
  const toggleViewAll = () => {
    if (isViewAll) {
      setIsViewAll(false);
    } else {
      setActiveCell(null); // Clear specific day selection
      setIsViewAll(true);
    }
  };

  // Filtered Notes Logic
  const getFilteredNotes = () => {
    let result: Array<{ date: Date; notes: NoteItem[] }> = [];

    if (isViewAll) {
      result = allTimeNotes;
    } else if (activeCell) {
       // Single day
       const dayNotes = notes[activeCell.day] || [];
       if (dayNotes.length > 0) {
         result = [{
           date: new Date(year, month, activeCell.day),
           notes: dayNotes
         }];
       }
    } else {
      // Current Month
      Object.entries(notes).forEach(([d, items]) => {
         if (items.length > 0) {
           result.push({
             date: new Date(year, month, parseInt(d)),
             notes: items
           });
         }
      });
      result.sort((a, b) => a.date.getDate() - b.date.getDate());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.map(item => ({
        ...item,
        notes: item.notes.filter(n => n.content.toLowerCase().includes(q))
      })).filter(item => item.notes.length > 0);
    }

    return result;
  };
  
  const filteredNotes = getFilteredNotes();
  // ... DisplayStats ... same

  // ... Render ...
  // Inside mainTab === 'notes' :
  // Shows Search Bar + Link
  // Shows List
  // Shows Input (only if !isViewAll && activeCell)



  // Save notes handler
  const handleAddNote = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newNote.trim() && activeCell) {
      const day = activeCell.day;
      const input = newNote.trim();
      let entries: string[] = [];

      // Logic split: Detect common bullet points pattern
      if (/^[-•*]\s/.test(input) || /(\s[-•*]\s)/.test(input)) {
        const normalized = input.replace(/(?:^|\s)([-•*])\s/g, '|||$1 '); 
        entries = normalized
          .split('|||')
          .map(s => s.trim())
          .filter(s => s.length > 0)
          .map(s => s.replace(/^[-•*]\s/, '')); 
      } else {
        entries = [input];
      }

      if (entries.length > 0) {
        const newItems: NoteItem[] = entries.map(content => ({
          id: Math.random().toString(36).substr(2, 9),
          content,
          createdAt: new Date().toISOString()
        }));

        const updatedNotes = {
          ...notes,
          [day]: [...(notes[day] || []), ...newItems]
        };
        
        setNotes(updatedNotes);
        localStorage.setItem(`twentyfourseven-notes-${year}-${month}`, JSON.stringify(updatedNotes));
        setNewNote('');
      }
    }
  };

  const handleDeleteNote = (day: number, noteId: string) => {
    const dayNotes = notes[day] || [];
    const updatedDayNotes = dayNotes.filter(n => n.id !== noteId);
    
    const updatedNotes = {
      ...notes,
      [day]: updatedDayNotes
    };

    if (updatedDayNotes.length === 0) {
      delete updatedNotes[day];
    }

    setNotes(updatedNotes);
    localStorage.setItem(`twentyfourseven-notes-${year}-${month}`, JSON.stringify(updatedNotes));
  };



  // ... (stats logic) ...
  const displayStats = useMemo(() => {
    if (activeTab === 'daily' && activeCell) {
      return calculateDayStats(activeCell.year, activeCell.month, activeCell.day);
    } else if (activeTab === 'alltime') {
      return calculateAllTimeStats();
    }
    return stats;
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeCell, stats, dataVersion]);

  const totalMaxHours = useMemo(() => {
    if (activeTab === 'daily') {
      return 24;
    } else if (activeTab === 'alltime') {
      return displayStats.totalHours;
    }
    return getDaysInMonth(year, month) * 24;
  }, [activeTab, year, month, displayStats.totalHours]);

  const getTabTitle = () => {
    if (activeTab === 'daily' && activeCell) {
      const date = new Date(activeCell.year, activeCell.month, activeCell.day);
      const dayName = DAY_NAMES[date.getDay()];
      return `${dayName}, ${activeCell.day} ${MONTH_NAMES[activeCell.month]} ${activeCell.year}`;
    } else if (activeTab === 'alltime') {
      return 'All Time Statistics';
    }
    return `${MONTH_NAMES[month]} ${year}`;
  };

  useEffect(() => {
    if (mainTab !== 'statistic' || !canvasRef.current) return;
    // ... (canvas logic same as before) ...
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 90;
    let currentAngle = 0;

    const { stats: data, totalHours } = displayStats;

    categories.forEach((category) => {
      const count = data[category.key] || 0;
      if (count > 0) {
        const sliceAngle = (count / totalHours) * 2 * Math.PI;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = category.color;
        ctx.fill();
        currentAngle += sliceAngle;
      }
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#171717';
    ctx.fill();
  }, [displayStats, categories, mainTab]);

  return (
    <aside className="lg:col-span-1 p-4 rounded-xl overflow-hidden flex flex-col" style={{ background: '#171717', border: '1px solid #262626' }}>
      {/* Main Tabs */}
      <div className="flex gap-4 mb-6 flex-shrink-0">
        <button
          onClick={() => setMainTab('statistic')}
          className={`text-sm font-medium transition-colors ${mainTab === 'statistic' ? 'text-white' : 'text-[#737373] hover:text-[#a3a3a3]'}`}
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
          className={`text-sm font-medium transition-colors ${mainTab === 'notes' ? 'text-white' : 'text-[#737373] hover:text-[#a3a3a3]'}`}
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
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            {/* ... Existing Stats UI ... */}
           <div className="flex gap-1 mb-4">
            <button
              onClick={() => setActiveTab('daily')}
              className="flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider font-medium rounded-md transition-all"
              style={{
                background: activeTab === 'daily' ? '#262626' : 'transparent',
                color: activeTab === 'daily' ? '#e5e5e5' : '#737373',
                border: activeTab === 'daily' ? '1px solid #404040' : '1px solid transparent',
              }}
            >
              Daily Statistic
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className="flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider font-medium rounded-md transition-all"
              style={{
                background: activeTab === 'monthly' ? '#262626' : 'transparent',
                color: activeTab === 'monthly' ? '#e5e5e5' : '#737373',
                border: activeTab === 'monthly' ? '1px solid #404040' : '1px solid transparent',
              }}
            >
              Monthly Statistic
            </button>
            <button
              onClick={() => setActiveTab('alltime')}
              className="flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider font-medium rounded-md transition-all"
              style={{
                background: activeTab === 'alltime' ? '#262626' : 'transparent',
                color: activeTab === 'alltime' ? '#e5e5e5' : '#737373',
                border: activeTab === 'alltime' ? '1px solid #404040' : '1px solid transparent',
              }}
            >
              All Time Statistic
            </button>
          </div>

          <h2 className="text-sm font-normal mb-3 text-center" style={{ color: '#a3a3a3' }}>
            {getTabTitle()}
          </h2>

          {displayStats.totalHours > 0 ? (
            <div className="flex justify-center mb-6">
              <canvas ref={canvasRef} width="200" height="200" className="rounded-full" />
            </div>
          ) : (
            <div className="flex justify-center items-center mb-6 h-[200px]" style={{ color: '#525252' }}>
              <span className="text-xs">No data available</span>
            </div>
          )}

          <div className="space-y-3 text-xs flex-1">
            <h3 className="font-normal pb-2 mb-3" style={{ color: '#737373', borderBottom: '1px solid #262626' }}>
              Categories
            </h3>

            {categories.map((category) => {
              const count = displayStats.stats[category.key] || 0;
              const percentage =
                displayStats.totalHours > 0 ? ((count / displayStats.totalHours) * 100).toFixed(1) : 0;

              if (count === 0) return null;

              return (
                <div key={category.key} className="flex items-center justify-between py-1">
                  <div className="flex items-center">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-normal" style={{ color: '#a3a3a3' }}>
                      {category.key}: {category.name}
                    </span>
                  </div>
                  <span className="font-normal" style={{ color: '#737373' }}>
                    {count}h ({percentage}%)
                  </span>
                </div>
              );
            })}

            <div className="pt-3 mt-3 font-normal flex justify-between" style={{ borderTop: '1px solid #262626', color: '#a3a3a3' }}>
              <span>Total Activity</span>
              <span>
                {displayStats.totalHours}{activeTab !== 'alltime' ? ` / ${totalMaxHours}h` : 'h'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
           {/* Search & See All Header */}
           <div className="flex items-center justify-between mb-6 gap-3">
             <div className="relative flex-1">
               <input 
                 type="text" 
                 placeholder="Search notes..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-[#0a0a0a] border border-[#262626] focus:border-[#404040] outline-none text-xs text-[#e5e5e5] placeholder-[#525252] pl-3 py-2 rounded-lg transition-colors"
               />
             </div>
             <button 
               onClick={toggleViewAll}
               className="text-[11px] font-medium whitespace-nowrap text-[#737373] hover:text-[#e5e5e5] transition-colors"
             >
               {isViewAll ? 'Monthly Notes' : 'All Notes'}
             </button>
           </div>

           {/* Notes List */}
           <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar mb-2 pr-1">
              {filteredNotes.length === 0 ? (
                <div className="text-xs text-[#525252] italic text-center mt-10">
                  {searchQuery ? 'No notes found matching your search.' : 'No notes available.'}
                </div>
              ) : (
                filteredNotes.map((group, groupIndex) => {
                   const dayName = DAY_NAMES[group.date.getDay()];
                   const dateStr = `${dayName}, ${group.date.getDate()} ${MONTH_NAMES[group.date.getMonth()]} ${group.date.getFullYear()}`;
                   const isTodayActive = activeCell && 
                                         activeCell.year === group.date.getFullYear() &&
                                         activeCell.month === group.date.getMonth() &&
                                         activeCell.day === group.date.getDate();

                   return (
                     <div key={groupIndex} className="mb-8 last:mb-0">
                       <div 
                         onClick={() => {
                           if (!isTodayActive) {
                             setActiveCell({ 
                               year: group.date.getFullYear(), 
                               month: group.date.getMonth(), 
                               day: group.date.getDate(), 
                               hour: 0 
                             });
                             setIsViewAll(false); // Switch to day view
                           }
                         }}
                         className={`text-[13px] font-medium mb-3 ${!isTodayActive ? 'cursor-pointer hover:text-[#d4d4d4]' : ''} transition-colors flex items-center gap-2`}
                         style={{ color: isTodayActive ? '#e5e5e5' : '#737373' }}
                       >
                          {dateStr}
                          {isTodayActive && <div className="w-1.5 h-1.5 rounded-full bg-[#262626]" />}
                       </div>
                       <ul className="space-y-2">
                         {group.notes.map((note) => (
                           <li key={note.id} className="group flex items-start text-[13px] text-[#a3a3a3] leading-[14px] pl-1 hover:text-[#d4d4d4] transition-colors">
                             <span className="mr-3 mt-[5px] w-1 h-1 rounded-full bg-[#404040] flex-shrink-0 group-hover:bg-[#737373] transition-colors" />
                             <span className="flex-1 break-words whitespace-pre-wrap min-w-0 font-light">
                               {note.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) => 
                                 part.match(/(https?:\/\/[^\s]+)/g) ? (
                                   <a 
                                     key={i} 
                                     href={part} 
                                     target="_blank" 
                                     rel="noopener noreferrer" 
                                     className="text-[#e5e5e5] hover:underline"
                                     onClick={(e) => e.stopPropagation()}
                                   >
                                     {part}
                                   </a>
                                 ) : part
                               )}
                             </span>
                             {isTodayActive && (
                               <button 
                                 onClick={() => handleDeleteNote(group.date.getDate(), note.id)}
                                 className="opacity-0 group-hover:opacity-100 ml-3 text-[#525252] hover:text-[#a3a3a3] transition-all"
                                 title="Delete note"
                               >
                                 ×
                               </button>
                             )}
                           </li>
                         ))}
                       </ul>
                     </div>
                   );
                })
              )}
           </div>
           
           {/* Add Note Input - Only visible if specific day is selected and we are not in 'view all' mode (or we force focus on active cell) */}
           {activeCell && !isViewAll && (
              <div className="relative mt-auto pt-4 border-t border-[#262626]">
                <span className="absolute left-0 top-1/2 -translate-y-[calc(50%-8px)] ml-1 w-1 h-1 rounded-full bg-[#404040]" />
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={handleAddNote}
                  placeholder="Add a new note..."
                  className="w-full bg-transparent border-none outline-none text-[13px] text-[#e5e5e5] placeholder-[#525252] pl-5 py-2"
                />
              </div>
           )}
        </div>
      )}
    </aside>
  );
};
