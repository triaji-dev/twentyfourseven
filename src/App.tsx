import { Header } from './shared/components/Header';
import { ActivityTable } from './features/activity/components/ActivityTable';
import { Stats } from './features/statistic/components/Stats';
import { NotesPanel } from './features/note/components/NotesPanel';
import { SettingsModal } from './shared/components/SettingsModal';
import { useStore } from './shared/store/useStore';
import { useKeyboardShortcuts } from './shared/hooks/useKeyboardShortcuts';
import { useStats } from './features/statistic/hooks/useStats';
import './index.css';
import { useState, useEffect } from 'react';

// Auth & Query Imports
import { AuthProvider, useAuth } from './features/auth/AuthProvider';
import { AuthPage } from './features/auth/AuthPage';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

function Dashboard() {
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

  // Mobile State
  const [activeMobileTab, setActiveMobileTab] = useState<'activity' | 'stats' | 'notes'>('activity');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-[100dvh] h-[100dvh] lg:h-screen lg:overflow-hidden flex flex-col bg-[#09090b]">
      <div className="flex-shrink-0 px-2 pt-2">
        <Header />
      </div>

      <main className="flex-1 relative overflow-hidden lg:flex lg:flex-row lg:gap-2 lg:h-[calc(100vh-80px)] lg:pb-0 px-2">
        {/* Activity Table */}
        <div
          className={`transition-all duration-300 
            ${isMobile
              ? `absolute inset-0 overflow-y-auto pb-20 px-2 ${activeMobileTab === 'activity' ? 'z-10 bg-[#09090b]' : 'z-0 opacity-0 pointer-events-none'}`
              : 'lg:h-full lg:flex-1'
            }`}
        >
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

        {/* Stats Panel */}
        <div
          className={`transition-all duration-300 ease-in-out lg:flex-shrink-0 lg:w-[var(--stats-width)]
            ${isMobile
              ? `absolute inset-0 overflow-y-auto pb-20 px-2 ${activeMobileTab === 'stats' ? 'z-10 bg-[#09090b]' : 'z-0 opacity-0 pointer-events-none'}`
              : `${statsPanelMode === 'minimized' ? 'h-[48px]' : 'h-[400px] lg:min-w-[320px]'} lg:h-full`
            }`}
          style={{ '--stats-width': statsPanelMode === 'minimized' ? '48px' : '25%' } as React.CSSProperties}
        >
          <Stats stats={stats} year={year} month={month} />
        </div>

        {/* Notes Panel */}
        <div
          className={`transition-all duration-300 ease-in-out lg:flex-shrink-0 lg:w-[var(--notes-width)]
            ${isMobile
              ? `absolute inset-0 overflow-y-auto pb-20 px-2 ${activeMobileTab === 'notes' ? 'z-10 bg-[#09090b]' : 'z-0 opacity-0 pointer-events-none'}`
              : `${notesPanelMode === 'minimized' ? 'h-[48px]' : 'h-[400px] lg:min-w-[320px]'} lg:h-full`
            }`}
          style={{ '--notes-width': notesPanelMode === 'minimized' ? '48px' : '25%' } as React.CSSProperties}
        >
          <NotesPanel year={year} month={month} />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#09090b]/90 backdrop-blur-xl border-t border-[#262626] p-2 flex justify-around z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <button
          onClick={() => setActiveMobileTab('activity')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${activeMobileTab === 'activity' ? 'bg-[#262626] text-[#e5e5e5]' : 'text-[#525252] hover:text-[#a3a3a3]'}`}
        >
          <span className="text-xs font-playfair font-bold tracking-widest uppercase">Activity</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('stats')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${activeMobileTab === 'stats' ? 'bg-[#262626] text-[#e5e5e5]' : 'text-[#525252] hover:text-[#a3a3a3]'}`}
        >
          <span className="text-xs font-playfair font-bold tracking-widest uppercase">Stats</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('notes')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${activeMobileTab === 'notes' ? 'bg-[#262626] text-[#e5e5e5]' : 'text-[#525252] hover:text-[#a3a3a3]'}`}
        >
          <span className="text-xs font-playfair font-bold tracking-widest uppercase">Notes</span>
        </button>
      </div>

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
