import { describe, it, expect, beforeAll, vi } from 'vitest';
import { countProps } from 'tinybase-element';

const KEY = 'tinybase-element-demo-todo';
const data = new Map();
const storage = {
  getItem: (key) => data.get(key) ?? null,
  setItem: (key, value) => data.set(key, String(value)),
};

// a plain stub, so the test does not depend on which localStorage the runtime has
beforeAll(async () => {
  vi.stubGlobal('localStorage', storage);
  await import('./main.js');
});

describe('todo app', () => {
  it('adds an item, saves it, and frees every props key when removed', () => {
    document.body.innerHTML = '<todo-app></todo-app>';
    const app = document.querySelector('todo-app');
    app.querySelector('input[name="text"]').value = 'write tests';
    app.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));

    expect(app.querySelector('todo-item span').textContent).toBe('write tests');
    expect(JSON.parse(data.get(KEY)).todos).toHaveLength(1);
    expect(countProps()).toBeGreaterThan(0);

    document.body.innerHTML = '';
    expect(countProps()).toBe(0);
  });
});
