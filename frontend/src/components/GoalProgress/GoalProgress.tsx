import React from 'react';
import { Goal } from '../../types';

interface GoalProgressProps {
  goals: Goal[];
}

const GoalProgress: React.FC<GoalProgressProps> = ({ goals }) => {
  if (!goals || goals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Goals</h3>
        <p className="text-gray-400 text-center py-8">No active goals</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Goals</h3>
      <div className="space-y-4">
        {goals.map((goal) => {
          // Simplified progress calculation - in real app, calculate from time entries
          const progress = 0;
          const percentage = Math.min((progress / goal.targetHours) * 100, 100);

          return (
            <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800">{goal.title}</h4>
                <span className="text-sm text-gray-500">
                  {progress.toFixed(1)} / {goal.targetHours}h
                </span>
              </div>
              {goal.description && (
                <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
              )}
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {percentage.toFixed(0)}% complete
                </span>
                {goal.deadline && (
                  <span className="text-xs text-gray-500">
                    Due: {new Date(goal.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalProgress;
