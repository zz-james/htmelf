// Keeps a setInterval in step with `store.getState().running`: while running
// it dispatches a 'tick' with the elapsed time, and it stops when the store
// says stopped. Call sync() after every store change (and once at start, since
// the store may already be running) and stop() when done. Elapsed time is
// measured from the clock, not counted per tick, so a late tick does not drift.
export function createTicker(store, intervalMs = 30) {
  let interval;

  const stop = () => {
    clearInterval(interval);
    interval = undefined;
  };

  const sync = () => {
    const { running, elapsedMs } = store.getState();
    if (running && !interval) {
      const startedAt = performance.now() - elapsedMs;
      interval = setInterval(
        () => store.dispatch({ type: 'tick', elapsedMs: performance.now() - startedAt }),
        intervalMs
      );
    } else if (!running && interval) {
      stop();
    }
  };

  return { sync, stop };
}
