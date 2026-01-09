import { Header } from './shared/components/Header';
import { ActivityTable } from './features/activity/components/ActivityTable';
import { Stats } from './features/statistic/components/Stats';
import { NotesPanel } from './features/note/components/NotesPanel';
import { SettingsModal } from './shared/components/SettingsModal';
import { useStore } from './shared/store/useStore';
import { useKeyboardShortcuts } from './shared/hooks/useKeyboardShortcuts';
import { useStats } from './features/statistic/hooks/useStats';
import './index.css';

function App() {
  const currentDate = useStore((state) => state.currentDate);
  const prevMonth = useStore((state) => state.prevMonth);
  const nextMonth = useStore((state) => state.nextMonth);
  const refreshStats = useStore((state) => state.refreshStats);
  const statsPanelMode = useStore((state) => state.statsPanelMode);
  const notesPanelMode = useStore((state) => state.notesPanelMode);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Custom hooks for keyboard shortcuts and stats
  useKeyboardShortcuts();
  const stats = useStats(year, month);



  return (
    <div className="p-2 min-h-screen lg:h-screen lg:overflow-hidden">
      <Header />

      <main className="main-container flex flex-col lg:flex-row gap-2 h-auto lg:h-[calc(100vh-80px)] overflow-y-auto lg:overflow-hidden">
        {/* Activity Table - Takes remaining space */}
        <div className="flex-1 min-w-0 min-h-[500px] lg:h-full">
          <ActivityTable
            year={year}
            month={month}
            onUpdate={refreshStats}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onMonthSelect={(monthIndex) => {
              const newDate = new Date(currentDate);
              newDate.setMonth(monthIndex);
              useStore.getState().setCurrentDate(newDate);
            }}
            onYearSelect={(selectedYear) => {
              const newDate = new Date(currentDate);
              newDate.setFullYear(selectedYear);
              useStore.getState().setCurrentDate(newDate);
            }}
          />
        </div>

        {/* Stats Panel - Fixed width or minimized */}
        <div
          className={`transition-all duration-300 ease-in-out flex-shrink-0 w-full lg:w-[var(--stats-width)] ${statsPanelMode === 'minimized' ? 'h-[48px]' : 'h-[400px] lg:min-w-[320px]'} lg:h-full`}
          style={{ '--stats-width': statsPanelMode === 'minimized' ? '48px' : '25%' } as React.CSSProperties}
        >
          <Stats stats={stats} year={year} month={month} />
        </div>

        {/* Notes Panel - Fixed width or minimized */}
        <div
          className={`transition-all duration-300 ease-in-out flex-shrink-0 w-full lg:w-[var(--notes-width)] ${notesPanelMode === 'minimized' ? 'h-[48px]' : 'h-[400px] lg:min-w-[320px]'} lg:h-full`}
          style={{ '--notes-width': notesPanelMode === 'minimized' ? '48px' : '25%' } as React.CSSProperties}
        >
          <NotesPanel year={year} month={month} />
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
}

export default App;

