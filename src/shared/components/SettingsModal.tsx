import React, { useState } from 'react';
import { useSettings as useSettingsStore } from '../store/useSettings';
import { X, Database } from 'lucide-react';
import { migrateLocalData } from '../utils/migration';

export const SettingsModal: React.FC = () => {
  // UI State from Zustand
  const isOpen = useSettingsStore((state) => state.isSettingsOpen);
  const closeSettings = useSettingsStore((state) => state.closeSettings);

  const [migrationStatus, setMigrationStatus] = useState<string>('');

  const handleClose = () => {
    closeSettings();
  };

  const handleMigrate = async () => {
    if (confirm('Migrate all local data to Supabase? This may take a while.')) {
      setMigrationStatus('Starting migration...');
      try {
        await migrateLocalData((msg) => setMigrationStatus(msg));
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (e) {
        setMigrationStatus('Migration Failed.');
        console.error(e);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-6"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[340px] bg-[#0a0a0a] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#0a0a0a]">
          <h2 className="text-sm font-medium tracking-tight text-[#e5e5e5]">
            Settings
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-[#525252] hover:text-[#e5e5e5] hover:bg-[#262626] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-5 pt-1">
          {/* Migration Section */}
          <div className="mt-2 text-center">
            <p className="text-xs text-[#a3a3a3] mb-4">
              Move your data from this device to the cloud.
            </p>
            <button
              onClick={handleMigrate}
              disabled={!!migrationStatus}
              className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-xs font-medium bg-[#262626] text-[#a3a3a3] hover:text-[#e5e5e5] hover:bg-[#404040] transition-colors disabled:opacity-50"
            >
              <Database size={14} />
              {migrationStatus ? migrationStatus : 'Migrate Local to Cloud'}
            </button>
            {migrationStatus && (
              <div className="text-[10px] text-[#525252] text-center mt-2">
                {migrationStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
