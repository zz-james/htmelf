import { describe, it, expect } from 'vitest';
import { stopwatchReducer, initialState, formatTime } from './reducer';

describe('stopwatch', () => {
  it('records laps at the current time and resets', () => {
    let s = stopwatchReducer(initialState, { type: 'tick', elapsedMs: 1500 });
    s = stopwatchReducer(s, { type: 'lap' });
    expect(s.laps).toEqual([1500]);
    expect(stopwatchReducer(s, { type: 'reset' })).toEqual(initialState);
  });

  it('formats mm:ss.cc', () => {
    expect(formatTime(61230)).toBe('01:01.23');
  });
});
