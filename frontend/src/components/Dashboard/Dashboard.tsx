import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchDashboard } from '../../store/slices/dashboardSlice';
import Timer from '../Timer/Timer';
import TimerControls from '../TimerControls/TimerControls';
import DonutChart from '../DonutChart/DonutChart';
import GoalProgress from '../GoalProgress/GoalProgress';

const MOCK_USER_ID = 'user-1';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading } = useSelector((state: RootState) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboard(MOCK_USER_ID));
    
    // Refresh dashboard every 30 seconds
    const interval = setInterval(() => {
      dispatch(fetchDashboard(MOCK_USER_ID));
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TwentyFourSeven</h1>
          <p className="text-gray-600">Track your time, 24/7</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Timer and Controls */}
          <div className="lg:col-span-2 space-y-6">
            <Timer />
            <TimerControls />
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Today's Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Time:</span>
                  <span className="font-semibold">
                    {data?.today.totalHours.toFixed(1) || 0}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Entries:</span>
                  <span className="font-semibold">
                    {data?.today.entryCount || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Week's Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Time:</span>
                  <span className="font-semibold">
                    {data?.week.totalHours.toFixed(1) || 0}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Entries:</span>
                  <span className="font-semibold">
                    {data?.week.entryCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid - Charts and Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <DonutChart data={data?.today.categoryData || []} />
          <GoalProgress goals={data?.today.goals || []} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
