export const initialState = { nextId: 1, todos: [] };

export function todoReducer(state = initialState, action) {
  switch (action.type) {
    case 'todo/add':
      return {
        nextId: state.nextId + 1,
        todos: [...state.todos, { id: state.nextId, text: action.text, done: false }],
      };
    case 'todo/toggle':
      return {
        ...state,
        todos: state.todos.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t)),
      };
    case 'todo/delete':
      return { ...state, todos: state.todos.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
}
