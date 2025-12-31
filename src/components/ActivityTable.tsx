import { useCallback, useMemo } from 'react';
import { ActivityCell } from './ActivityCell';
import { getDaysInMonth, loadActivity } from '../utils/storage';
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
    <section className="table-section lg:col-span-3 p-4 rounded-xl" style={{ background: '#171717', border: '1px solid #262626' }}>
      <h2 className="text-base font-normal mb-3" style={{ color: '#a3a3a3' }}>Time Blocks</h2>
      <div className="table-wrapper">
        <div className="table-container">
          <table className="min-w-full text-center" onPaste={handlePaste}>
            <thead className="sticky top-0 z-10" style={{ background: '#0a0a0a' }}>
              <tr>
                <th className="hour-header border-none" style={{ background: '#0a0a0a' }}></th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                  const dayIndex = new Date(year, month, d).getDay();
                  const dayAbbrev = DAY_ABBREVIATIONS[dayIndex];
                  const today = new Date();
                  const isToday =
                    today.getFullYear() === year &&
                    today.getMonth() === month &&
                    today.getDate() === d;
                  return (
                    <th
                      key={d}
                      className={`activity-cell ${isToday ? 'font-bold animate-pulse' : ''} text-[10px] border-l font-normal`}
                      style={{ 
                        background: isToday ? '#0a0a0a' : '#0a0a0a',
                        color: isToday ? '#e5e5e5' : '#737373',
                        borderColor: '#262626'
                      }}
                    >
                      {d} <span className={`${isToday ? 'font-bold' : ''} block font-light`}>{dayAbbrev}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 24 }, (_, hour) => (
                <tr key={hour}>
                  <td className="hour-header">{hour.toString().padStart(2, '0')}:00</td>
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
                        className={`activity-cell ${isSelected ? 'cell-selected' : ''} ${isCopied && !isSelected ? 'cell-copied' : ''} ${(hour+1) % 6 === 0 ? 'border-b-gray-300 border-b-2' : ''}`}
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
