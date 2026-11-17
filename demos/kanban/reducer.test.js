import { describe, it, expect } from 'vitest';
import { kanbanReducer, initialState, moveCard } from './reducer';

describe('kanbanReducer', () => {
  it('moves a card between columns', () => {
    const s = moveCard(1, 'done').reduce(kanbanReducer, initialState);
    expect(s.columns).toEqual({ todo: [2], doing: [3], done: [1] });
  });

  it('moves a card within a column to an index', () => {
    const s = moveCard(2, 'todo', 0).reduce(kanbanReducer, initialState);
    expect(s.columns.todo).toEqual([2, 1]);
  });

  it('adds new cards to todo', () => {
    const s = kanbanReducer(initialState, { type: 'card/add', text: 'x' });
    expect(s.columns.todo).toEqual([1, 2, 4]);
    expect(s.cards[4].text).toBe('x');
  });
});
