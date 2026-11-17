import { createStore, setAppStore } from 'tinybase-element';
import { kanbanReducer } from './reducer.js';
import { KanbanCard } from './kanban-card.js';
import { KanbanBoard } from './kanban-board.js';

// register the store before defining the elements: defining upgrades any
// <kanban-board> already on the page, and it needs the store as it connects
setAppStore(createStore(kanbanReducer));
customElements.define('kanban-card', KanbanCard);
customElements.define('kanban-board', KanbanBoard);
