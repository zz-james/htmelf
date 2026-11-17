import { TinyBase } from 'tinybase-element';
import { moveCard, COLUMNS } from './reducer.js';
import { readDrop } from './drop.js';
import { createCardElements } from './card-elements.js';

export class KanbanBoard extends TinyBase {
  static renderOnce = true;
  cardProps; // one key shared by every card; the board owns it
  cards = createCardElements(() => this.cardProps); // survives a reconnect, like the markup

  connectedCallback() {
    super.connectedCallback();
    // a fresh key per connect: disconnect frees the old one
    this.cardProps = this.setProps({ onMove: (id, dir) => this.stepCard(id, dir) }, true);
    this.watchStore(() => this.sync());

    // listeners go through listen() so disconnect removes them
    this.listen(this, 'dragover', (event) => event.preventDefault());
    this.listen(this, 'drop', (event) => {
      const drop = readDrop(event, this.getStore().getState().cards);
      if (drop) {
        this.getStore().batch(moveCard(drop.id, drop.column));
      }
    });
    this.sync();
  }

  render() {
    this.innerHTML = `
      <form id="add"><input type="text" name="text" placeholder="New card" required /> <button>Add</button></form>
      <div class="board">${COLUMNS.map(
        (name) => `<section data-column="${name}"><h2>${name}</h2><div class="cards"></div></section>`
      ).join('')}</div>`;
    this.querySelector('#add').onsubmit = (event) => {
      event.preventDefault();
      const input = event.target.elements.text;
      this.getStore().dispatch({ type: 'card/add', text: input.value.trim() });
      input.value = '';
    };
  }

  stepCard(id, dir) {
    const { columns } = this.getStore().getState();
    const from = COLUMNS.findIndex((name) => columns[name].includes(id));
    const to = COLUMNS[from + dir];
    if (to) {
      // batch: remove + insert as ONE change, so no subscriber sees the card in neither/both
      this.getStore().batch(moveCard(id, to));
    }
  }

  // reconcile: place every card's element in its column, in order, then drop
  // the elements of cards that are no longer in any column. appendChild on an
  // existing card MOVES it (disconnect + connect), which is exactly what
  // renderOnce is for.
  sync() {
    const { columns } = this.getStore().getState();
    COLUMNS.forEach((name) => {
      const container = this.querySelector(`[data-column="${name}"] .cards`);
      columns[name].forEach((id) => container.appendChild(this.cards.get(id)));
    });
    this.cards.prune(new Set(COLUMNS.flatMap((name) => columns[name])));
  }
}
