import { useCallback, useMemo, useEffect } from 'react';
import { ActivityCell } from './ActivityCell';
import { getDaysInMonth, loadActivity, getNotes } from '../utils/storage';
import { DAY_ABBREVIATIONS } from '../constants';
import { useStore } from '../store/useStore';
import { useSettings } from '../store/useSettings';
interface ActivityTableProps {
  year: number;
  month: number;
  onUpdate: () => void;
}

export const ActivityTable: React.FC<ActivityTableProps> = ({ year, month, onUpdate }) => {
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
  const categories = useSettings((state) => state.categories);
  
  // Create a map for faster category lookup
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(cat => {
      map[cat.key] = cat.color;
    });
    return map;
  }, [categories]);
  
  const daysInMonth = getDaysInMonth(year, month);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsSelecting(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
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
        // Don't prevent default on simple click - allow input focus for typing
        // e.preventDefault(); // REMOVED
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

  // Keyboard handlers would be added at App level for global scope

const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text/plain');
    useStore.getState().pasteToSelection(text);
    e.preventDefault();
  };

  return (
    <section className="table-section p-4 lg:col-span-3 p-2 rounded-xl" style={{ background: '#171717', border: '1px solid #262626' }}>
      <h2 className="text-md font-playfair tracking-wider mb-2" style={{ color: '#a3a3a3' }}>Activity Tracker</h2>
      <div className="table-wrapper">
        <div className="table-container">
          <table className="min-w-full text-center" onPaste={handlePaste}>
            <thead className="sticky top-0 z-10" style={{ background: '#0a0a0a' }}>
              {/* Date Row */}
              <tr style={{ height: '20px' }}>
                <th className="hour-header border-none" style={{ background: '#0a0a0a' }}></th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                  const today = new Date();
                  const isToday =
                    today.getFullYear() === year &&
                    today.getMonth() === month &&
                    today.getDate() === d;
                  const isActiveDate = activeCell?.year === year && activeCell?.month === month && activeCell?.day === d;
                  
                  return (
                    <th
                      key={`date-${d}`}
                      className={`activity-cell relative pt-3 ${isToday ? 'font-bold text-white' : 'text-[#737373]'} ${isActiveDate ? 'bg-[#1a1a1a] text-[#e5e5e5]' : ''} text-[10px] border-l font-normal border-b-0 cursor-pointer hover:bg-[#1a1a1a] transition-colors`}
                      onClick={() => setActiveCell({ year, month, day: d, hour: 0 })}
                      style={{ 
                        background: isActiveDate ? '#1a1a1a' : '#0a0a0a',
                        borderColor: '#262626'
                      }}
                    >
                      {d}
                      {getNotes(year, month, d).length > 0 && (
                        <span className="absolute top-[3px] left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-[#a3a3a3]"></span>
                      )}
                    </th>
                  );
                })}
              </tr>
              {/* Day Initial Row */}
              <tr style={{ height: '20px' }}>
                <th className="hour-header border-none" style={{ background: '#0a0a0a' }}></th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                  const dayIndex = new Date(year, month, d).getDay();
                  const dayAbbrev = DAY_ABBREVIATIONS[dayIndex];
                  const today = new Date();
                  const isToday =
                    today.getFullYear() === year &&
                    today.getMonth() === month &&
                    today.getDate() === d;
                  const isActiveDate = activeCell?.year === year && activeCell?.month === month && activeCell?.day === d;
                  
                  return (
                    <th
                      key={`day-${d}`}
                      className={`activity-cell ${isToday ? 'font-bold text-white' : 'text-[#525252]'} ${isActiveDate ? 'bg-[#1a1a1a] text-[#e5e5e5]' : ''} text-[8px] border-l font-light border-t-0 cursor-pointer hover:bg-[#1a1a1a] transition-colors`}
                      onClick={() => setActiveCell({ year, month, day: d, hour: 0 })}
                      style={{ 
                        background: isActiveDate ? '#1a1a1a' : '#0a0a0a',
                        borderColor: '#262626'
                      }}
                    >
                      {dayAbbrev}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 24 }, (_, hour) => (
                <tr key={hour}>
                  <td className="hour-header">{hour.toString().padStart(2, '0')}</td>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const value = loadActivity(year, month, day, hour);
                    const cellId = `cell-${year}-${month + 1}-${day}-${hour}`;
                    const isSelected = selectedCells.has(cellId);
                    const isCopied = copiedCellIds.has(cellId);
                    const cellColor = categoryMap[value];
                    
                    // Dynamic style based on category color
                    const cellStyle: React.CSSProperties = cellColor
                      ? {
                          backgroundColor: cellColor,
                          color: '#ffffff',
                          boxShadow: `0 0 0 1px ${cellColor}33`,
                        }
                      : {
                          backgroundColor: '#171717',
                          color: '#525252',
                        };
                    
                    return (
                      <td
                        key={`${cellId}-${dataVersion}`}
                        className={`activity-cell ${isSelected ? 'cell-selected' : ''} ${isCopied && !isSelected ? 'cell-copied' : ''} ${(hour+1) % 6 === 0 ? 'border-b-gray-700 border-b-2' : ''}`}
                        style={cellStyle}
                        onMouseDown={e => handleCellMouseDown(e, day, hour)}
                      >
                        <ActivityCell
                          year={year}
                          month={month}
                          day={day}
                          hour={hour}
                          value={value}
                          onMouseEnter={e => handleCellMouseEnter(e, day, hour)}
                          onFocus={handleCellFocus}
                          onChange={onUpdate}
                        />
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
