import { setAppStore } from 'tinybase-element';
import { todoReducer } from './reducer.js';
import { createPersistentStore } from './storage.js';
import { TodoItem } from './todo-item.js';
import { TodoList } from './todo-list.js';
import { TodoApp } from './todo-app.js';

// register the store before defining the elements: defining upgrades any
// <todo-app> already on the page, and it needs the store as it connects
setAppStore(createPersistentStore(todoReducer, 'tinybase-element-demo-todo'));
customElements.define('todo-item', TodoItem);
customElements.define('todo-list', TodoList);
customElements.define('todo-app', TodoApp);
