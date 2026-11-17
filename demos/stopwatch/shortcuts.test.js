import { describe, it, expect, vi } from 'vitest';
import { handleShortcut } from './shortcuts.js';

function key(init, target = document.body) {
  const event = new KeyboardEvent('keydown', { ...init, cancelable: true });
  Object.defineProperty(event, 'target', { value: target });
  return event;
}

describe('handleShortcut', () => {
  it('toggles on Space, and prevents the page from scrolling', () => {
    const actions = { toggle: vi.fn(), lap: vi.fn() };
    const event = key({ code: 'Space', key: ' ' });

    handleShortcut(event, actions);

    expect(actions.toggle).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(actions.lap).not.toHaveBeenCalled();
  });

  it('records a lap on L', () => {
    const actions = { toggle: vi.fn(), lap: vi.fn() };

    handleShortcut(key({ key: 'l', code: 'KeyL' }), actions);

    expect(actions.lap).toHaveBeenCalledTimes(1);
    expect(actions.toggle).not.toHaveBeenCalled();
  });

  it('ignores keys pressed on a button or an input, and other keys', () => {
    const actions = { toggle: vi.fn(), lap: vi.fn() };
    const button = document.createElement('button');
    const input = document.createElement('input');

    handleShortcut(key({ code: 'Space', key: ' ' }, button), actions);
    handleShortcut(key({ key: 'l', code: 'KeyL' }, input), actions);
    handleShortcut(key({ key: 'x', code: 'KeyX' }), actions);

    expect(actions.toggle).not.toHaveBeenCalled();
    expect(actions.lap).not.toHaveBeenCalled();
  });
});
