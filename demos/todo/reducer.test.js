import { describe, it, expect } from 'vitest';
import { todoReducer, initialState } from './reducer';

describe('todoReducer', () => {
  it('adds, toggles and deletes', () => {
    let s = todoReducer(initialState, { type: 'todo/add', text: 'a' });
    s = todoReducer(s, { type: 'todo/add', text: 'b' });
    expect(s.todos.map((t) => t.id)).toEqual([1, 2]);
    s = todoReducer(s, { type: 'todo/toggle', id: 1 });
    expect(s.todos[0].done).toBe(true);
    s = todoReducer(s, { type: 'todo/delete', id: 1 });
    expect(s.todos.map((t) => t.text)).toEqual(['b']);
  });
});
