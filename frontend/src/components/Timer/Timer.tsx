import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { tick } from '../../store/slices/timerSlice';

interface TimerDisplayProps {
  seconds: number;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ seconds }) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return (
    <div className="text-center">
      <div className="text-8xl font-bold text-gray-800 mb-4 font-mono">
        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>
    </div>
  );
};

const Timer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isRunning, elapsedSeconds, activeTimer } = useSelector((state: RootState) => state.timer);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize Web Worker
    workerRef.current = new Worker('/workers/timer.worker.js');

    workerRef.current.addEventListener('message', (e) => {
      if (e.data.type === 'tick') {
        dispatch(tick());
      }
    });

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [dispatch]);

  useEffect(() => {
    if (workerRef.current) {
      if (isRunning) {
        workerRef.current.postMessage({ action: 'start' });
      } else {
        workerRef.current.postMessage({ action: 'stop' });
      }
    }
  }, [isRunning]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <TimerDisplay seconds={elapsedSeconds} />
      {activeTimer && (
        <div className="text-center mt-4">
          <div 
            className="inline-block px-4 py-2 rounded-full text-white text-sm font-medium"
            style={{ backgroundColor: activeTimer.category?.color || '#6B7280' }}
          >
            {activeTimer.category?.name || 'Unknown'}
          </div>
          {activeTimer.project && (
            <div className="text-gray-600 mt-2">
              {activeTimer.project.name}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Timer;
