import { Header } from './components/Header';
import { ActivityTable } from './components/ActivityTable';
import { Stats } from './components/Stats';
import { SettingsModal } from './components/SettingsModal';
import { useStore } from './store/useStore';
import { useKeyboardShortcuts, useStats } from './hooks';
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
    <div className="p-3 h-screen overflow-hidden">
      <Header
        currentDate={currentDate}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
      />

      <main className="main-container grid grid-cols-1 lg:grid-cols-4 gap-3">
        <ActivityTable year={year} month={month} onUpdate={refreshStats} />
        <Stats stats={stats} year={year} month={month} />
      </main>

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
}

export default App;

