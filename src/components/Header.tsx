import React, { useRef } from 'react';
import { MONTH_NAMES } from '../constants';
import { exportAllData, importAllData } from '../utils/storage';

interface HeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentDate, onPrevMonth, onNextMonth }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Reload page to refresh all data
        window.location.reload();
      },
      (error) => {
        alert(error);
      }
    );

    // Reset input value so the same file can be selected again
    e.target.value = '';
  };

  return (
    <header className="flex flex-col md:flex-row items-center justify-between px-6 py-4 rounded-xl mb-3" style={{ background: '#171717', border: '1px solid #262626' }}>
      <h1 className="text-xl font-medium mb-2 md:mb-0" style={{ color: '#e5e5e5' }}>
        247 <span className="font-light text-sm" style={{ color: '#737373' }}>Time Tracker</span>
      </h1>

      <div className="flex items-center space-x-4">
        {/* Download JSON Button */}
        <button
          onClick={handleDownload}
          className="action-button"
          title="Download JSON backup"
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span className="text-sm hidden sm:inline">Download</span>
        </button>

        {/* Upload JSON Button */}
        <button
          onClick={handleUploadClick}
          className="action-button"
          title="Upload JSON backup"
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          <span className="text-sm hidden sm:inline">Upload</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Month Navigation */}
        <button
          onClick={onPrevMonth}
          className="nav-button p-2 rounded-lg transition duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <span className="text-lg font-normal min-w-[140px] text-center" style={{ color: '#e5e5e5' }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={onNextMonth}
          className="nav-button p-2 rounded-lg transition duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </header>
  );
};
