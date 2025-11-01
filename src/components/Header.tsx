import React from 'react';
import { MONTH_NAMES } from '../constants';

interface HeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentDate, onPrevMonth, onNextMonth }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  return (
    <header className="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-white shadow-sm rounded-2xl mb-3">
      <h1 className="text-3xl text-gray-700 mb-2 md:mb-0">247 - Time Tracker - <span className='text-gray-300'>v1.1</span></h1>

      <div className="flex items-center space-x-4">
        <button
          onClick={onPrevMonth}
          className="nav-button p-2 rounded-full transition duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-500"
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
        <span className="text-lg font-light text-gray-700 min-w-[140px] text-center">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={onNextMonth}
          className="nav-button p-2 rounded-full transition duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-500"
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
