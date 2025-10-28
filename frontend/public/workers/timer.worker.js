// Web Worker for accurate timer ticking
let timerId = null;
let isRunning = false;

self.addEventListener('message', (e) => {
  const { action } = e.data;

  if (action === 'start') {
    if (!isRunning) {
      isRunning = true;
      timerId = setInterval(() => {
        self.postMessage({ type: 'tick' });
      }, 1000);
    }
  } else if (action === 'stop') {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
      isRunning = false;
    }
  }
});
