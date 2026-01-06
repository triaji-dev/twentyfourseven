import React, { useRef, useState, useEffect } from 'react';
import { exportAllData, importAllData } from '../utils/storage';

export const Header: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => prev + 180);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const SUBTITLES = [
    'Accept The Quest',
    'Roll For Initiative',
    'Slay The Dragon',
    'Update The Codex',
    'Gather Experience',
    'Chart The Map',
    'Loot The Treasure',
    'Rest At Bonfire',
    'Equip New Skills',
    'Defend The Realm',
    'Cast The Spell',
    'Explore The Wilds',
    'Craft Your Legend',
    'Unlock Achievement',
    'Face The Boss',
    'Level Up Now',
    'Acquire Target',
    'Execute Contract',
    'Stay In Shadows',
    'Secure The Asset',
    'Gather Intelligence',
    'Plan The Heist',
    'Clean The Scene',
    'Collect The Bounty',
    'Maintain Stealth',
    'Reload Weapon',
    'Neutralize Threat',
    'Confirm The Kill',
    'Extract Safely',
    'Leave No Trace',
    'Complete Mission',
    'Get The Gold',
    'Walk The Path',
    'Sharpen The Blade',
    'Master The Craft',
    'Serve No Master',
    'Honor The Code',
    'Strike With Precision',
    'Mind Like Water',
    'Protect The Temple',
    'Endure The Storm',
    'Seek Perfection',
    'Conquer The Self',
    'Silence The Mind',
    'Forge Your Fate',
    'Stand Unshaken',
    'Face The Dawn',
    'Leave A Legacy'
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

  const handleDownload = () => {
    exportAllData();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importAllData(
      file,
      () => {
        window.location.reload();
      },
      (error) => {
        alert(error);
      }
    );

    e.target.value = '';
  };

  return (
    <header
      className="flex items-center justify-between px-5 py-2 rounded-xl mb-2 relative z-[60]"
      style={{
        background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(38, 38, 38, 0.9) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(64, 64, 64, 0.5)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
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
          <span className="text-xl font-playfair tracking-wider" style={{ color: '#f5f5f5' }}>
            TwentyFourSeven
          </span>
          <span className="text-[10px] font-normal tracking-wider uppercase min-w-[120px]" style={{ color: '#525252' }}>
            {displayText}
            <span className="animate-pulse ml-0.5 font-bold">|</span>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="group relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200"
          style={{
            background: 'rgba(38, 38, 38, 0.6)',
            border: '1px solid rgba(64, 64, 64, 0.4)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(64, 64, 64, 0.8)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(38, 38, 38, 0.6)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          title="Download Backup"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#a3a3a3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </button>

        {/* Upload Button */}
        <button
          onClick={handleUploadClick}
          className="group relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200"
          style={{
            background: 'rgba(38, 38, 38, 0.6)',
            border: '1px solid rgba(64, 64, 64, 0.4)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(64, 64, 64, 0.8)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(38, 38, 38, 0.6)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          title="Upload Backup"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#a3a3a3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </header>
  );
};
