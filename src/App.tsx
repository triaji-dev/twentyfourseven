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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Custom hooks for keyboard shortcuts and stats
  useKeyboardShortcuts();
  const stats = useStats(year, month);



  return (
    <div className="p-2 min-h-screen lg:h-screen lg:overflow-hidden">
      <Header />

      <main className="main-container flex gap-2 lg:overflow-hidden h-[calc(100vh-80px)]">
        {/* Activity Table - Takes remaining space */}
        <div className="flex-1 min-w-0 h-full">
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
        <div className="h-full transition-all duration-300 ease-in-out flex-shrink-0" style={{ width: useStore(s => s.statsPanelMode) === 'minimized' ? '48px' : '420px' }}>
          <Stats stats={stats} year={year} month={month} />
        </div>

        {/* Notes Panel - Fixed width or minimized */}
        <div className="h-full transition-all duration-300 ease-in-out flex-shrink-0" style={{ width: useStore(s => s.notesPanelMode) === 'minimized' ? '48px' : '420px' }}>
          <NotesPanel year={year} month={month} />
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
}

export default App;

