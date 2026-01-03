import React, { useRef, useEffect, useState, useMemo } from 'react';
import { getDaysInMonth } from '../utils/storage';
import { useSettings } from '../store/useSettings';
import { useStore } from '../store/useStore';
import type { MonthStats } from '../types';
import { X, Type, CheckSquare, AlertCircle, Link as LinkIcon, MoreHorizontal } from 'lucide-react';

type NoteType = 'text' | 'link' | 'todo' | 'important';

const NOTE_TYPES: Record<NoteType, { color: string; label: string; icon: any }> = {
  text: { color: '#a3a3a3', label: 'Text', icon: Type },
  link: { color: '#a0c4ff', label: 'Link', icon: LinkIcon },
  todo: { color: '#fdffb6', label: 'Todo', icon: CheckSquare },
  important: { color: '#f87171', label: 'Important', icon: AlertCircle }
};

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



const processNoteContent = (content: string, currentType?: NoteType): { type: NoteType; content: string } => {
  let newType = currentType;
  let cleanContent = content;

  // 1. Check for Prefixes (Highest priority for explicit intent)
  if (/^todo\s/i.test(content)) {
    newType = 'todo';
    cleanContent = content.replace(/^todo\s/i, '');
  } else if (/^!\s?/.test(content)) {
    newType = 'important';
    cleanContent = content.replace(/^!\s?/, '');
  } else {
    // No explicit prefix found.
    // Preservative logic: If current type is todo/important, keep it.
    // Only auto-switch between text/link if current is text/link/undefined.
    if (!newType || newType === 'text' || newType === 'link') {
      const hasLink = /((?:https?:\/\/|www\.)[^\s]+)/.test(content);
      newType = hasLink ? 'link' : 'text';
    }
  }
  
  return { type: newType as NoteType, content: cleanContent };
};

