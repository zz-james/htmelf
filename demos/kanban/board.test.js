import { describe, it, expect } from 'vitest';
import { countProps, createStore, setAppStore } from 'tinybase-element';
import { kanbanReducer } from './reducer.js';
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

describe('kanban board: drops and eviction', () => {
  const drop = (board, column, data) => {
    const event = new Event('drop', { bubbles: true });
    event.dataTransfer = { getData: () => data };
    board.querySelector(`[data-column="${column}"] .cards`).dispatchEvent(event);
  };
  const boardWith = (state) => {
    setAppStore(createStore(kanbanReducer, state));
    document.body.innerHTML = '<kanban-board></kanban-board>';
    return document.querySelector('kanban-board');
  };
  const stateWithCardZero = () => ({
    nextId: 2,
    cards: { 0: { text: 'Zero' }, 1: { text: 'One' } },
    columns: { todo: [0, 1], doing: [], done: [] },
  });

  it('accepts a drop of card id 0', () => {
    const board = boardWith(stateWithCardZero());
    const card = board.querySelector('[data-column="todo"] kanban-card');

    drop(board, 'doing', '0');

    expect(board.querySelector('[data-column="doing"]').contains(card)).toBe(true);
  });

  it('ignores a drop with no card id, or one that is not a card', () => {
    const board = boardWith(stateWithCardZero());
    const before = JSON.stringify(board.getStore().getState().columns);

    drop(board, 'doing', '');
    drop(board, 'doing', 'abc');
    drop(board, 'doing', '99');

    expect(JSON.stringify(board.getStore().getState().columns)).toBe(before);
  });

  it('removes the element of a card that leaves the store', () => {
    const board = boardWith(stateWithCardZero());
    const card = board.querySelector('[data-column="todo"] kanban-card');
    expect(board.cards.size()).toBe(2);

    board.getStore().dispatch({ type: 'card/remove', id: 0 });

    expect(card.isConnected).toBe(false);
    expect(board.cards.size()).toBe(1);
  });
});

describe('kanban board: reconnect', () => {
  it('keeps one element per card when the board is moved in the DOM', () => {
    setAppStore(createStore(kanbanReducer));
    document.body.innerHTML = '<kanban-board></kanban-board>';
    const board = document.querySelector('kanban-board');
    const before = board.querySelectorAll('kanban-card');
    const elsewhere = document.createElement('div');
    document.body.appendChild(elsewhere);

    elsewhere.appendChild(board);

    expect(board.querySelectorAll('kanban-card').length).toBe(3);
    expect([...board.querySelectorAll('kanban-card')]).toEqual([...before]);
  });
});
