import React, { useRef, useEffect, useState, useMemo } from 'react';
import { getDaysInMonth } from '../utils/storage';
import { useSettings } from '../store/useSettings';
import { useStore } from '../store/useStore';
import type { MonthStats } from '../types';

type StatsTab = 'daily' | 'monthly' | 'alltime';

interface StatsProps {
  stats: MonthStats;
  year: number;
  month: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const Stats: React.FC<StatsProps> = ({ stats, year, month }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const categories = useSettings((state) => state.categories);
  const activeCell = useStore((state) => state.activeCell);
  const calculateDayStats = useStore((state) => state.calculateDayStats);
  const calculateAllTimeStats = useStore((state) => state.calculateAllTimeStats);
  const dataVersion = useStore((state) => state.dataVersion);
  
  const [activeTab, setActiveTab] = useState<StatsTab>('monthly');

  // Calculate stats based on active tab
  const displayStats = useMemo(() => {
    if (activeTab === 'daily' && activeCell) {
      return calculateDayStats(activeCell.year, activeCell.month, activeCell.day);
    } else if (activeTab === 'alltime') {
      return calculateAllTimeStats();
    }
    return stats;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeCell, stats, dataVersion]);

  // Calculate max hours based on tab
  const totalMaxHours = useMemo(() => {
    if (activeTab === 'daily') {
      return 24;
    } else if (activeTab === 'alltime') {
      // All time doesn't have a max
      return displayStats.totalHours;
    }
    return getDaysInMonth(year, month) * 24;
  }, [activeTab, year, month, displayStats.totalHours]);

  // Get title based on active tab
  const getTabTitle = () => {
    if (activeTab === 'daily' && activeCell) {
      const date = new Date(activeCell.year, activeCell.month, activeCell.day);
      const dayName = DAY_NAMES[date.getDay()];
      return `${dayName}, ${activeCell.day} ${MONTH_NAMES[activeCell.month]} ${activeCell.year}`;
    } else if (activeTab === 'alltime') {
      return 'All Time Statistics';
    }
    return `${MONTH_NAMES[month]} ${year}`;
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 90;
    let currentAngle = 0;

    const { stats: data, totalHours } = displayStats;

    // Draw Pie Chart using dynamic categories
    categories.forEach((category) => {
      const count = data[category.key] || 0;
      if (count > 0) {
        const sliceAngle = (count / totalHours) * 2 * Math.PI;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = category.color;
        ctx.fill();

        currentAngle += sliceAngle;
      }
    });

    // Donut effect
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#171717';
    ctx.fill();
  }, [displayStats, categories]);

  return (
    <aside className="lg:col-span-1 p-4 rounded-xl overflow-y-auto" style={{ background: '#171717', border: '1px solid #262626' }}>
      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setActiveTab('daily')}
          className="flex-1 px-2 py-1.5 text-xs rounded-md transition-all"
          style={{
            background: activeTab === 'daily' ? '#262626' : 'transparent',
            color: activeTab === 'daily' ? '#e5e5e5' : '#737373',
            border: activeTab === 'daily' ? '1px solid #404040' : '1px solid transparent',
          }}
        >
          Daily Statistic
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className="flex-1 px-2 py-1.5 text-xs rounded-md transition-all"
          style={{
            background: activeTab === 'monthly' ? '#262626' : 'transparent',
            color: activeTab === 'monthly' ? '#e5e5e5' : '#737373',
            border: activeTab === 'monthly' ? '1px solid #404040' : '1px solid transparent',
          }}
        >
          Monthly Statistic
        </button>
        <button
          onClick={() => setActiveTab('alltime')}
          className="flex-1 px-2 py-1.5 text-xs rounded-md transition-all"
          style={{
            background: activeTab === 'alltime' ? '#262626' : 'transparent',
            color: activeTab === 'alltime' ? '#e5e5e5' : '#737373',
            border: activeTab === 'alltime' ? '1px solid #404040' : '1px solid transparent',
          }}
        >
          All Time Statistic
        </button>
      </div>

      {/* Title/Date */}
      <h2 className="text-sm font-normal mb-3 text-center" style={{ color: '#a3a3a3' }}>
        {getTabTitle()}
      </h2>

      {/* Chart */}
      {displayStats.totalHours > 0 ? (
        <div className="flex justify-center mb-6">
          <canvas ref={canvasRef} width="200" height="200" className="rounded-full" />
        </div>
      ) : (
        <div className="flex justify-center items-center mb-6 h-[200px]" style={{ color: '#525252' }}>
          <span className="text-xs">No data available</span>
        </div>
      )}

      {/* Legend */}
      <div className="space-y-3 text-xs">
        <h3 className="font-normal pb-2 mb-3" style={{ color: '#737373', borderBottom: '1px solid #262626' }}>
          Categories
        </h3>

        {categories.map((category) => {
          const count = displayStats.stats[category.key] || 0;
          const percentage =
            displayStats.totalHours > 0 ? ((count / displayStats.totalHours) * 100).toFixed(1) : 0;

          if (count === 0) return null;

          return (
            <div key={category.key} className="flex items-center justify-between py-1">
              <div className="flex items-center">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-normal" style={{ color: '#a3a3a3' }}>
                  {category.key}: {category.name}
                </span>
              </div>
              <span className="font-normal" style={{ color: '#737373' }}>
                {count}h ({percentage}%)
              </span>
            </div>
          );
        })}

        <div className="pt-3 mt-3 font-normal flex justify-between" style={{ borderTop: '1px solid #262626', color: '#a3a3a3' }}>
          <span>Total Activity</span>
          <span>
            {displayStats.totalHours}{activeTab !== 'alltime' ? ` / ${totalMaxHours}h` : 'h'}
          </span>
        </div>
      </div>
    </aside>
  );
};
