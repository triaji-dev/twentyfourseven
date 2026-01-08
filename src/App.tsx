import { Header } from './shared/components/Header';
import { ActivityTable } from './features/activity/components/ActivityTable';
import { Stats } from './features/statistic/components/Stats';
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

      <main className="main-container grid grid-cols-1 lg:grid-cols-4 gap-2">
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
        <Stats stats={stats} year={year} month={month} />
      </main>

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
}

export default App;

