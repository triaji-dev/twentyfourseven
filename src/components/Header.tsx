import React, { useRef, useState, useEffect } from 'react';
import { MONTH_NAMES } from '../constants';
import { exportAllData, importAllData } from '../utils/storage';
import { useSettings } from '../store/useSettings';

interface HeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onMonthSelect: (monthIndex: number) => void;
  onYearSelect: (year: number) => void;
  onDateSelect: (date: number) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentDate, onPrevMonth, onNextMonth, onMonthSelect, onYearSelect }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openSettings = useSettings((state) => state.openSettings);
  const [rotation, setRotation] = useState(0);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const yearPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setIsMonthPickerOpen(false);
      }
      if (yearPickerRef.current && !yearPickerRef.current.contains(event.target as Node)) {
        setIsYearPickerOpen(false);
      }
      if (yearPickerRef.current && !yearPickerRef.current.contains(event.target as Node)) {
        setIsYearPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        {/* Settings Button */}
        <button
          onClick={openSettings}
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
          title="Settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 transition-transform duration-200 group-hover:rotate-45"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#a3a3a3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

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

        {/* Divider */}
        <div className="w-px h-6 mx-1" style={{ background: 'rgba(64, 64, 64, 0.6)' }} />

        {/* Month Navigation */}
        <div 
          className="flex items-center gap-1 px-2 py-1 rounded-lg"
          style={{ 
            background: 'rgba(23, 23, 23, 0.6)',
            border: '1px solid rgba(64, 64, 64, 0.3)'
          }}
        >
          <button
            onClick={onPrevMonth}
            className="flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200"
            style={{ color: '#737373' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(64, 64, 64, 0.5)';
              e.currentTarget.style.color = '#e5e5e5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#737373';
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="flex items-center relative">


            {/* Month Picker wrapper moved from parent to here for strict click outside logic if needed, or keep ref on individual */}
            <div className="relative" ref={monthPickerRef}>
              <button 
                onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                className="text-base font-playfair tracking-wide hover:text-[#a3a3a3] transition-colors"
              >
                {MONTH_NAMES[month]}
              </button>
              
              {isMonthPickerOpen && (
                <div 
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 rounded-xl grid grid-cols-3 gap-1 w-[280px] z-50 shadow-xl"
                  style={{ 
                    background: '#171717',
                    border: '1px solid #262626'
                  }}
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <button
                      key={m}
                      onClick={() => {
                        onMonthSelect(idx);
                        setIsMonthPickerOpen(false);
                      }}
                      className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                        month === idx 
                          ? 'bg-[#262626] text-white font-medium' 
                          : 'text-[#737373] hover:bg-[#262626] hover:text-[#e5e5e5]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={yearPickerRef}>
              <button 
                onClick={() => {
                  setIsYearPickerOpen(!isYearPickerOpen);
                }}
                className="text-base font-playfair tracking-wide hover:text-[#a3a3a3] transition-colors px-2 min-w-[60px]"
              >
                {year}
              </button>

              {isYearPickerOpen && (
                <div 
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-1 rounded-xl flex flex-col items-center gap-0.5 w-[80px] z-50 shadow-xl"
                  style={{ 
                    background: '#171717',
                    border: '1px solid #262626'
                  }}
                  onWheel={(e) => {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                      onYearSelect(year - 1);
                    } else {
                      onYearSelect(year + 1);
                    }
                  }}
                >
                  {/* Arrow Up */}
                  <button
                    onClick={(e) => {
                       e.stopPropagation();
                       onYearSelect(year - 1);
                    }}
                    className="w-full flex items-center justify-center py-1 text-[#525252] hover:text-[#e5e5e5] hover:bg-[#262626] rounded transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>

                  {/* Previous Year (darker) */}
                  <button
                    onClick={(e) => {
                       e.stopPropagation();
                       onYearSelect(year - 1);
                    }}
                    className="w-full py-1 text-[10px] text-center text-[#525252] hover:text-[#a3a3a3] hover:bg-[#262626] rounded transition-colors cursor-pointer"
                  >
                    {year - 1}
                  </button>

                  {/* Selected Year */}
                  <div className="w-full py-1.5 text-xs text-center font-medium text-white bg-[#262626] rounded">
                    {year}
                  </div>

                  {/* Next Year (darker) */}
                  <button
                    onClick={(e) => {
                       e.stopPropagation();
                       onYearSelect(year + 1);
                    }}
                    className="w-full py-1 text-[10px] text-center text-[#525252] hover:text-[#a3a3a3] hover:bg-[#262626] rounded transition-colors cursor-pointer"
                  >
                    {year + 1}
                  </button>

                  {/* Arrow Down */}
                  <button
                    onClick={(e) => {
                       e.stopPropagation();
                       onYearSelect(year + 1);
                    }}
                    className="w-full flex items-center justify-center py-1 text-[#525252] hover:text-[#e5e5e5] hover:bg-[#262626] rounded transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onNextMonth}
            className="flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200"
            style={{ color: '#737373' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(64, 64, 64, 0.5)';
              e.currentTarget.style.color = '#e5e5e5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#737373';
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
