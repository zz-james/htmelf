import { Htmelf } from 'htmelf';

// renderOnce: the card renders on first connect and keeps its markup when the
// board moves it to another column. The "+1" count lives on the element, not
// in the store, so it surviving a move shows the element itself was moved,
// not rebuilt.
export class KanbanCard extends Htmelf {
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
