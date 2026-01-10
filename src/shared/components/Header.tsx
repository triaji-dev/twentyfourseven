import React, { useState, useEffect, useRef } from 'react';
import { migrateLocalData } from '../utils/migration';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthProvider';

export const Header: React.FC = () => {
  const [rotation, setRotation] = useState(0);
  const { signOut, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => prev + 180);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const SUBTITLES = [
    'Accept The Quest', 'Roll For Initiative', 'Slay The Dragon', 'Update The Codex',
    'Gather Experience', 'Chart The Map', 'Loot The Treasure', 'Rest At Bonfire',
    'Equip New Skills', 'Defend The Realm', 'Cast The Spell', 'Explore The Wilds',
    'Craft Your Legend', 'Unlock Achievement', 'Face The Boss', 'Level Up Now',
    'Acquire Target', 'Execute Contract', 'Stay In Shadows', 'Secure The Asset',
    'Gather Intelligence', 'Plan The Heist', 'Clean The Scene', 'Collect The Bounty',
    'Maintain Stealth', 'Reload Weapon', 'Neutralize Threat', 'Confirm The Kill',
    'Extract Safely', 'Leave No Trace', 'Complete Mission', 'Get The Gold',
    'Walk The Path', 'Sharpen The Blade', 'Master The Craft', 'Serve No Master',
    'Honor The Code', 'Strike With Precision', 'Mind Like Water', 'Protect The Temple',
    'Endure The Storm', 'Seek Perfection', 'Conquer The Self', 'Silence The Mind',
    'Forge Your Fate', 'Stand Unshaken', 'Face The Dawn', 'Leave A Legacy'
  ];
  const [displayText, setDisplayText] = useState('');
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = SUBTITLES[subtitleIndex % SUBTITLES.length];
    let tickTime = 100;
    if (isDeleting) tickTime = 50;

    if (!isDeleting && displayText === currentText) {
      tickTime = 1000;
    } else if (isDeleting && displayText === '') {
      tickTime = 200;
    }

    const timer = setTimeout(() => {
      if (!isDeleting && displayText === currentText) {
        setIsDeleting(true);
      } else if (isDeleting && displayText === '') {
        setIsDeleting(false);
        setSubtitleIndex((prev) => prev + 1);
      } else {
        setDisplayText(prev =>
          isDeleting
            ? prev.slice(0, -1)
            : currentText.slice(0, prev.length + 1)
        );
      }
    }, tickTime);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, subtitleIndex]);

  const handleDownload = async () => {
    // 1. Collect all local storage data
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('twentyfourseven-') || key.startsWith('supabase.auth.token'))) {
        // Skip auth token to avoid session conflicts on restore
        if (key.startsWith('supabase.auth.token')) continue;
        data[key] = localStorage.getItem(key);
      }
    }

    // Fallback: Just dump LocalStorage for now as per "Migrate" workflow context.
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `247-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (confirm('Restore data from backup? This will overwrite local data and upload to server.')) {
          setIsRestoring(true);

          // 1. Restore to LocalStorage
          Object.entries(data).forEach(([key, value]) => {
            if (typeof value === 'string') {
              localStorage.setItem(key, value);
            }
          });

          // 2. Migrate to Server
          await migrateLocalData((msg) => {
            console.log(msg); // Optional: visual feedback
          });

          setIsRestoring(false);
          alert('Restore complete!');
          window.location.reload();
        }
      } catch (error) {
        console.error('Restore failed:', error);
        setIsRestoring(false);
        // Show the actual error message
        alert(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  return (
    <header
      className="flex items-center justify-between px-5 py-2 rounded-xl mb-2 relative z-[60] backdrop-blur-xl border border-[#404040]/50 shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]"
      style={{
        background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(38, 38, 38, 0.9) 100%)'
      }}
    >
      {/* Logo Section */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-12 h-12 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #000000ff 0%, #1f1f1fff 100%)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
        >
          <img
            src="/logo/247.svg"
            alt="247"
            className="w-11 h-11"
            style={{
              filter: 'brightness(0) invert(1)',
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 1000ms'
            }}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-playfair tracking-wider text-[#f5f5f5]">
            TwentyFourSeven
          </span>
          <span className="text-[10px] font-normal tracking-wider uppercase min-w-[120px] text-[#525252]">
            {displayText}
            <span className="animate-pulse ml-0.5 font-bold">|</span>
          </span>
        </div>
      </div>

      {/* User / Action Buttons */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="text-[10px] text-[#525252] hidden md:block font-mono">
            {user.user_metadata?.username || user.email?.split('@')[0]}
          </div>
        )}

        {/* Backup Button (Download) */}
        <button
          onClick={handleDownload}
          className="group relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 bg-[#262626]/60 border border-[#404040]/40 hover:bg-[#262626] hover:border-[#525252] hover:-translate-y-px"
          title="Backup Data"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#a3a3a3] group-hover:text-[#e5e5e5] transition-colors"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
        </button>

        {/* Restore Button (Upload) */}
        <button
          onClick={handleUploadClick}
          className="group relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 bg-[#262626]/60 border border-[#404040]/40 hover:bg-[#262626] hover:border-[#525252] hover:-translate-y-px"
          title="Restore Data"
          disabled={isRestoring}
        >
          {isRestoring ? (
            <div className="w-3 h-3 border-2 border-[#a3a3a3] border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#a3a3a3] group-hover:text-[#e5e5e5] transition-colors"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
          )}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />

        <button
          onClick={signOut}
          className="group relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 bg-[#262626]/60 border border-[#404040]/40 hover:bg-[#ef4444]/20 hover:border-[#ef4444]/40 hover:-translate-y-px"
          title="Sign Out"
        >
          <LogOut size={16} className="text-[#a3a3a3] group-hover:text-[#ef4444] transition-colors" />
        </button>
      </div>
    </header>
  );
};
