import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { startTimer, stopTimer } from '../../store/slices/timerSlice';

// Mock categories - in a real app, these would come from the backend
const MOCK_CATEGORIES = [
  { id: '1', name: 'Work', color: '#3B82F6' },
  { id: '2', name: 'Personal', color: '#10B981' },
  { id: '3', name: 'Learning', color: '#8B5CF6' },
  { id: '4', name: 'Health', color: '#EF4444' },
  { id: '5', name: 'Social', color: '#F59E0B' },
  { id: '6', name: 'Other', color: '#6B7280' },
];

const MOCK_USER_ID = 'user-1';

const TimerControls: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isRunning, activeTimer, loading } = useSelector((state: RootState) => state.timer);
  const [selectedCategory, setSelectedCategory] = useState(MOCK_CATEGORIES[0].id);

  const handleStart = () => {
    dispatch(startTimer({
      userId: MOCK_USER_ID,
      categoryId: selectedCategory,
    }));
  };

  const handleStop = () => {
    if (activeTimer) {
      dispatch(stopTimer({
        userId: MOCK_USER_ID,
        entryId: activeTimer.id,
      }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Timer Controls</h3>
      
      {!isRunning && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MOCK_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-white font-medium transition-all ${
                  selectedCategory === category.id ? 'ring-4 ring-offset-2 ring-opacity-50' : 'opacity-70'
                }`}
                style={{ 
                  backgroundColor: category.color,
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={loading}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Start Timer'}
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Stopping...' : 'Stop Timer'}
          </button>
        )}
      </div>
    </div>
  );
};

export default TimerControls;
