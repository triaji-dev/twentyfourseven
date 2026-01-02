import React, { useRef } from 'react';
import { MONTH_NAMES } from '../constants';
import { exportAllData, importAllData } from '../utils/storage';
import { useSettings } from '../store/useSettings';

interface HeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentDate, onPrevMonth, onNextMonth }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openSettings = useSettings((state) => state.openSettings);

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
      className="flex items-center justify-between px-5 py-2 rounded-xl mb-2"
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
          className="flex items-center justify-center w-12 h-12 rounded-lg"
          style={{ 
            background: 'linear-gradient(135deg, #000000ff 0%, #1f1f1fff 100%)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
        >
          <img src="/logo/247.svg" alt="247" className="w-11 h-11" style={{ filter: 'brightness(0) invert(1)' }} />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-medium tracking-tight" style={{ color: '#f5f5f5' }}>
            TwentyFourSeven
          </span>
          <span className="text-[10px] font-normal tracking-wider uppercase" style={{ color: '#525252' }}>
            SelfTracker
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

          <div className="flex items-center gap-2 px-3">
            <span 
              className="text-sm font-medium min-w-[90px] text-center"
              style={{ color: '#f5f5f5' }}
            >
              {MONTH_NAMES[month]}
            </span>
            <span 
              className="text-xs font-normal px-2 py-0.5 rounded"
              style={{ 
                background: 'rgba(64, 64, 64, 0.5)',
                color: '#a3a3a3'
              }}
            >
              {year}
            </span>
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
