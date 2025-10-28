import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { TimeEntry } from '../../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface TimerState {
  activeTimer: TimeEntry | null;
  isRunning: boolean;
  elapsedSeconds: number;
  loading: boolean;
  error: string | null;
}

const initialState: TimerState = {
  activeTimer: null,
  isRunning: false,
  elapsedSeconds: 0,
  loading: false,
  error: null,
};

export const startTimer = createAsyncThunk(
  'timer/start',
  async (data: { userId: string; categoryId: string; projectId?: string; notes?: string }) => {
    const response = await axios.post(`${API_BASE}/timer/start`, data);
    return response.data;
  }
);

export const stopTimer = createAsyncThunk(
  'timer/stop',
  async (data: { userId: string; entryId: string; notes?: string }) => {
    const response = await axios.post(`${API_BASE}/timer/stop`, data);
    return response.data;
  }
);

export const getActiveTimer = createAsyncThunk(
  'timer/getActive',
  async (userId: string) => {
    const response = await axios.get(`${API_BASE}/timer/active/${userId}`);
    return response.data;
  }
);

const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    tick: (state) => {
      if (state.isRunning) {
        state.elapsedSeconds += 1;
      }
    },
    resetTimer: (state) => {
      state.activeTimer = null;
      state.isRunning = false;
      state.elapsedSeconds = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startTimer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startTimer.fulfilled, (state, action: PayloadAction<TimeEntry>) => {
        state.loading = false;
        state.activeTimer = action.payload;
        state.isRunning = true;
        state.elapsedSeconds = 0;
      })
      .addCase(startTimer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to start timer';
      })
      .addCase(stopTimer.pending, (state) => {
        state.loading = true;
      })
      .addCase(stopTimer.fulfilled, (state) => {
        state.loading = false;
        state.activeTimer = null;
        state.isRunning = false;
        state.elapsedSeconds = 0;
      })
      .addCase(stopTimer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to stop timer';
      })
      .addCase(getActiveTimer.fulfilled, (state, action: PayloadAction<TimeEntry | null>) => {
        if (action.payload) {
          state.activeTimer = action.payload;
          state.isRunning = true;
          const startTime = new Date(action.payload.startTime).getTime();
          const now = Date.now();
          state.elapsedSeconds = Math.floor((now - startTime) / 1000);
        }
      });
  },
});

export const { tick, resetTimer } = timerSlice.actions;
export default timerSlice.reducer;
