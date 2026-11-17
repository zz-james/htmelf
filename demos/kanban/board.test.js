import { describe, it, expect } from 'vitest';
import { countProps } from 'tinybase-element';
import './main.js';

describe('kanban board', () => {
  it('moves the same card element between columns, keeping its local state', () => {
    document.body.innerHTML = '<kanban-board></kanban-board>';
    const board = document.querySelector('kanban-board');
    const card = board.querySelector('[data-column="todo"] kanban-card');
    card.querySelector('[data-like]').click();

    card.querySelector('[data-dir="1"]').click();

    expect(board.querySelector('[data-column="doing"]').contains(card)).toBe(true);
    expect(card.likes).toBe(1);
    expect(card.querySelector('[data-like]').textContent).toBe('+1 (1)');
  });

  it('frees every props key when the board is removed', () => {
    document.body.innerHTML = '';
    const before = countProps();
    document.body.innerHTML = '<kanban-board></kanban-board>';
    expect(countProps()).toBeGreaterThan(before);
    document.body.innerHTML = '';
    expect(countProps()).toBe(before);
  });
});
