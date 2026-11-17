import { describe, it, expect, vi } from 'vitest';
import { countProps } from 'tinybase-element';

// the page harness needs these elements before main.js runs
document.body.innerHTML = '<button id="mount"></button><b id="keys"></b><div id="slot"></div>';
await import('./main.js');

describe('stopwatch timer', () => {
  it('stops ticking and frees its props when removed while running', () => {
    vi.useFakeTimers();
    const slot = document.querySelector('#slot');
    const timer = slot.firstElementChild;
    timer.querySelector('[data-toggle]').click(); // start
    vi.advanceTimersByTime(100);
    const shown = timer.querySelector('stopwatch-display').textContent;
    expect(shown).not.toBe('00:00.00');

    timer.remove();
    vi.advanceTimersByTime(1000);

    expect(vi.getTimerCount()).toBe(0);
    expect(countProps()).toBe(0);
    vi.useRealTimers();
  });
});
