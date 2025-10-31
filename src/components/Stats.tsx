import React, { useRef, useEffect } from 'react';
import { CATEGORIES } from '../constants';
import { getDaysInMonth } from '../utils/storage';
import type { MonthStats } from '../types';

interface StatsProps {
  stats: MonthStats;
  year: number;
  month: number;
}

export const Stats: React.FC<StatsProps> = ({ stats, year, month }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const { stats: data, totalHours } = stats;

    // Draw Pie Chart
    Object.entries(CATEGORIES).forEach(([key, category]) => {
      const count = data[key] || 0;
      if (count > 0) {
        const sliceAngle = (count / totalHours) * 2 * Math.PI;
        const color = category.color;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = color;
        ctx.fill();

        currentAngle += sliceAngle;
      }
    });

    // Donut effect
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
  }, [stats]);

  const totalMaxHours = getDaysInMonth(year, month) * 24;

  return (
    <aside className="lg:col-span-1 bg-white p-4 shadow-sm rounded-2xl overflow-y-auto">
      <h2 className="text-base mb-3 text-gray-600">Monthly Statistics</h2>
      <div className="flex justify-center mb-6">
        <canvas ref={canvasRef} width="200" height="200" className="rounded-full" />
      </div>

      {/* Legend */}
      <div className="space-y-3 text-xs">
        <h3 className="font-normal text-gray-500 border-b border-gray-100 pb-2 mb-3">
          Categories
        </h3>

        {Object.entries(CATEGORIES).map(([key, category]) => {
          const count = stats.stats[key] || 0;
          const percentage =
            stats.totalHours > 0 ? ((count / stats.totalHours) * 100).toFixed(1) : 0;

          if (count === 0) return null;

          return (
            <div key={key} className="flex items-center justify-between py-1">
              <div className="flex items-center">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-light text-gray-700">
                  {key}: {category.name}
                </span>
              </div>
              <span className="text-gray-500 font-light">
                {count}h ({percentage}%)
              </span>
            </div>
          );
        })}

        <div className="pt-3 mt-3 border-t border-gray-100 font-light flex justify-between text-gray-600">
          <span>Total Activity</span>
          <span>
            {stats.totalHours} / {totalMaxHours}h
          </span>
        </div>
      </div>
    </aside>
  );
};
