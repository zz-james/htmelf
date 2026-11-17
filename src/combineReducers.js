// Combines slice reducers into one. Returns the previous state object itself
// when no slice produced a new value, so "did anything change?" is a plain
// `===`, and the store can skip notifying. That relies on the usual reducer
// rule: return a new value to change a slice, never mutate it in place.
export const combineReducers = (reducers) => {
  const keys = Object.keys(reducers);

  return (state = {}, action) => {
    const nextState = {};
    let changed = Object.keys(state).length !== keys.length;
    keys.forEach((key) => {
      nextState[key] = reducers[key](state[key], action);
      changed = changed || !(key in state) || nextState[key] !== state[key];
    });
    return changed ? nextState : state;
  };
};
