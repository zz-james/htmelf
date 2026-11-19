import { Htmelf } from 'htmelf';

// subscribes to the store and re-renders the items
export class TodoList extends Htmelf {
  connectedCallback() {
    // watchStore re-renders on every change and unsubscribes on disconnect
    this.watchStore();
    super.connectedCallback();
  }

  render() {
    const { todos } = this.getStore().getState();
    // setProps allocates a key per item; Htmelf frees them all on the next render
    this.innerHTML = todos.length
      ? `<ul>${todos
          .map(
            (todo) => `<li><todo-item ${this.setProps({
              todo,
              onToggle: (id) => this.getStore().dispatch({ type: 'todo/toggle', id }),
              onDelete: (id) => this.getStore().dispatch({ type: 'todo/delete', id }),
            })}></todo-item></li>`
          )
          .join('')}</ul>`
      : '<p class="note">Nothing to do.</p>';
  }
}
