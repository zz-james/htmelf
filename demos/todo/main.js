import { TinyBase, createStore, setAppStore } from 'tinybase-element';
import { todoReducer } from './reducer.js';

// --- store, seeded from and saved to localStorage ---------------------------
const KEY = 'tinybase-element-demo-todo';
let saved;
try {
  saved = JSON.parse(localStorage.getItem(KEY));
} catch {
  // no storage or bad JSON: start empty
}
const store = createStore(todoReducer, saved ?? undefined);
store.subscribe(() => {
  try {
    localStorage.setItem(KEY, JSON.stringify(store.getState()));
  } catch {
    // storage unavailable: the list just won't survive a reload
  }
});
setAppStore(store);

// --- <todo-item>: a dumb child. Everything it needs arrives through props ---
class TodoItem extends TinyBase {
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
customElements.define('todo-item', TodoItem);

// --- <todo-list>: subscribes to the store and re-renders the items ----------
class TodoList extends TinyBase {
  connectedCallback() {
    // the unsubscribe function goes to registerCleanup, so disconnect tears it down
    this.registerCleanup(this.getStore().subscribe(() => this.render()));
    super.connectedCallback();
  }

  render() {
    const { todos } = this.getStore().getState();
    // setProps allocates a key per item; TinyBase frees them all on the next render
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
customElements.define('todo-list', TodoList);

// --- <todo-app>: renders its form once, so typing is never interrupted ------
class TodoApp extends TinyBase {
  static renderOnce = true;

  render() {
    this.innerHTML = `
      <form>
        <input type="text" name="text" placeholder="What needs doing?" required />
        <button>Add</button>
      </form>
      <todo-list></todo-list>`;
    this.querySelector('form').onsubmit = (event) => {
      event.preventDefault();
      const input = event.target.elements.text;
      this.getStore().dispatch({ type: 'todo/add', text: input.value.trim() });
      input.value = '';
    };
  }
}
customElements.define('todo-app', TodoApp);
