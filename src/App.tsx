import { Header } from './shared/components/Header';
import { NotesPanel } from './features/note/components/NotesPanel';
import { ExplorerPanel } from './features/explorer/components/ExplorerPanel';
import { SettingsModal } from './shared/components/SettingsModal';
import { useStore } from './shared/store/useStore';
import './index.css';

// Auth & Query Imports
import { AuthProvider, useAuth } from './features/auth/AuthProvider';
import { AuthPage } from './features/auth/AuthPage';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ToastProvider } from './shared/components/ui/Toast';

import { Compass, FileText } from 'lucide-react';

function Dashboard() {
  const currentDate = useStore((state) => state.currentDate);
  const mobileTab = useStore((state) => state.mobileTab);
  const setMobileTab = useStore((state) => state.setMobileTab);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  return (
    <div className="min-h-[100dvh] h-[100dvh] lg:h-screen lg:overflow-hidden flex flex-col bg-[#09090b] lg:pb-2">
      <div className="flex-shrink-0 px-2 pt-2">
        <Header />
      </div>

      <main className="flex-1 overflow-hidden px-2 pb-16 lg:pb-0 lg:h-[calc(100vh-80px)] flex flex-row gap-2">
        <div
          className={`flex-1 min-w-0 h-full ${
            mobileTab === 'explorer' ? 'block' : 'hidden'
          } lg:block`}
        >
          <ExplorerPanel />
        </div>

        <div
          className={`w-full lg:w-[480px] lg:max-w-[480px] lg:flex-shrink-0 h-full ${
            mobileTab === 'notes' ? 'block' : 'hidden'
          } lg:block`}
        >
          <NotesPanel year={year} month={month} />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#121212]/95 backdrop-blur-xl border-t border-[#262626] p-1.5 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.6)]">
        <button
          onClick={() => setMobileTab('explorer')}
          className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-200 ${
            mobileTab === 'explorer'
              ? 'bg-[#262626] text-white shadow-sm border border-[#383838]'
              : 'text-[#737373] hover:text-[#a3a3a3]'
          }`}
        >
          <Compass size={18} />
          <span className="text-[11px] font-medium tracking-wide">Explorer</span>
        </button>
        <button
          onClick={() => setMobileTab('notes')}
          className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-200 ${
            mobileTab === 'notes'
              ? 'bg-[#262626] text-white shadow-sm border border-[#383838]'
              : 'text-[#737373] hover:text-[#a3a3a3]'
          }`}
        >
          <FileText size={18} />
          <span className="text-[11px] font-medium tracking-wide">Note</span>
        </button>
      </nav>

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

  return <Dashboard key={user.id} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
