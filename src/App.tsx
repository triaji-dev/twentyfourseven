import { Header } from './shared/components/Header';
import { NotesPanel } from './features/note/components/NotesPanel';
import { SettingsModal } from './shared/components/SettingsModal';
import { useStore } from './shared/store/useStore';
import './index.css';

// Auth & Query Imports
import { AuthProvider, useAuth } from './features/auth/AuthProvider';
import { AuthPage } from './features/auth/AuthPage';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ToastProvider } from './shared/components/ui/Toast';

function Dashboard() {
  const currentDate = useStore((state) => state.currentDate);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  return (
    <div className="min-h-[100dvh] h-[100dvh] lg:h-screen lg:overflow-hidden flex flex-col bg-[#09090b] lg:pb-2">
      <div className="flex-shrink-0 px-2 pt-2">
        <Header />
      </div>

      <main className="flex-1 overflow-hidden px-2 lg:h-[calc(100vh-80px)]">
        <NotesPanel year={year} month={month} />
      </main>

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
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
