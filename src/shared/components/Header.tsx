import React, { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthProvider';
import { useSettings as useSettingsStore } from '../store/useSettings';
import { LogOut, Settings } from 'lucide-react';

export const Header: React.FC = () => {
  const [rotation, setRotation] = useState(0);
  const { signOut, user } = useAuth();
  const openSettings = useSettingsStore(state => state.openSettings);

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
        <button
          onClick={openSettings}
          className="group relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 bg-[#262626]/60 border border-[#404040]/40 hover:bg-[#262626] hover:border-[#525252] hover:-translate-y-px"
          title="Settings"
        >
          <Settings size={16} className="text-[#a3a3a3] group-hover:text-[#e5e5e5] transition-colors" />
        </button>
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
