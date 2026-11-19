import { Htmelf } from 'htmelf';

// renders its form once, so typing is never interrupted
export class TodoApp extends Htmelf {
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
