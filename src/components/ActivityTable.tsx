import { useCallback } from 'react';
import { ActivityCell } from './ActivityCell';
import { getDaysInMonth, loadActivity, getCellClass } from '../utils/storage';
import { DAY_ABBREVIATIONS } from '../constants';
import { useStore } from '../store/useStore';

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
    <section className="table-section lg:col-span-3 bg-white p-4 shadow-sm rounded-2xl">
      <h2 className="text-base mb-3 text-gray-600">Time Blocks</h2>
      <div className="table-wrapper">
        <div className="table-container">
          <table className="min-w-full text-center" onPaste={handlePaste}>
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="hour-header bg-gray-50 border-none"></th>
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
                      className={`activity-cell ${isToday ? 'bg-gray-300 text-black' : ''} text-[9px] text-gray-400 border-l border-gray-100 font-light`}
                    >
                      {d} <span className="block">{dayAbbrev}</span>
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
                    const cellClass = getCellClass(value);
                    
                    return (
                      <td
                        key={`${cellId}-${dataVersion}`}
                        className={`activity-cell ${cellClass} ${isSelected ? 'cell-selected' : ''} ${isCopied && !isSelected ? 'cell-copied' : ''} ${(hour+1) % 6 === 0 ? 'border-b-gray-300 border-b-2' : ''}`}
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
