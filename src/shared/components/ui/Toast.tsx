import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Use a ref to keep track of timeouts so we can clear them if needed (though not strictly necessary for simple auto-dismiss)

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback(({ type, message, duration = 3000 }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const showSuccess = useCallback((message: string) => addToast({ type: 'success', message }), [addToast]);
  const showError = useCallback((message: string) => addToast({ type: 'error', message }), [addToast]);
  const showInfo = useCallback((message: string) => addToast({ type: 'info', message }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, showSuccess, showError, showInfo }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-md min-w-[300px] animate-in slide-in-from-bottom-2 fade-in duration-300
                ${toast.type === 'success' ? 'bg-[#1a1a1a]/90 border-green-500/30 text-green-100' : ''}
                ${toast.type === 'error' ? 'bg-[#1a1a1a]/90 border-red-500/30 text-red-100' : ''}
                ${toast.type === 'info' ? 'bg-[#1a1a1a]/90 border-blue-500/30 text-blue-100' : ''}
              `}
            >
              {toast.type === 'success' && <CheckCircle size={18} className="text-green-500 shrink-0" />}
              {toast.type === 'error' && <AlertCircle size={18} className="text-red-500 shrink-0" />}
              {toast.type === 'info' && <Info size={18} className="text-blue-500 shrink-0" />}

              <p className="text-sm font-medium flex-1">{toast.message}</p>

              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
