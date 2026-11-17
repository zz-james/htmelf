import { TinyBase } from 'tinybase-element';

// a dumb child: everything it needs arrives through props
export class TodoItem extends TinyBase {
  render() {
    const { todo, onToggle, onDelete } = this.props;
    this.innerHTML = `
      <label><input type="checkbox" ${todo.done ? 'checked' : ''} />
        <span style="${todo.done ? 'text-decoration: line-through; color: #888' : ''}"></span>
      </label>
      <button type="button" aria-label="Delete">x</button>`;
    this.querySelector('span').textContent = todo.text; // textContent: no HTML injection
    this.querySelector('input').onchange = () => onToggle(todo.id);
    this.querySelector('button').onclick = () => onDelete(todo.id);
  }
}
