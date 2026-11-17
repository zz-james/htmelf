import { TinyBase, createStore, setAppStore } from 'tinybase-element';
import { kanbanReducer, moveCard, COLUMNS } from './reducer.js';

const store = createStore(kanbanReducer);
setAppStore(store);

// --- <kanban-card> ----------------------------------------------------------
// renderOnce: the card renders on first connect and keeps its markup when the
// board moves it to another column. The "+1" count lives on the element, not
// in the store, so it surviving a move shows the element itself was moved,
// not rebuilt.
class KanbanCard extends TinyBase {
  static renderOnce = true;
  likes = 0;

  render() {
    const id = Number(this.getAttribute('card-id'));
    const { onMove } = this.props;
    this.draggable = true;
    this.innerHTML = `
      <span class="text"></span>
      <button type="button" data-like></button>
      <button type="button" data-dir="-1" aria-label="Move left">&larr;</button>
      <button type="button" data-dir="1" aria-label="Move right">&rarr;</button>`;
    this.querySelector('.text').textContent = this.getStore().getState().cards[id].text;
    const like = this.querySelector('[data-like]');
    const showLikes = () => (like.textContent = `+1 (${this.likes})`);
    showLikes();
    like.onclick = () => {
      this.likes++;
      showLikes();
    };
    this.querySelectorAll('[data-dir]').forEach((button) => {
      button.onclick = () => onMove(id, Number(button.dataset.dir));
    });
    this.ondragstart = (event) => event.dataTransfer.setData('text/plain', String(id));
  }
}
customElements.define('kanban-card', KanbanCard);

// --- <kanban-board> ---------------------------------------------------------
class KanbanBoard extends TinyBase {
  static renderOnce = true;
  cards = new Map(); // card id -> its element, reused across renders

  connectedCallback() {
    super.connectedCallback();
    // one key shared by every card; the board owns it and frees it on disconnect
    this.cardProps = this.setProps({ onMove: (id, dir) => this.stepCard(id, dir) }, true);
    this.watchStore(() => this.sync());

    // listeners go through listen() so disconnect removes them
    this.listen(this, 'dragover', (event) => event.preventDefault());
    this.listen(this, 'drop', (event) => {
      const column = event.target.closest('[data-column]')?.dataset.column;
      const id = Number(event.dataTransfer.getData('text/plain'));
      if (column && id) {
        this.getStore().batch(moveCard(id, column));
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

  // reconcile: create missing card elements, then place every one in order.
  // appendChild on an existing card MOVES it (disconnect + connect), which is
  // exactly what renderOnce is for.
  sync() {
    const { columns } = this.getStore().getState();
    COLUMNS.forEach((name) => {
      const container = this.querySelector(`[data-column="${name}"] .cards`);
      columns[name].forEach((id) => {
        if (!this.cards.has(id)) {
          const el = document.createElement('kanban-card');
          el.setAttribute('card-id', id);
          el.setAttribute('key', this.cardProps);
          this.cards.set(id, el);
        }
        container.appendChild(this.cards.get(id));
      });
    });
  }
}
customElements.define('kanban-board', KanbanBoard);
