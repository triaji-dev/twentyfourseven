import React, { useRef, useEffect, useState, useMemo } from 'react';
import { getDaysInMonth } from '../../../shared/utils/storage';
import { useSettings } from '../../../shared/store/useSettings';
import { useStore } from '../../../shared/store/useStore';
import type { MonthStats } from '../../../shared/types';
import { DateNavigator } from '../../../shared/components/DateNavigator';

type StatsTab = 'daily' | 'monthly' | 'alltime';

interface StatisticProps {
  stats: MonthStats;
  year: number;
  month: number;
  allTimeStats: MonthStats;
  allActivities: any[]; // using any for now to avoid extensive type imports, or import ActivityRecord
}



export const Statistic: React.FC<StatisticProps> = ({ stats, year, month, allTimeStats, allActivities }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const categories = useSettings((state) => state.categories);
  const activeCell = useStore((state) => state.activeStatsDate);
  // const calculateDayStats = useStore((state) => state.calculateDayStats); // Removed

  const dataVersion = useStore((state) => state.dataVersion);

  const [activeTab, setActiveTab] = useState<StatsTab>('daily');
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    visible: boolean;
    category?: string;
    hours?: number;
    percentage?: string;
    color?: string;
  }>({ x: 0, y: 0, visible: false });

  const displayStats = useMemo(() => {
    if (activeTab === 'daily' && activeCell) {
      // Calculate daily stats from allActivities
      const dayStats: Record<string, number> = {};
      let dayTotalHours = 0;

      if (allActivities) {
        const targetDateStr = `${activeCell.year}-${String(activeCell.month + 1).padStart(2, '0')}-${String(activeCell.day).padStart(2, '0')}`;

        allActivities.forEach((a: any) => {
          if (a.date === targetDateStr) {
            const val = a.value?.trim();
            if (val && /^[A-Z]$/.test(val)) {
              dayStats[val] = (dayStats[val] || 0) + 1;
              dayTotalHours++;
            }
          }
        });
      }
      return { stats: dayStats, totalHours: dayTotalHours };

    } else if (activeTab === 'alltime') {
      return allTimeStats;
    }
    return stats;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeCell, stats, allTimeStats, dataVersion, allActivities]);

  useEffect(() => {
    setActiveTab('daily');
  }, [activeCell]);

  const totalMaxHours = useMemo(() => {
    if (activeTab === 'daily') {
      return 24;
    } else if (activeTab === 'alltime') {
      return allTimeStats.totalHours;
    }
    return getDaysInMonth(year, month) * 24;
  }, [activeTab, year, month, displayStats.totalHours, allTimeStats]);



  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = 90;
    const innerRadius = 65;
    let currentAngle = -0.5 * Math.PI; // Start from top

    const { stats: data, totalHours } = displayStats;

    categories.forEach((category) => {
      const count = data[category.key] || 0;
      if (count > 0) {
        const sliceAngle = (count / totalHours) * 2 * Math.PI;

        ctx.beginPath();
        // Create donut segment path
        ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle, false);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();

        ctx.fillStyle = category.color;
        ctx.fill();

        // Segment separation
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#171717';
        ctx.stroke();

        currentAngle += sliceAngle;
      }
    });

    // Center Text
    if (totalHours > 0) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Total Hours
      ctx.font = '600 24px sans-serif';
      ctx.fillStyle = '#e5e5e5';
      ctx.fillText(totalHours.toString(), centerX, centerY - 8);

      // Label
      ctx.font = '400 10px sans-serif';
      ctx.fillStyle = '#737373';
      ctx.fillText('HOURS', centerX, centerY + 10);
    }
  }, [displayStats, categories]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // ... same as before
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if mouse is within the donut ring
    if (distance >= 65 && distance <= 90) {
      let angle = Math.atan2(dy, dx);
      // Normalize angle to match canvas drawing (start at -PI/2)
      angle = angle + 0.5 * Math.PI;
      if (angle < 0) angle += 2 * Math.PI;

      let currentAngle = 0;
      const { stats: data, totalHours } = displayStats;

      for (const category of categories) {
        const count = data[category.key] || 0;
        if (count > 0) {
          const sliceAngle = (count / totalHours) * 2 * Math.PI;
          if (angle >= currentAngle && angle < currentAngle + sliceAngle) {
            setTooltip({
              x: e.clientX, // Screen coordinates for tooltip div
              y: e.clientY,
              visible: true,
              category: category.name,
              hours: count,
              percentage: ((count / totalHours) * 100).toFixed(1),
              color: category.color
            });
            return;
          }
          currentAngle += sliceAngle;
        }
      }
    }

    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const handleCanvasMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <div className="flex flex-col flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-1">
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setActiveTab('daily')}
          className="flex-1 px-2 py-1.5 text-sm tracking-wider font-medium rounded-md transition-all font-playfair"
          style={{
            background: activeTab === 'daily' ? '#262626' : 'transparent',
            color: activeTab === 'daily' ? '#e5e5e5' : '#737373',
            border: activeTab === 'daily' ? '1px solid #404040' : '1px solid transparent',
          }}
        >
          Daily
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className="flex-1 px-2 py-1.5 text-sm tracking-wider font-medium rounded-md transition-all font-playfair"
          style={{
            background: activeTab === 'monthly' ? '#262626' : 'transparent',
            color: activeTab === 'monthly' ? '#e5e5e5' : '#737373',
            border: activeTab === 'monthly' ? '1px solid #404040' : '1px solid transparent',
          }}
        >
          Monthly
        </button>
        <button
          onClick={() => setActiveTab('alltime')}
          className="flex-1 px-2 py-1.5 text-sm tracking-wider font-medium rounded-md transition-all font-playfair"
          style={{
            background: activeTab === 'alltime' ? '#262626' : 'transparent',
            color: activeTab === 'alltime' ? '#e5e5e5' : '#737373',
            border: activeTab === 'alltime' ? '1px solid #404040' : '1px solid transparent',
          }}
        >
          All
        </button>
      </div>

      <div className="flex justify-center mb-3">
        {activeTab === 'alltime' ? (
          <h2 className="text-xl font-playfair tracking-wide text-[#a3a3a3]">
            All Time Statistics
          </h2>
        ) : (
          <DateNavigator
            date={
              activeTab === 'daily' && activeCell
                ? new Date(activeCell.year, activeCell.month, activeCell.day)
                : new Date(year, month, 1)
            }
            onDateChange={(newDate) => {
              if (activeTab === 'daily') {
                useStore.getState().setActiveStatsDate({
                  year: newDate.getFullYear(),
                  month: newDate.getMonth(),
                  day: newDate.getDate(),
                  hour: 0
                });
                // Also update global current date to keep context if switching back to tables
                useStore.getState().setCurrentDate(newDate);
              } else {
                useStore.getState().setCurrentDate(newDate);
              }
            }}
            className="bg-transparent border-none p-0 hover:bg-transparent"
          />
        )}
      </div>

      {displayStats.totalHours > 0 ? (
        <div className="flex justify-center mb-6 relative">
          <canvas
            ref={canvasRef}
            width="200"
            height="200"
            className="rounded-full cursor-crosshair"
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
          />
          {tooltip.visible && (
            <div
              className="fixed z-50 px-3 py-2 bg-[#171717] border border-[#262626] rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-8px]"
              style={{ top: tooltip.y, left: tooltip.x }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tooltip.color }} />
                <span className="text-xs font-medium text-[#e5e5e5] whitespace-nowrap">{tooltip.category}</span>
              </div>
              <div className="text-xs text-[#a3a3a3]">
                {tooltip.hours}h ({tooltip.percentage}%)
              </div>
              {/* Arrow */}
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#262626]"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center items-center mb-6 h-[200px]" style={{ color: '#525252' }}>
          <span className="text-xs">No data available</span>
        </div>
      )}




      <div className="space-y-3 text-xs flex-1">
        <h3 className="text-lg font-playfair tracking-wide pb-2 mb-3" style={{ color: '#737373', borderBottom: '1px solid #262626' }}>
          Categories
        </h3>

        {categories.map((category) => {
          const count = displayStats.stats[category.key] || 0;
          const percentage =
            displayStats.totalHours > 0 ? ((count / displayStats.totalHours) * 100).toFixed(1) : 0;

          if (count === 0) return null;

          return (
            <div key={category.key} className="relative py-1.5 px-2 rounded-md overflow-hidden group hover:bg-[#1a1a1a] transition-colors">
              {/* Bar Chart Background */}
              <div
                className="absolute top-0 left-0 bottom-0 bg-[#404040] transition-all duration-500 ease-out"
                style={{
                  width: `${percentage}%`,
                  opacity: 0.4
                }}
              />

              {/* Content */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full mr-2 shadow-sm"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-normal" style={{ color: '#d4d4d4' }}>
                    {category.name}
                  </span>
                </div>
                <span className="font-medium font-mono" style={{ color: '#737373' }}>
                  {count}h <span className="text-[#404040] mx-1">/</span> {percentage}%
                </span>
              </div>
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
    </div>
  );
};
