import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, CalendarArrowDown } from 'lucide-react';

interface DateNavigatorProps {
  date: Date;
  onDateChange: (date: Date) => void;
  className?: string;
  datesWithNotes?: Set<string>;
  children?: React.ReactNode;
  isViewAll?: boolean;
  disabled?: boolean;
  variant?: 'daily' | 'monthly';
  label?: string;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({ date, onDateChange, className, datesWithNotes, children, isViewAll, disabled, variant = 'daily', label = 'All Notes' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent header click handling
    const newDate = new Date(date);
    if (variant === 'monthly') {
      newDate.setMonth(date.getMonth() - 1);
    } else {
      newDate.setDate(date.getDate() - 1);
    }
    onDateChange(newDate);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent header click handling
    const newDate = new Date(date);
    if (variant === 'monthly') {
      newDate.setMonth(date.getMonth() + 1);
    } else {
      newDate.setDate(date.getDate() + 1);
    }
    onDateChange(newDate);
  };

  const layoutClasses = "relative flex items-center justify-between group/nav";
  const defaultStyleClasses = "bg-[#252525] border border-[#262626] rounded-lg p-1 transition-colors hover:border-[#404040]";
  const finalClassName = `${layoutClasses} ${className !== undefined ? className : defaultStyleClasses}`;

  // View All mode - simplified display
  if (isViewAll) {
    return (
      <div ref={containerRef} className={finalClassName} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center flex-1 justify-center">
          <span className="px-2 py-1 text-sm font-playfair font-medium text-[#d4d4d4]">
            {label}
          </span>
        </div>

        {children && (
          <div className="flex items-center gap-1 ml-2">
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={finalClassName} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center flex-1">
        <button
          onClick={handlePrev}
          disabled={disabled}
          className={`p-1 text-[#737373] hover:text-[#e5e5e5] hover:bg-[#262626] rounded transition-colors ${disabled ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}`}
        >
          <ChevronLeft size={16} />
        </button>

        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled || variant === 'monthly'} // Disable popup for monthly variant for now if not needed, or enable it later
          className={`flex-1 flex items-center justify-center gap-2 px-2 text-sm font-playfair font-medium transition-colors ${disabled ? 'text-[#525252] cursor-not-allowed' : 'text-[#d4d4d4] hover:text-white'}`}
        >
          {variant === 'monthly'
            ? date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })
          }
          {variant === 'daily' && (() => {
            const today = new Date();
            if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
              return (
                <span className="ml-1 px-1.5 py-0.5 rounded-md bg-[#262626] border border-[#404040] text-[8px] font-bold text-[#a3a3a3] tracking-wider uppercase">Today</span>
              );
            }
            return null;
          })()}
        </button>

        <button
          onClick={handleNext}
          disabled={disabled}
          className={`p-1 text-[#737373] hover:text-[#e5e5e5] hover:bg-[#262626] rounded transition-colors ${disabled ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}`}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {children && (
        <div className="flex items-center gap-1 ml-2">
          {children}
        </div>
      )}

      {isOpen && variant === 'daily' && (
        <div className="absolute top-full left-0 mt-2 z-50">
          <DatePicker
            selectedDate={date}
            onChange={(d) => {
              onDateChange(d);
              setIsOpen(false);
            }}
            datesWithNotes={datesWithNotes}
          />
        </div>
      )}
    </div>
  );
};

export const DatePicker = ({ selectedDate, onChange, datesWithNotes }: { selectedDate: Date, onChange: (d: Date) => void, datesWithNotes?: Set<string> }) => {
  const [viewDate, setViewDate] = useState(selectedDate);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const isToday = (d: number) => {
    const today = new Date();
    return today.getDate() === d && today.getMonth() === viewDate.getMonth() && today.getFullYear() === viewDate.getFullYear();
  };

  const isSelected = (d: number) => {
    return selectedDate.getDate() === d && selectedDate.getMonth() === viewDate.getMonth() && selectedDate.getFullYear() === viewDate.getFullYear();
  };

  const hasNotes = (d: number) => {
    if (!datesWithNotes) return false;
    const dateStr = `${viewDate.getFullYear()}-${viewDate.getMonth()}-${d}`;
    return datesWithNotes.has(dateStr);
  };

  return (
    <div className="bg-[#171717] border border-[#262626] rounded-xl p-3 shadow-xl w-[280px] translate-y-2">
      <div className="flex items-center justify-between mb-3 px-1">
        <button onClick={handlePrevMonth} className="p-1 text-[#737373] hover:text-[#e5e5e5] rounded hover:bg-[#262626]">
          <ChevronLeft size={14} />
        </button>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-[#e5e5e5]">
            {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const today = new Date();
              onChange(today);
            }}
            className="p-1 text-[#525252] hover:text-[#e5e5e5] rounded hover:bg-[#262626] transition-colors"
            title="Go to Today"
          >
            <CalendarArrowDown size={14} />
          </button>
        </div>
        <button onClick={handleNextMonth} className="p-1 text-[#737373] hover:text-[#e5e5e5] rounded hover:bg-[#262626]">
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-center text-[10px] text-[#525252] font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {blanks.map(i => (
          <div key={`blank-${i}`} className="aspect-square" />
        ))}
        {days.map(d => (
          <button
            key={d}
            onClick={(e) => {
              e.stopPropagation();
              onChange(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));
            }}
            className={`aspect-square flex flex-col items-center justify-center relative text-xs rounded-lg transition-all ${isSelected(d)
              ? 'bg-[#e5e5e5] text-[#171717] font-medium'
              : isToday(d)
                ? 'bg-[#262626] text-[#e5e5e5] border border-[#404040]'
                : 'text-[#a3a3a3] hover:bg-[#262626] hover:text-[#e5e5e5]'
              }`}
          >
            <span className="z-10">{d}</span>
            {hasNotes(d) && !isSelected(d) && (
              <span className="w-1 h-1 rounded-full bg-[#f7f7f7] absolute bottom-1" />
            )}
            {hasNotes(d) && isSelected(d) && (
              <span className="w-1 h-1 rounded-full bg-[#171717] absolute bottom-1 opacity-50" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
