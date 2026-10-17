import React, { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Compass, RotateCcw } from 'lucide-react';
import { useNotes as useSupabaseNotes } from '../../../hooks/useSupabaseQuery';
import { useStore } from '../../../shared/store/useStore';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const ExplorerPanel: React.FC = () => {
  const currentDate = useStore((state) => state.currentDate);
  const setCurrentDate = useStore((state) => state.setCurrentDate);
  const selectedDate = useStore((state) => state.selectedDate);
  const setSelectedDate = useStore((state) => state.setSelectedDate);
  const setMobileTab = useStore((state) => state.setMobileTab);

  // Desktop view year
  const [displayYear, setDisplayYear] = useState<number>(() => currentDate.getFullYear());

  // Mobile single-month pagination state
  const [mobileMonth, setMobileMonth] = useState<number>(() => currentDate.getMonth());
  const [mobileYear, setMobileYear] = useState<number>(() => currentDate.getFullYear());
  const [mobileAnimClass, setMobileAnimClass] = useState<'animate-slide-left' | 'animate-slide-right' | ''>('');

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const { data: serverNotes = [] } = useSupabaseNotes();

  const today = useMemo(() => new Date(), []);

  // Map of non-deleted note count per 'YYYY-M-D'
  const noteStatsByDate = useMemo(() => {
    const map = new Map<string, number>();
    serverNotes.forEach((note) => {
      if (!note.deletedAt) {
        const d = new Date(note.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        map.set(key, (map.get(key) || 0) + 1);
      }
    });
    return map;
  }, [serverNotes]);

  // Aggregate stats for current displayed year (Desktop)
  const yearStats = useMemo(() => {
    let totalNotes = 0;
    let daysWithNotes = 0;

    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(displayYear, m + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const count = noteStatsByDate.get(`${displayYear}-${m}-${d}`) || 0;
        if (count > 0) {
          totalNotes += count;
          daysWithNotes++;
        }
      }
    }

    return { totalNotes, daysWithNotes };
  }, [displayYear, noteStatsByDate]);

  // Mobile month stats
  const mobileMonthNotesCount = useMemo(() => {
    const daysInMonth = new Date(mobileYear, mobileMonth + 1, 0).getDate();
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      count += noteStatsByDate.get(`${mobileYear}-${mobileMonth}-${d}`) || 0;
    }
    return count;
  }, [mobileYear, mobileMonth, noteStatsByDate]);

  // Desktop Navigation
  const handlePrevYear = () => {
    setDisplayYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    setDisplayYear((prev) => prev + 1);
  };

  // Mobile Month Navigation
  const handlePrevMonth = () => {
    setMobileAnimClass('animate-slide-right');
    if (mobileMonth === 0) {
      setMobileMonth(11);
      setMobileYear((prev) => prev - 1);
    } else {
      setMobileMonth((prev) => prev - 1);
    }
    setTimeout(() => setMobileAnimClass(''), 300);
  };

  const handleNextMonth = () => {
    setMobileAnimClass('animate-slide-left');
    if (mobileMonth === 11) {
      setMobileMonth(0);
      setMobileYear((prev) => prev + 1);
    } else {
      setMobileMonth((prev) => prev + 1);
    }
    setTimeout(() => setMobileAnimClass(''), 300);
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setDisplayYear(now.getFullYear());
    setMobileYear(now.getFullYear());
    setMobileMonth(now.getMonth());
    setCurrentDate(now);
    setSelectedDate({
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
    });
  };

  const handleClearFilter = () => {
    setSelectedDate(null);
  };

  const handleDateClick = (year: number, month: number, day: number) => {
    setSelectedDate({ year, month, day });
    setCurrentDate(new Date(year, month, day));
    // In mobile mode, switch tab directly to Note as requested
    setMobileTab('notes');
  };

  // Touch swipe handlers for mobile month navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX.current;
    const diffY = touchEndY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX > 0) {
        handlePrevMonth();
      } else {
        handleNextMonth();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#171717]/80 backdrop-blur-md rounded-xl border border-[#262626] shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* ======================================================== */}
      {/* 1. MOBILE VIEW: Single Month with Pagination Controls     */}
      {/* ======================================================== */}
      <div
        className="flex flex-col h-full lg:hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile Header Bar */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#262626]/80 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Compass size={18} className="text-[#a3a3a3]" />
            <span className="text-sm font-playfair tracking-wide text-white">Explorer</span>
          </div>

          <div className="flex items-center gap-1.5">
            {selectedDate && (
              <button
                onClick={handleClearFilter}
                className="flex items-center gap-1 text-[10px] bg-[#242424] hover:bg-[#2c2c2c] text-[#e5e5e5] px-2 py-1 rounded-md border border-[#333] transition-all"
                title="Show all notes"
              >
                <RotateCcw size={11} />
                <span>Show All</span>
              </button>
            )}

            <button
              onClick={handleJumpToToday}
              className="flex items-center gap-1 text-[10px] bg-[#202020] hover:bg-[#282828] text-[#a3a3a3] hover:text-[#e5e5e5] px-2 py-1 rounded-md border border-[#2c2c2c] transition-all"
              title="Jump to today"
            >
              <Calendar size={11} />
              <span>Today</span>
            </button>
          </div>
        </div>

        {/* Mobile Month Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#121212]/70 border-b border-[#222222] flex-shrink-0">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg bg-[#1a1a1a] text-[#888] hover:text-white hover:bg-[#262626] border border-[#2a2a2a] transition-colors"
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-base font-playfair font-bold text-white tracking-wide">
              {MONTH_NAMES[mobileMonth]} {mobileYear}
            </span>
            <span className="text-[10px] font-mono text-[#737373] mt-0.5">
              {mobileMonthNotesCount} {mobileMonthNotesCount === 1 ? 'note' : 'notes'} this month
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg bg-[#1a1a1a] text-[#888] hover:text-white hover:bg-[#262626] border border-[#2a2a2a] transition-colors"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Mobile Month Calendar View */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-center items-center overflow-x-hidden">
          <div className="w-full max-w-sm bg-[#131313]/90 border border-[#262626] rounded-2xl p-4 shadow-xl overflow-hidden">
            <div key={`${mobileYear}-${mobileMonth}`} className={mobileAnimClass}>
              {/* Weekday Row */}
              <div className="grid grid-cols-7 gap-2 justify-items-center mb-3 pb-2 border-b border-[#222222]">
                {WEEKDAYS.map((wd, i) => (
                  <span
                    key={`${wd}-${i}`}
                    className="w-9 text-xs font-semibold text-[#666] text-center select-none"
                  >
                    {wd}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2 justify-items-center">
                {/* Empty placeholder slots */}
                {Array.from({ length: new Date(mobileYear, mobileMonth, 1).getDay() }).map((_, i) => (
                  <div
                    key={`mobile-empty-${i}`}
                    className="w-9 h-9 sm:w-10 sm:h-10 invisible pointer-events-none"
                  />
                ))}

                {/* Day Circles */}
                {Array.from({
                  length: new Date(mobileYear, mobileMonth + 1, 0).getDate()
                }).map((_, i) => {
                  const day = i + 1;
                  const dateKey = `${mobileYear}-${mobileMonth}-${day}`;
                  const noteCount = noteStatsByDate.get(dateKey) || 0;
                  const hasNotes = noteCount > 0;

                  const isSelected =
                    selectedDate?.year === mobileYear &&
                    selectedDate?.month === mobileMonth &&
                    selectedDate?.day === day;

                  const isToday =
                    today.getFullYear() === mobileYear &&
                    today.getMonth() === mobileMonth &&
                    today.getDate() === day;

                  return (
                    <button
                      key={`mobile-day-${day}`}
                      onClick={() => handleDateClick(mobileYear, mobileMonth, day)}
                      title={`${day} ${MONTH_NAMES[mobileMonth]} ${mobileYear}${hasNotes ? ` • ${noteCount} notes` : ''}`}
                      className={`w-9 h-9 sm:w-10 sm:h-10 aspect-square rounded-full flex-shrink-0 flex items-center justify-center relative select-none transition-all duration-150 active:scale-95 ${
                        hasNotes
                          ? 'bg-white text-black font-semibold shadow-[0_1px_6px_rgba(255,255,255,0.25)] hover:scale-105'
                          : 'bg-[#202020] text-[#666] border border-[#2a2a2a]/80 hover:bg-[#282828] hover:text-[#999]'
                      } ${
                        isSelected
                          ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#131313] z-10'
                          : ''
                      } ${
                        isToday && !isSelected
                          ? 'ring-1 ring-blue-400/80'
                          : ''
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-medium leading-none">
                        {day}
                      </span>

                      {/* Indication of note count */}
                      {hasNotes && (
                        <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-[#09090b] text-white text-[8px] font-mono font-bold border border-white flex items-center justify-center leading-none shadow-sm pointer-events-none">
                          {noteCount > 9 ? '9+' : noteCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#555] mt-4 text-center">
            Tap a date to view its notes. Swipe left or right to switch months.
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DESKTOP VIEW: 12-Month Calendar Grid with Year Switcher */}
      {/* ======================================================== */}
      <div className="hidden lg:flex flex-col h-full">
        {/* Desktop Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626]/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Compass size={18} className="text-[#a3a3a3]" />
              <span className="text-md font-playfair tracking-wide text-white">Explorer</span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#121212] border border-[#2a2a2a] px-2 py-0.5 rounded-lg">
              <button
                onClick={handlePrevYear}
                className="p-0.5 text-[#737373] hover:text-[#e5e5e5] hover:bg-[#262626] rounded transition-colors"
                title="Previous Year"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-mono font-semibold text-[#f5f5f5] tracking-wider px-1">
                {displayYear}
              </span>
              <button
                onClick={handleNextYear}
                className="p-0.5 text-[#737373] hover:text-[#e5e5e5] hover:bg-[#262626] rounded transition-colors"
                title="Next Year"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <span className="text-[11px] font-mono text-[#737373] bg-[#202020]/60 px-2.5 py-0.5 rounded-full border border-[#282828]">
              {yearStats.totalNotes} notes • {yearStats.daysWithNotes} active days
            </span>
          </div>

          {/* Desktop Actions & Legend */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 text-[10px] text-[#737373] mr-2">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm inline-block" />
                <span>Notes</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#202020] border border-[#2c2c2c] inline-block" />
                <span>Empty</span>
              </div>
            </div>

            {selectedDate && (
              <button
                onClick={handleClearFilter}
                className="flex items-center gap-1 text-[11px] bg-[#242424] hover:bg-[#2c2c2c] text-[#e5e5e5] px-2 py-1 rounded-md border border-[#333] transition-all"
                title="Clear selected date filter"
              >
                <RotateCcw size={12} />
                <span>Show All</span>
              </button>
            )}

            <button
              onClick={handleJumpToToday}
              className="flex items-center gap-1 text-[11px] bg-[#202020] hover:bg-[#282828] text-[#a3a3a3] hover:text-[#e5e5e5] px-2 py-1 rounded-md border border-[#2c2c2c] transition-all"
              title="Jump to today"
            >
              <Calendar size={13} />
              <span>Today</span>
            </button>
          </div>
        </div>

        {/* Desktop Calendar Months Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {MONTH_NAMES.map((monthName, monthIndex) => {
              const firstDayOfWeek = new Date(displayYear, monthIndex, 1).getDay();
              const daysInMonth = new Date(displayYear, monthIndex + 1, 0).getDate();

              let monthNotesCount = 0;
              for (let d = 1; d <= daysInMonth; d++) {
                monthNotesCount += noteStatsByDate.get(`${displayYear}-${monthIndex}-${d}`) || 0;
              }

              const isCurrentMonth =
                today.getFullYear() === displayYear && today.getMonth() === monthIndex;

              return (
                <div
                  key={`desktop-${monthName}`}
                  className={`flex flex-col bg-[#131313]/90 border rounded-xl p-3 transition-colors ${
                    isCurrentMonth
                      ? 'border-[#383838] shadow-[0_4px_20px_rgba(0,0,0,0.35)]'
                      : 'border-[#242424] hover:border-[#303030]'
                  }`}
                >
                  {/* Month Header */}
                  <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-[#222222]">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#d4d4d4] font-playfair">
                      {monthName}
                    </span>
                    {monthNotesCount > 0 && (
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/10">
                        {monthNotesCount} {monthNotesCount === 1 ? 'note' : 'notes'}
                      </span>
                    )}
                  </div>

                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-1.5 justify-items-center mb-1.5">
                    {WEEKDAYS.map((wd, i) => (
                      <span
                        key={`desktop-${wd}-${i}`}
                        className="w-7 h-4 sm:w-8 text-[10px] font-medium text-[#525252] flex items-center justify-center select-none"
                      >
                        {wd}
                      </span>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1.5 justify-items-center">
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div
                        key={`desktop-empty-${monthIndex}-${i}`}
                        className="w-7 h-7 sm:w-8 sm:h-8 invisible pointer-events-none"
                      />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateKey = `${displayYear}-${monthIndex}-${day}`;
                      const noteCount = noteStatsByDate.get(dateKey) || 0;
                      const hasNotes = noteCount > 0;

                      const isSelected =
                        selectedDate?.year === displayYear &&
                        selectedDate?.month === monthIndex &&
                        selectedDate?.day === day;

                      const isToday =
                        today.getFullYear() === displayYear &&
                        today.getMonth() === monthIndex &&
                        today.getDate() === day;

                      return (
                        <button
                          key={`desktop-${dateKey}`}
                          onClick={() => handleDateClick(displayYear, monthIndex, day)}
                          title={`${day} ${monthName} ${displayYear}${hasNotes ? ` • ${noteCount} note${noteCount > 1 ? 's' : ''}` : ' • No notes'}`}
                          className={`w-7 h-7 sm:w-8 sm:h-8 aspect-square rounded-full flex-shrink-0 flex items-center justify-center relative select-none transition-all duration-150 ${
                            hasNotes
                              ? 'bg-white text-black font-semibold shadow-[0_1px_5px_rgba(255,255,255,0.2)] hover:scale-110 hover:shadow-[0_0_12px_rgba(255,255,255,0.5)]'
                              : 'bg-[#202020] text-[#555] border border-[#2a2a2a]/80 hover:bg-[#282828] hover:text-[#999] hover:border-[#383838]'
                          } ${
                            isSelected
                              ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#131313] z-10'
                              : ''
                          } ${
                            isToday && !isSelected
                              ? 'ring-1 ring-blue-400/80'
                              : ''
                          }`}
                        >
                          <span className="text-[11px] sm:text-xs leading-none">
                            {day}
                          </span>

                          {hasNotes && (
                            <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#09090b] text-white text-[8px] font-mono font-bold border border-white flex items-center justify-center leading-none shadow-sm pointer-events-none">
                              {noteCount > 9 ? '9+' : noteCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
