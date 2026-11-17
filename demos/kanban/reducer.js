export const COLUMNS = ['todo', 'doing', 'done'];

export const initialState = {
  nextId: 4,
  cards: { 1: { text: 'Write the README' }, 2: { text: 'Add a demo' }, 3: { text: 'Publish' } },
  columns: { todo: [1, 2], doing: [3], done: [] },
};

export function kanbanReducer(state = initialState, action) {
  switch (action.type) {
    case 'card/add':
      return {
        nextId: state.nextId + 1,
        cards: { ...state.cards, [state.nextId]: { text: action.text } },
        columns: { ...state.columns, todo: [...state.columns.todo, state.nextId] },
      };
    // a move is two actions - remove, then insert - dispatched with store.batch
    // so subscribers only ever see the card in one column
    case 'card/remove':
      return {
        ...state,
        columns: Object.fromEntries(
          Object.entries(state.columns).map(([name, ids]) => [
            name,
            ids.filter((id) => id !== action.id),
          ])
        ),
      };
    case 'card/insert': {
      const ids = [...state.columns[action.column]];
      ids.splice(action.index ?? ids.length, 0, action.id);
      return { ...state, columns: { ...state.columns, [action.column]: ids } };
    }
    default:
      return state;
  }
}

export const moveCard = (id, column, index) => [
  { type: 'card/remove', id },
  { type: 'card/insert', id, column, index },
];
