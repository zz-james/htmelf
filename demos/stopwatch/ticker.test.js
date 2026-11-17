import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStore } from 'tinybase-element';
import { stopwatchReducer } from './reducer.js';
import { createTicker } from './ticker.js';

describe('createTicker', () => {
  let store;
  beforeEach(() => {
    vi.useFakeTimers();
    store = createStore(stopwatchReducer);
  });
  afterEach(() => vi.useRealTimers());

  it('does nothing while the store is stopped', () => {
    const ticker = createTicker(store);

    ticker.sync();
    vi.advanceTimersByTime(500);

    expect(vi.getTimerCount()).toBe(0);
    expect(store.getState().elapsedMs).toBe(0);
  });

  it('dispatches elapsed time while running, and stops when the store stops', () => {
    const ticker = createTicker(store);
    store.dispatch({ type: 'start' });
    ticker.sync();

    vi.advanceTimersByTime(100);
    expect(store.getState().elapsedMs).toBeGreaterThanOrEqual(90);

    store.dispatch({ type: 'stop' });
    ticker.sync();
    const stoppedAt = store.getState().elapsedMs;
    vi.advanceTimersByTime(500);
    expect(vi.getTimerCount()).toBe(0);
    expect(store.getState().elapsedMs).toBe(stoppedAt);
  });

  it('starts only one interval however often sync() is called', () => {
    const ticker = createTicker(store);
    store.dispatch({ type: 'start' });

    ticker.sync();
    ticker.sync();

    expect(vi.getTimerCount()).toBe(1);
  });

  it('continues from the elapsed time when restarted', () => {
    const ticker = createTicker(store);
    store.dispatch({ type: 'tick', elapsedMs: 5000 });
    store.dispatch({ type: 'start' });
    ticker.sync();

    vi.advanceTimersByTime(100);

    expect(store.getState().elapsedMs).toBeGreaterThanOrEqual(5090);
  });

  it('stop() clears the interval even while the store says running', () => {
    const ticker = createTicker(store);
    store.dispatch({ type: 'start' });
    ticker.sync();

    ticker.stop();

    expect(vi.getTimerCount()).toBe(0);
  });
});
