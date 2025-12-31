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

    // Color mapping untuk chart
    const colors: { [key: string]: string } = {
      S: '#10b981',
      F: '#f97316',
      A: '#0284c7',
      P: '#db2777',
      C: '#8b5cf6',
      E: '#06b6d4',
    };

    // Draw Pie Chart
    Object.entries(CATEGORIES).forEach(([key]) => {
      const count = data[key] || 0;
      if (count > 0) {
        const sliceAngle = (count / totalHours) * 2 * Math.PI;
        const color = colors[key];

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
    ctx.fillStyle = '#171717';
    ctx.fill();
  }, [stats]);

  const totalMaxHours = getDaysInMonth(year, month) * 24;

  return (
    <aside className="lg:col-span-1 p-4 rounded-xl overflow-y-auto" style={{ background: '#171717', border: '1px solid #262626' }}>
      <h2 className="text-base font-normal mb-3" style={{ color: '#a3a3a3' }}>Monthly Statistics</h2>
      <div className="flex justify-center mb-6">
        <canvas ref={canvasRef} width="200" height="200" className="rounded-full" />
      </div>

      {/* Legend */}
      <div className="space-y-3 text-xs">
        <h3 className="font-normal pb-2 mb-3" style={{ color: '#737373', borderBottom: '1px solid #262626' }}>
          Categories
        </h3>

        {Object.entries(CATEGORIES).map(([key, category]) => {
          const count = stats.stats[key] || 0;
          const percentage =
            stats.totalHours > 0 ? ((count / stats.totalHours) * 100).toFixed(1) : 0;

          if (count === 0) return null;

          const colors: { [key: string]: string } = {
            S: '#10b981',
            F: '#f97316',
            A: '#0284c7',
            P: '#db2777',
            C: '#8b5cf6',
            E: '#06b6d4',
          };

          return (
            <div key={key} className="flex items-center justify-between py-1">
              <div className="flex items-center">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                  style={{ backgroundColor: colors[key] }}
                />
                <span className="font-normal" style={{ color: '#a3a3a3' }}>
                  {key}: {category.name}
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
            {stats.totalHours} / {totalMaxHours}h
          </span>
        </div>
      </div>
    </aside>
  );
};
