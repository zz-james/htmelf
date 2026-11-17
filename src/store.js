import { createSubscriptions } from './subscriptions.js';

export { combineReducers } from './combineReducers.js';

export const createStore = (reducer, initialState = undefined) => {
  let state = initialState;
  const { subscribe, notify } = createSubscriptions();

  const getState = () => state;

  // Commits `nextState` and notifies, unless it is the very same state: a
  // reducer that returns its input unchanged (an action it does not handle)
  // means nothing changed, so nobody is told.
  const commit = (nextState) => {
    if (nextState === state) {
      return;
    }
    state = nextState;
    notify();
  };

  const dispatch = (action) => {
    commit(reducer(state, action));
  };

  // Applies several actions as one change: folds them through the reducer to
  // build a single next state, then commits that state and notifies once (or
  // not at all if it ends where it started).
  // If the reducer throws for any action, nothing is committed and nobody is
  // notified, so the store is never left half-applied and no listener ever
  // sees an in-between state (e.g. two Entries overlapping mid-move).
  const batch = (actions) => {
    commit(actions.reduce(reducer, state));
  };

  dispatch({}); // initialise state

  return {
    getState,
    dispatch,
    batch,
    subscribe,
  };
};
