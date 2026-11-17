import { describe, it, expect } from 'vitest';
import { readDrop } from './drop.js';

const cards = { 0: { text: 'zero' }, 1: { text: 'one' } };

function dropEvent(payload, column = 'doing') {
  document.body.innerHTML = column ? `<section data-column="${column}"><p></p></section>` : '<p></p>';
  return { target: document.querySelector('p'), dataTransfer: { getData: () => payload } };
}

describe('readDrop', () => {
  it('reads the card and column of a drop, including card id 0', () => {
    expect(readDrop(dropEvent('1'), cards)).toEqual({ id: 1, column: 'doing' });
    expect(readDrop(dropEvent('0'), cards)).toEqual({ id: 0, column: 'doing' });
  });

  it.each([
    ['an empty payload', ''],
    ['text that is not a number', 'abc'],
    ['a fractional id', '1.5'],
    ['an id that is not a card', '99'],
  ])('returns null for %s', (_, payload) => {
    expect(readDrop(dropEvent(payload), cards)).toBeNull();
  });

  it('returns null when the drop is outside any column', () => {
    expect(readDrop(dropEvent('1', null), cards)).toBeNull();
  });
});
