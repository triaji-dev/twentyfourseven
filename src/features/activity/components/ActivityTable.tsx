import { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import { PaintBucket, Check, Plus } from 'lucide-react';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { ActivityCell } from './ActivityCell';
import { DAY_ABBREVIATIONS, MONTH_NAMES } from '../../../shared/constants';
import { useStore } from '../../../shared/store/useStore';
// Use React Query hooks instead of local store/storage
import { useActivities, useUpdateActivity, useSettings, useUpdateSettings, useNotes } from '../../../hooks/useSupabaseQuery';
import { DEFAULT_CATEGORIES, ActivityKey, DynamicCategory } from '../../../shared/types';

interface ActivityTableProps {
  year: number;
  month: number;
  onUpdate: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onMonthSelect: (monthIndex: number) => void;
  onYearSelect: (year: number) => void;
}

export const ActivityTable: React.FC<ActivityTableProps> = ({
  year,
  month,
  onUpdate,
  onPrevMonth,
  onNextMonth,
  onMonthSelect,
  onYearSelect
}) => {
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const yearPickerRef = useRef<HTMLDivElement>(null);

  // Zustand State (Client UI State)
  const selectedCells = useStore((state) => state.selectedCells);
  const copiedCellIds = useStore((state) => state.copiedCellIds);
  const dataVersion = useStore((state) => state.dataVersion);
  const isSelecting = useStore((state) => state.isSelecting);
  const selectionStart = useStore((state) => state.selectionStart);
  const setIsSelecting = useStore((state) => state.setIsSelecting);
  const setSelectionStart = useStore((state) => state.setSelectionStart);
  const toggleCellSelection = useStore((state) => state.toggleCellSelection);
  const clearSelection = useStore((state) => state.clearSelection);
  const selectRectangle = useStore((state) => state.selectRectangle);
  const activeCell = useStore((state) => state.activeCell);
  const setActiveCell = useStore((state) => state.setActiveCell);

  // React Query Hooks (Server State)
  const { data: activities = [], isLoading } = useActivities(year, month);
  const updateActivityMutation = useUpdateActivity();
  const { data: settings } = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  const { data: notes = [] } = useNotes();

  const categories: DynamicCategory[] = settings?.categories || DEFAULT_CATEGORIES;

  // Category UI State
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [editingCategoryKey, setEditingCategoryKey] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  // unused: const [deletingCategoryKey, setDeletingCategoryKey] = useState<string | null>(null);

  // Create a map for faster lookup
  const activityMap = useMemo(() => {
    const map: Record<string, string> = {};
    activities.forEach(a => {
      const day = parseInt(a.date.split('-')[2]); // Parse day from YYYY-MM-DD
      map[`${day}-${a.hour}`] = a.value;
    });
    return map;
  }, [activities]);

  // Create category map for colors
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(cat => {
      map[cat.key] = cat.color;
    });
    return map;
  }, [categories]);

  // Note dots map
  const notesMap = useMemo(() => {
    const map: Record<number, boolean> = {};
    notes.forEach(note => {
      const d = new Date(note.createdAt);
      if (d.getFullYear() === year && d.getMonth() === month && !note.deletedAt && !note.isDone) {
        // Show dot for active notes? Or all notes? 
        // Original code used getNotes() which returns array. Length > 0 shows dot.
        // Assuming getNotes returned all active notes.
        map[d.getDate()] = true;
      }
    });
    return map;
  }, [notes, year, month]);

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);

  const handleSaveActivity = useCallback((day: number, hour: number, value: ActivityKey) => {
    updateActivityMutation.mutate({ year, month, day, hour, value });
    onUpdate(); // Trigger stats refresh if needed (though Query should handle it)
  }, [updateActivityMutation, year, month, onUpdate]);

  const handleUpdateCategories = (newCategories: typeof categories) => {
    updateSettingsMutation.mutate(newCategories);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsSelecting(false);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setIsMonthPickerOpen(false);
      }
      if (yearPickerRef.current && !yearPickerRef.current.contains(event.target as Node)) {
        setIsYearPickerOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
        setEditingCategoryKey(null);
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [setIsSelecting]);

  const handleCellMouseDown = useCallback(
    (e: React.MouseEvent, day: number, hour: number) => {
      const cellId = `cell-${year}-${month + 1}-${day}-${hour}`;

      if (e.shiftKey && selectionStart) {
        e.preventDefault();
        selectRectangle(selectionStart, { year, month, day, hour });
      } else if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        toggleCellSelection(cellId);
        if (!selectionStart) {
          setSelectionStart({ year, month, day, hour });
        }
      } else {
        clearSelection();
        setSelectionStart({ year, month, day, hour });
        toggleCellSelection(cellId);
        setIsSelecting(true);
      }
    },
    [selectionStart, year, month, selectRectangle, toggleCellSelection, setSelectionStart, clearSelection, setIsSelecting]
  );

  const handleCellMouseEnter = useCallback(
    (e: React.MouseEvent, day: number, hour: number) => {
      if (isSelecting && e.buttons === 1 && selectionStart) {
        e.preventDefault();
        selectRectangle(selectionStart, { year, month, day, hour });
      }
    },
    [isSelecting, selectionStart, year, month, selectRectangle]
  );

  const handleCellFocus = useCallback(() => {
    if (!isSelecting) {
      // Optional: clear selection on focus if not selecting
    }
  }, [isSelecting]);

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text/plain');
    useStore.getState().pasteToSelection(text);
    e.preventDefault();
  };

  return (
    <section className="table-section p-2 lg:col-span-3 rounded-xl bg-[#171717] border border-[#262626]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-md font-playfair tracking-wider pl-2 text-white">Activity</h2>
          <div className="relative" ref={categoryDropdownRef}>
            <button
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="group flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200 hover:bg-[#262626]"
              title="Category Colors"
            >
              <PaintBucket size={14} className="text-[#525252] group-hover:text-[#a3a3a3] transition-colors" />
            </button>

            {isCategoryDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-2 w-[280px] bg-[#0a0a0a] border border-[#262626] rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-3 border-b border-[#262626]">
                  <h3 className="text-[10px] font-semibold text-[#525252] uppercase tracking-[0.15em]">
                    Category Colors
                  </h3>
                </div>
                <div className="p-3 space-y-1">
                  {categories.map((category) => (
                    <div
                      key={category.key}
                      className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-[#171717] group/row"
                    >
                      <div className="relative w-4 h-4 shrink-0 rounded-full border border-white/10 cursor-pointer">
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <input
                          type="color"
                          value={category.color}
                          onChange={(e) => {
                            const newCategories = categories.map(cat =>
                              cat.key === category.key ? { ...cat, color: e.target.value } : cat
                            );
                            handleUpdateCategories(newCategories);
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <span className="w-5 h-5 flex items-center justify-center rounded bg-[#171717] border border-[#262626] text-[10px] font-bold text-[#737373]">
                        {category.name.charAt(0).toUpperCase()}
                      </span>
                      {editingCategoryKey === category.key ? (() => {
                        const newKey = editingName.trim().charAt(0).toUpperCase();
                        const isDuplicate = !!(editingName.trim() && categories.some(cat =>
                          cat.key !== category.key && cat.name.charAt(0).toUpperCase() === newKey
                        ));
                        return (
                          <div className="flex-1 flex items-center gap-1 min-w-0">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isDuplicate) {
                                  const newName = editingName.trim();
                                  if (newName) {
                                    // TODO: Implement server-side migration for key change
                                    // migrateActivityKey(oldKey, newKey);
                                    const newCategories = categories.map(cat =>
                                      cat.key === category.key ? { ...cat, name: newName, key: newKey } : cat
                                    );
                                    handleUpdateCategories(newCategories);
                                  }
                                  setEditingCategoryKey(null);
                                } else if (e.key === 'Escape') {
                                  setEditingCategoryKey(null);
                                }
                              }}
                              onBlur={() => setEditingCategoryKey(null)}
                              className={`flex-1 min-w-0 bg-[#0a0a0a] border rounded px-2 py-0.5 text-xs text-[#e5e5e5] outline-none ${isDuplicate ? 'border-red-500/50 text-red-400' : 'border-[#404040] focus:border-[#525252]'}`}
                              autoFocus
                            />
                            {isDuplicate && (
                              <span className="text-[9px] text-red-400 shrink-0" title="Duplicate initial">!</span>
                            )}
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault();
                                if (isDuplicate) return;
                                const newName = editingName.trim();
                                if (newName) {
                                  // TODO: Implement server-side migration
                                  const newCategories = categories.map(cat =>
                                    cat.key === category.key ? { ...cat, name: newName, key: newKey } : cat
                                  );
                                  handleUpdateCategories(newCategories);
                                }
                                setEditingCategoryKey(null);
                              }}
                              disabled={isDuplicate}
                              className={`p-1 shrink-0 transition-colors ${isDuplicate ? 'text-[#404040] cursor-not-allowed' : 'text-[#525252] hover:text-[#22c55e]'}`}
                            >
                              <Check size={12} />
                            </button>
                          </div>
                        );
                      })() : (
                        <>
                          <span
                            className="flex-1 text-xs text-[#a3a3a3] cursor-pointer select-none py-1"
                            onDoubleClick={() => {
                              setEditingCategoryKey(category.key);
                              setEditingName(category.name);
                            }}
                            title="Double-click to edit"
                          >
                            {category.name}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {categories.length < 10 ? (
                  <div className="px-3 pb-3 pt-1">
                    <button
                      onClick={() => {
                        const usedKeys = new Set(categories.map(c => c.name.charAt(0).toUpperCase()));
                        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                        let newName = 'New';
                        for (const letter of alphabet) {
                          if (!usedKeys.has(letter)) {
                            newName = letter + ' Category';
                            break;
                          }
                        }
                        const newKey = newName.charAt(0).toUpperCase();
                        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
                        const newColor = colors[categories.length % colors.length];
                        handleUpdateCategories([...categories, { key: newKey, name: newName, color: newColor }]);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[10px] font-medium text-[#525252] hover:text-[#a3a3a3] hover:bg-[#171717] border border-dashed border-[#404040] hover:border-[#525252] transition-all"
                    >
                      <Plus size={12} />
                      Add Category
                    </button>
                  </div>
                ) : (
                  <div className="px-3 pb-3 pt-1">
                    <p className="text-[9px] text-[#404040] text-center">Maximum 10 categories</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#171717]/60 border border-[#404040]/30">
          <button
            onClick={onPrevMonth}
            className="flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200 text-[#737373] hover:bg-[#404040]/50 hover:text-[#e5e5e5]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center relative">
            <div className="relative" ref={monthPickerRef}>
              <button
                onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                className="text-sm font-playfair tracking-wide hover:text-[#a3a3a3] transition-colors min-w-[75px] text-center text-[#e5e5e5]"
              >
                {MONTH_NAMES[month]}
              </button>
              {isMonthPickerOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 rounded-xl grid grid-cols-3 gap-1 w-[280px] z-50 shadow-xl bg-[#171717] border border-[#262626]">
                  {MONTH_NAMES.map((m, idx) => (
                    <button
                      key={m}
                      onClick={() => {
                        onMonthSelect(idx);
                        setIsMonthPickerOpen(false);
                      }}
                      className={`px-3 py-2 text-xs rounded-lg transition-colors ${month === idx ? 'bg-[#262626] text-white font-medium' : 'text-[#737373] hover:bg-[#262626] hover:text-[#e5e5e5]'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={yearPickerRef}>
              <button
                onClick={() => setIsYearPickerOpen(!isYearPickerOpen)}
                className="text-sm font-playfair tracking-wide hover:text-[#a3a3a3] transition-colors px-2 min-w-[50px] text-[#e5e5e5]"
              >
                {year}
              </button>
              {isYearPickerOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-1 rounded-xl flex flex-col items-center gap-0.5 w-[70px] z-50 shadow-xl bg-[#171717] border border-[#262626]"
                  onWheel={(e) => {
                    e.preventDefault();
                    if (e.deltaY < 0) onYearSelect(year - 1);
                    else onYearSelect(year + 1);
                  }}
                >
                  <button onClick={(e) => { e.stopPropagation(); onYearSelect(year - 1); }} className="w-full flex items-center justify-center py-1.5 text-[#525252] hover:text-[#e5e5e5] hover:bg-[#262626] rounded transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <div className="w-full py-1.5 text-xs text-center font-medium text-white bg-[#262626] rounded">{year}</div>
                  <button onClick={(e) => { e.stopPropagation(); onYearSelect(year + 1); }} className="w-full flex items-center justify-center py-1.5 text-[#525252] hover:text-[#e5e5e5] hover:bg-[#262626] rounded transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <button onClick={onNextMonth} className="flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200 text-[#737373] hover:bg-[#404040]/50 hover:text-[#e5e5e5]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-container !overflow-x-auto custom-scrollbar">
          <table className="min-w-[800px] text-center" onPaste={handlePaste}>
            <thead className="sticky top-0 z-10 bg-[#0a0a0a]">
              <tr className="h-5">
                <th className="hour-header border-none bg-[#0a0a0a] sticky left-0 z-30"></th>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                  const isInvalid = d > daysInMonth;
                  const today = new Date();
                  const isToday = !isInvalid && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
                  const isActiveDate = !isInvalid && activeCell?.year === year && activeCell?.month === month && activeCell?.day === d;
                  const hasNote = !isInvalid && notesMap[d];

                  return (
                    <th
                      key={`date-${d}`}
                      onClick={() => !isInvalid && setActiveCell({ year, month, day: d, hour: 0 })}
                      className={`activity-cell relative pt-3 ${isInvalid ? 'opacity-20 pointer-events-none' : ''} ${isToday ? 'font-bold text-white' : 'text-[#737373]'} ${isActiveDate ? 'bg-[#1a1a1a] text-[#e5e5e5]' : 'bg-[#0a0a0a]'} text-[10px] border-l border-[#262626] font-normal border-b-0 ${!isInvalid ? 'cursor-pointer hover:bg-[#1a1a1a]' : ''} transition-colors`}
                    >
                      {!isInvalid && d}
                      {hasNote && <span className="absolute top-[3px] left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-[#a3a3a3]"></span>}
                    </th>
                  );
                })}
              </tr>
              <tr className="h-5">
                <th className="hour-header border-none bg-[#0a0a0a] sticky left-0 z-30"></th>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                  const isInvalid = d > daysInMonth;
                  const dayIndex = isInvalid ? 0 : new Date(year, month, d).getDay();
                  const dayAbbrev = DAY_ABBREVIATIONS[dayIndex];
                  const today = new Date();
                  const isToday = !isInvalid && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
                  const isActiveDate = !isInvalid && activeCell?.year === year && activeCell?.month === month && activeCell?.day === d;

                  return (
                    <th
                      key={`day-${d}`}
                      className={`activity-cell ${isInvalid ? 'opacity-20 pointer-events-none' : ''} ${isToday ? 'font-bold text-white' : 'text-[#525252]'} ${isActiveDate ? 'bg-[#1a1a1a] text-[#e5e5e5]' : 'bg-[#0a0a0a]'} text-[8px] border-l border-[#262626] font-light border-t-0 ${!isInvalid ? 'cursor-pointer hover:bg-[#1a1a1a]' : ''} transition-colors`}
                    >
                      {!isInvalid && dayAbbrev}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 24 }, (_, hour) => (
                <tr key={hour}>
                  <td className="hour-header sticky left-0 z-20 bg-[#171717]">{hour.toString().padStart(2, '0')}</td>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                    const isInvalid = day > daysInMonth;
                    const value = isInvalid ? '' : (activityMap[`${day}-${hour}`] || '');
                    const cellId = `cell-${year}-${month + 1}-${day}-${hour}`;
                    const isSelected = !isInvalid && selectedCells.has(cellId);
                    const isCopied = !isInvalid && copiedCellIds.has(cellId);
                    const cellColor = isInvalid ? undefined : categoryMap[value];

                    const cellStyle: React.CSSProperties = isInvalid
                      ? { backgroundColor: '#0d0d0d', opacity: 0.3, pointerEvents: 'none' }
                      : cellColor
                        ? { backgroundColor: cellColor, color: '#ffffff', boxShadow: `0 0 0 1px ${cellColor}33` }
                        : { backgroundColor: '#171717', color: '#525252' };

                    if (isLoading && !isInvalid) {
                      return (
                        <td
                          key={`cell-${year}-${month + 1}-${day}-${hour}-loading`}
                          className={`activity-cell ${(hour + 1) % 6 === 0 ? 'border-b-gray-700/50 border-b' : ''} bg-[#171717] p-[1px]`}
                        >
                          <Skeleton className="w-full h-full rounded-[1px] opacity-10" />
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`${cellId}-${dataVersion}`}
                        className={`activity-cell ${isSelected ? 'cell-selected' : ''} ${isCopied && !isSelected ? 'cell-copied' : ''} ${(hour + 1) % 6 === 0 ? 'border-b-gray-700 border-b-2' : ''}`}
                        style={cellStyle}
                        onMouseDown={e => !isInvalid && handleCellMouseDown(e, day, hour)}
                      >
                        {!isInvalid && (
                          <ActivityCell
                            year={year}
                            month={month}
                            day={day}
                            hour={hour}
                            value={value}
                            onMouseEnter={e => handleCellMouseEnter(e, day, hour)}
                            onFocus={handleCellFocus}
                            onChange={() => { }} // No longer needed for triggering save, but maybe for something else? kept empty.
                            onSave={(val) => handleSaveActivity(day, hour, val)}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