export const Stats: React.FC<StatsProps> = ({ stats, year, month }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialRender = useRef(true);
  const lastMouseDownRef = useRef<{ x: number; y: number } | null>(null);
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
    type?: NoteType;
    isDone?: boolean;
    color?: string; // Legacy
  }

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    visible: boolean;
    category?: string;
    hours?: number;
    percentage?: string;
    color?: string;
  }>({ x: 0, y: 0, visible: false });

  const [activeTab, setActiveTab] = useState<StatsTab>('monthly');
  const [mainTab, setMainTab] = useState<'statistic' | 'notes'>('statistic');
  
  // Notes state: Map day -> NoteItem[]
  const [notes, setNotes] = useState<Record<number, NoteItem[]>>({});
  const [newNote, setNewNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [allTimeNotes, setAllTimeNotes] = useState<Array<{ date: Date; notes: NoteItem[] }>>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [isViewAll, setIsViewAll] = useState(true);
  const [draggedNote, setDraggedNote] = useState<{ id: string; date: Date } | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);
  
  // Actions
  const setActiveCell = useStore((state) => state.setActiveCell);
  const triggerUpdate = useStore((state) => state.triggerUpdate);

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
                  const items = (dayNotes as NoteItem[]).map(note => {
                      const { type, content } = processNoteContent(note.content, note.type);
                      return { ...note, type, content };
                  });
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
          // Apply auto-detection for links
          const processed = { ...parsed };
          Object.keys(processed).forEach(key => {
             const day = parseInt(key);
             if (Array.isArray(processed[day])) {
                  processed[day] = processed[day].map((note: NoteItem) => {
                       const { type, content } = processNoteContent(note.content, note.type);
                       return { ...note, type, content };
                  });
             }
          });
          setNotes(processed);
        }
      } catch (e) {
        setNotes({});
      }
    } else {
      setNotes({});
    }
  }, [year, month]);

  // Load all notes initially

  useEffect(() => {
    setAllTimeNotes(fetchAllNotes());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOpenId) {
        const target = event.target as HTMLElement;
        if (!target.closest(`[data-picker-id="${menuOpenId}"]`)) {
          setMenuOpenId(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpenId]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    if (activeCell) {
      setIsViewAll(false);
    }
  }, [activeCell]);

  // ... handleAddNote same ...
  // ... handleDeleteNote same ...
  
  // Filtered Notes Logic
  const getFilteredNotes = () => {
    let result: Array<{ date: Date; notes: NoteItem[] }> = [];

    if (activeCell && !isViewAll) {
       if (activeCell.year === year && activeCell.month === month) {
           const dayNotes = notes[activeCell.day] || [];
           if (dayNotes.length > 0) {
             result = [{
               date: new Date(year, month, activeCell.day),
               notes: dayNotes
             }];
           }
       } else {
           result = allTimeNotes.filter(item => 
              item.date.getFullYear() === activeCell.year &&
              item.date.getMonth() === activeCell.month &&
              item.date.getDate() === activeCell.day
           );
       }
    } else {
      result = allTimeNotes;
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
  const handleAddNote = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey && newNote.trim() && activeCell) {
      e.preventDefault();
      const day = activeCell.day;
      const targetYear = activeCell.year;
      const targetMonth = activeCell.month;
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
        const newItems: NoteItem[] = entries.map(entryContent => {
          const { type, content } = processNoteContent(entryContent);
          return {
            id: Math.random().toString(36).substr(2, 9),
            content, // Use cleaned content (without prefix)
            createdAt: new Date().toISOString(),
            type
          };
        });

        const key = `twentyfourseven-notes-${targetYear}-${targetMonth}`;
        let currentMonthNotes: Record<number, NoteItem[]> = {};

        // If target matches current view, use state. Otherwise load from storage.
        if (targetYear === year && targetMonth === month) {
             currentMonthNotes = { ...notes };
        } else {
             try {
                const saved = localStorage.getItem(key);
                currentMonthNotes = saved ? JSON.parse(saved) : {};
             } catch(e) {
                currentMonthNotes = {};
             }
        }

        const updatedNotes = {
          ...currentMonthNotes,
          [day]: [...(currentMonthNotes[day] || []), ...newItems]
        };
        
        localStorage.setItem(key, JSON.stringify(updatedNotes));
        
        if (targetYear === year && targetMonth === month) {
            setNotes(updatedNotes);
        }

        setNewNote('');
        setAllTimeNotes(fetchAllNotes());
        triggerUpdate();
        
        // Reset textarea height
        if (e.target instanceof HTMLTextAreaElement) {
            e.target.style.height = 'auto';
        }
      }
    }
  };

  const handleStartEdit = (note: NoteItem) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = (date: Date, noteId: string) => {
    if (!editContent.trim()) {
      setEditingId(null);
      return;
    }
    
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const key = `twentyfourseven-notes-${y}-${m}`;
    
    let monthNotes: Record<number, NoteItem[]> = {};
    try {
        const saved = localStorage.getItem(key);
        monthNotes = saved ? JSON.parse(saved) : {};
    } catch(e) {
        monthNotes = {};
    }
    
    const dayNotes = monthNotes[d] || [];
    const updatedDayNotes = dayNotes.map((n: NoteItem) => {
        if (n.id === noteId) {
            const { type, content } = processNoteContent(editContent, n.type);
            return { ...n, content, type };
        }
        return n;
    });
    
    const updatedMonthNotes = { ...monthNotes, [d]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedMonthNotes));
    
    if (y === year && m === month) {
        setNotes(updatedMonthNotes);
    } 
    
    
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
    
    setEditingId(null);
  };

  const handleUpdateNoteType = (date: Date, noteId: string, type: NoteType) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const key = `twentyfourseven-notes-${y}-${m}`;
    
    let monthNotes: Record<number, NoteItem[]> = {};
    try {
        const saved = localStorage.getItem(key);
        monthNotes = saved ? JSON.parse(saved) : {};
    } catch(e) {
        monthNotes = {};
    }
    
    const dayNotes = monthNotes[d] || [];
    const updatedDayNotes = dayNotes.map((n: NoteItem) => n.id === noteId ? { ...n, type } : n);
    
    const updatedMonthNotes = { ...monthNotes, [d]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedMonthNotes));
    
    if (y === year && m === month) {
        setNotes(updatedMonthNotes);
    } 
    
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
    
    setMenuOpenId(null);
  };

  const handleToggleTodo = (date: Date, noteId: string) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const key = `twentyfourseven-notes-${y}-${m}`;
    
    let monthNotes: Record<number, NoteItem[]> = {};
    try {
        const saved = localStorage.getItem(key);
        monthNotes = saved ? JSON.parse(saved) : {};
    } catch(e) {
        monthNotes = {};
    }
    
    const dayNotes = monthNotes[d] || [];
    const updatedDayNotes = dayNotes.map((n: NoteItem) => n.id === noteId ? { ...n, isDone: !n.isDone } : n);
    const updatedMonthNotes = { ...monthNotes, [d]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedMonthNotes));
    
    if (y === year && m === month) {
        setNotes(updatedMonthNotes);
    } 
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  };

  const handleDeleteNote = (date: Date, noteId: string) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const key = `twentyfourseven-notes-${y}-${m}`;

    let monthNotes: Record<number, NoteItem[]> = {};
    
    // If target matches current view, use state. Otherwise load from storage.
    if (y === year && m === month) {
         monthNotes = { ...notes };
    } else {
         try {
            const saved = localStorage.getItem(key);
            monthNotes = saved ? JSON.parse(saved) : {};
         } catch(e) {
            monthNotes = {};
         }
    }

    const dayNotes = monthNotes[d] || [];
    const updatedDayNotes = dayNotes.filter(n => n.id !== noteId);
    
    const updatedNotes = {
      ...monthNotes,
      [d]: updatedDayNotes
    };

    if (updatedDayNotes.length === 0) {
      delete updatedNotes[d];
    }

    localStorage.setItem(key, JSON.stringify(updatedNotes));

    if (y === year && m === month) {
      setNotes(updatedNotes);
    }
    
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  };

  const handleReorderNotes = (date: Date, fromId: string, toId: string) => {
    if (fromId === toId) return;
    
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const key = `twentyfourseven-notes-${y}-${m}`;

    let monthNotes: Record<number, NoteItem[]> = {};
    
    if (y === year && m === month) {
         monthNotes = { ...notes };
    } else {
         try {
            const saved = localStorage.getItem(key);
            monthNotes = saved ? JSON.parse(saved) : {};
         } catch(e) {
            monthNotes = {};
         }
    }

    const dayNotes = [...(monthNotes[d] || [])];
    const fromIndex = dayNotes.findIndex(n => n.id === fromId);
    const toIndex = dayNotes.findIndex(n => n.id === toId);
    
    if (fromIndex === -1 || toIndex === -1) return;
    
    // Remove and reinsert
    const [movedNote] = dayNotes.splice(fromIndex, 1);
    dayNotes.splice(toIndex, 0, movedNote);
    
    const updatedNotes = {
      ...monthNotes,
      [d]: dayNotes
    };

    localStorage.setItem(key, JSON.stringify(updatedNotes));

    if (y === year && m === month) {
      setNotes(updatedNotes);
    }
    
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
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
    const outerRadius = 90;
    const innerRadius = 65;
    let currentAngle = -0.5 * Math.PI; // Start from top

    const { stats: data, totalHours } = displayStats;

    categories.forEach((category) => {
      const count = data[category.key] || 0;
      if (count > 0) {
        const sliceAngle = (count / totalHours) * 2 * Math.PI;
        
        ctx.beginPath();
        // Create donut segment path
        ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle, false);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        
        ctx.fillStyle = category.color;
        ctx.fill();
        
        // Segment separation
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#171717';
        ctx.stroke();
        
        currentAngle += sliceAngle;
      }
    });
    
    // Center Text
    if (totalHours > 0) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Total Hours
        ctx.font = '600 24px sans-serif';
        ctx.fillStyle = '#e5e5e5';
        ctx.fillText(totalHours.toString(), centerX, centerY - 8);
        
        // Label
        ctx.font = '400 10px sans-serif';
        ctx.fillStyle = '#737373';
        ctx.fillText('HOURS', centerX, centerY + 10);
    }
  }, [displayStats, categories, mainTab]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Donut chart inner/outer radius check (65-90)
    if (distance < 65 || distance > 90) {
      setTooltip(prev => ({ ...prev, visible: false }));
      return;
    }
    
    const rawAngle = Math.atan2(dy, dx);
    let angle = rawAngle + Math.PI / 2; // Adjust for Top start
    if (angle < 0) angle += 2 * Math.PI;
    
    let currentStartAngle = 0;
    const { stats: data, totalHours } = displayStats;
    let found = false;

    for (const category of categories) {
      const count = data[category.key] || 0;
      if (count > 0) {
        const sliceAngle = (count / totalHours) * 2 * Math.PI;
        
        if (angle >= currentStartAngle && angle < currentStartAngle + sliceAngle) {
          setTooltip({
            x: e.clientX,
            y: e.clientY,
            visible: true,
            category: category.name,
            hours: count,
            percentage: ((count / totalHours) * 100).toFixed(1),
            color: category.color
          });
          found = true;
          break;
        }
        currentStartAngle += sliceAngle;
      }
    }
    
    if (!found) {
        setTooltip(prev => ({ ...prev, visible: false }));
    }
  };

  const handleCanvasMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

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
        <div className="flex flex-col flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-1">
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
            <div className="flex justify-center mb-6 relative">
              <canvas 
                ref={canvasRef} 
                width="200" 
                height="200" 
                className="rounded-full cursor-crosshair"
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
              />
              {tooltip.visible && (
                <div 
                  className="fixed z-50 px-3 py-2 bg-[#171717] border border-[#262626] rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-8px]"
                  style={{ top: tooltip.y, left: tooltip.x }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tooltip.color }} />
                    <span className="text-xs font-medium text-[#e5e5e5] whitespace-nowrap">{tooltip.category}</span>
                  </div>
                  <div className="text-[10px] text-[#a3a3a3]">
                    {tooltip.hours}h <span className="mx-1">•</span> {tooltip.percentage}%
                  </div>
                </div>
              )}
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
                <div key={category.key} className="relative py-1.5 px-2 rounded-md overflow-hidden group hover:bg-[#1a1a1a] transition-colors">
                  {/* Bar Chart Background */}
                  <div 
                    className="absolute top-0 left-0 bottom-0 bg-[#404040] transition-all duration-500 ease-out"
                    style={{ 
                      width: `${percentage}%`,
                      opacity: 0.4
                    }}
                  />
                  
                  {/* Content */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full mr-2 shadow-sm"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-normal" style={{ color: '#d4d4d4' }}>
                         {category.name}
                      </span>
                    </div>
                    <span className="font-medium font-mono" style={{ color: '#737373' }}>
                      {count}h <span className="text-[#404040] mx-1">/</span> {percentage}%
                    </span>
                  </div>
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
        <div className="flex flex-col flex-1 min-h-0">
           {/* Search & See All Header */}
              <div className="flex items-center justify-between mb-6 gap-3">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder="Filter notes..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#262626] focus:border-[#404040] outline-none text-xs text-[#e5e5e5] placeholder-[#525252] pl-3 h-8 rounded-lg transition-colors"
                  />
                </div>
                {activeCell && (
                  <button
                    onClick={() => setIsViewAll(!isViewAll)}
                    className={`h-8 flex items-center justify-center whitespace-nowrap px-3 text-xs font-medium rounded-lg transition-colors border ${
                      isViewAll 
                        ? 'bg-[#404040] text-[#e5e5e5] border-[#404040]' 
                        : 'bg-transparent text-[#737373] border-[#262626] hover:text-[#e5e5e5] hover:border-[#404040]'
                    }`}
                  >
                    {isViewAll ? 'View Day' : 'View All'}
                  </button>
                )}
              </div>

           {/* Notes List */}
           <div className="flex flex-col flex-1 overflow-y-auto min-h-0 custom-scrollbar mb-2 pr-3">
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

                     <div 
                       key={groupIndex} 
                       className={`${isViewAll ? 'mb-4 p-3 rounded-xl border border-[#262626] bg-[#1c1c1c]' : 'mb-8 last:mb-0'}`}
                     >
                       <div 
                         onClick={() => {
                           if (isViewAll) {
                               setIsViewAll(false);
                           }
                           if (!isTodayActive) {
                             setActiveCell({ 
                               year: group.date.getFullYear(), 
                               month: group.date.getMonth(), 
                               day: group.date.getDate(), 
                               hour: 0 
                             });
                           }
                         }}
                         className={`text-[13px] font-medium mb-3 ${!isTodayActive || isViewAll ? 'cursor-pointer group/date' : ''} transition-all flex items-center justify-between gap-2`}
                         style={{ color: isTodayActive ? '#e5e5e5' : '#737373' }}
                       >
                          <span className={`${!isTodayActive || isViewAll ? 'group-hover/date:text-[#e5e5e5]' : ''} transition-colors`}>
                            {dateStr}
                          </span>
                          {isTodayActive && <div className="w-1.5 h-1.5 rounded-full bg-[#262626]" />}
                          {isViewAll && (
                            <span className="text-[10px] text-[#525252] opacity-0 group-hover/date:opacity-100 transition-opacity uppercase tracking-wider">
                              Open Day
                            </span>
                          )}
                       </div>
                       <ul className={`space-y-${isViewAll ? '0.5' : '2.5'}`}>
                         {(isViewAll ? group.notes.slice(0, 3) : group.notes).map((note) => (
                           <li 
                             key={note.id}
                              draggable={isTodayActive && !isViewAll && editingId !== note.id ? true : undefined} 
                              onDragStart={(e) => {
                                if (!isTodayActive || isViewAll) return;
                                setDraggedNote({ id: note.id, date: group.date });
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragEnd={() => {
                                setDraggedNote(null);
                                setDragOverNoteId(null);
                              }}
                              onDragOver={(e) => {
                                if (!draggedNote || draggedNote.date.getTime() !== group.date.getTime()) return;
                                e.preventDefault();
                                setDragOverNoteId(note.id);
                              }}
                              onDragLeave={() => setDragOverNoteId(null)}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (draggedNote && draggedNote.date.getTime() === group.date.getTime()) {
                                  handleReorderNotes(group.date, draggedNote.id, note.id);
                                }
                                setDraggedNote(null);
                                setDragOverNoteId(null);
                              }}
                             onMouseDown={(e) => {
                               lastMouseDownRef.current = { x: e.clientX, y: e.clientY };
                             }}
                             onClick={(e) => {
                                const selection = window.getSelection();
                                if (selection && selection.toString().length > 0) {
                                  return;
                                }
                                
                                // Drag detection
                                if (lastMouseDownRef.current) {
                                  const dx = Math.abs(e.clientX - lastMouseDownRef.current.x);
                                  const dy = Math.abs(e.clientY - lastMouseDownRef.current.y);
                                  if (dx > 10 || dy > 10) return;
                                }

                                if (isViewAll) {
                                   setIsViewAll(false);
                                   setActiveCell({ 
                                     year: group.date.getFullYear(), 
                                     month: group.date.getMonth(), 
                                     day: group.date.getDate(), 
                                     hour: 0 
                                   });
                                }
                              }}
                             className={`group flex flex-col relative text-[11px] leading-5 pl-1 transition-all ${isViewAll ? 'cursor-pointer hover:bg-[#262626]/50 rounded px-1 -ml-1 py-0.5' : ''} ${isTodayActive && !isViewAll ? 'cursor-grab active:cursor-grabbing' : ''} ${dragOverNoteId === note.id ? 'border-t border-[#525252]' : ''}`}
                           >
                             <div className="flex items-start gap-2 w-full">
                               <span 
                                 className={`flex-shrink-0 mt-[7px] transition-colors cursor-pointer ${
                                   note.type === 'todo' 
                                     ? 'w-1.5 h-1.5 border rounded-[1px]' 
                                     : 'w-1.5 h-1.5 rounded-full'
                                 }`}
                                 style={{ 
                                   backgroundColor: note.type === 'todo' 
                                      ? (note.isDone ? NOTE_TYPES.todo.color : 'transparent') 
                                      : (note.type ? NOTE_TYPES[note.type].color : NOTE_TYPES.text.color),
                                   borderColor: note.type === 'todo' ? NOTE_TYPES.todo.color : 'transparent',
                                 }}
                                 onClick={(e) => {
                                    if (isTodayActive) {
                                      e.stopPropagation();
                                      handleToggleTodo(group.date, note.id);
                                    }
                                 }}
                               />
                               
                               {editingId === note.id ? (
                                  <textarea 
                                    autoFocus
                                    value={editContent}
                                    style={{ color: note.type ? NOTE_TYPES[note.type].color : NOTE_TYPES.text.color }}
                                    onChange={(e) => {
                                      setEditContent(e.target.value);
                                      e.target.style.height = 'auto';
                                      e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                    onFocus={(e) => {
                                      e.target.style.height = 'auto';
                                      e.target.style.height = e.target.scrollHeight + 'px';
                                      e.target.setSelectionRange(e.target.value.length, e.target.value.length);
                                    }}
                                    onBlur={() => handleSaveEdit(group.date, note.id)}
                                    onKeyDown={(e) => {
                                      e.stopPropagation();
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSaveEdit(group.date, note.id);
                                      }
                                    }}
                                    className="flex-1 bg-[#1a1a1a] border-b border-[#404040] outline-none min-w-0 font-light resize-none overflow-hidden leading-5 text-[11px] py-0 block"
                                    rows={1}
                                  />
                               ) : (
                                   <span 
                                     className={`flex-1 break-words whitespace-pre-wrap min-w-0 font-light select-text cursor-text ${note.isDone ? 'line-through opacity-50' : ''}`}
                                     style={{ color: note.type ? NOTE_TYPES[note.type].color : NOTE_TYPES.text.color }}
                                     onDoubleClick={() => isTodayActive && handleStartEdit(note)}
                                   >
                                     {note.content.split(/((?:https?:\/\/|www\.)[^\s]+)/g).map((part, i) => 
                                       part.match(/((?:https?:\/\/|www\.)[^\s]+)/g) ? (
                                         <a 
                                           key={i} 
                                           href={part.startsWith('www.') ? `http://${part}` : part} 
                                           target="_blank" 
                                           rel="noopener noreferrer" 
                                           className="hover:underline" // Removed explicit color to inherit parent color
                                           style={{ color: 'inherit' }} 
                                           onClick={(e) => e.stopPropagation()}
                                         >
                                           {part}
                                         </a>
                                       ) : part
                                     )}
                                   </span>
                               )}

                               {isTodayActive && editingId !== note.id && (
                                   <div className={`flex items-center gap-1 h-5 transition-opacity ${menuOpenId === note.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <div className="relative flex items-center" data-picker-id={note.id}>
                                     <button 
                                       onClick={() => setMenuOpenId(menuOpenId === note.id ? null : note.id)}
                                       className="text-[#525252] hover:text-[#e5e5e5] px-1 flex items-center justify-center h-full"
                                       title="Change type"
                                     >
                                       <MoreHorizontal size={14} />
                                     </button>
                                     
                                     {/* Dropdown Type Picker */}
                                     {menuOpenId === note.id && (
                                       <div className="absolute right-0 top-6 w-[140px] bg-[#171717] border border-[#262626] rounded-xl p-2 shadow-xl z-50 flex flex-col gap-1">
                                          {(Object.keys(NOTE_TYPES) as NoteType[])
                                            .filter(t => t !== 'link')
                                            .map((type) => {
                                            const config = NOTE_TYPES[type];
                                            const Icon = config.icon;
                                            return (
                                              <button
                                                key={type}
                                                onClick={() => handleUpdateNoteType(group.date, note.id, type)}
                                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#262626] transition-colors text-xs text-left w-full"
                                                style={{ color: config.color }}
                                              >
                                                <Icon size={14} />
                                                <span>{config.label}</span>
                                              </button>
                                            );
                                          })}
                                       </div>
                                     )}
                                   </div>
                                   <button 
                                     onClick={() => handleDeleteNote(group.date, note.id)}
                                     className="text-[#525252] hover:text-[#ef4444] px-1 flex items-center justify-center h-full"
                                     title="Delete note"
                                   >
                                     <X size={14} />
                                   </button>
                                 </div>
                               )}
                             </div>
                             

                           </li>
                         ))}
                         {isViewAll && group.notes.length > 3 && (
                           <li 
                             onClick={() => {
                                setIsViewAll(false);
                                setActiveCell({ 
                                  year: group.date.getFullYear(), 
                                  month: group.date.getMonth(), 
                                  day: group.date.getDate(), 
                                  hour: 0 
                                });
                             }}
                             className="pl-1 text-xs text-[#525252] italic cursor-pointer hover:text-[#e5e5e5] transition-colors"
                           >
                             + {group.notes.length - 3} more notes...
                           </li>
                         )}
                       </ul>
                     </div>
                   );
                })
              )}
           </div>
           
           {/* Add Note Input - Only visible if specific day is selected and we are not in 'view all' mode (or we force focus on active cell) */}
           {activeCell && !isViewAll && (
              <div className="relative flex-shrink-0 pt-4 border-t border-[#262626]">
                <span className="absolute left-0 top-[33px] ml-1 w-1 h-1 rounded-full bg-[#404040]" />
                <textarea
                  value={newNote}
                  rows={1}
                  onChange={(e) => {
                    setNewNote(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={handleAddNote}
                  placeholder="Add a new note..."
                  className="w-full bg-transparent border-none outline-none text-[13px] text-[#e5e5e5] placeholder-[#525252] pl-5 py-2 resize-none overflow-y-auto custom-scrollbar block"
                  style={{ minHeight: '36px', maxHeight: '120px' }}
                />
              </div>
           )}
        </div>
      )}
    </aside>
  );
};
