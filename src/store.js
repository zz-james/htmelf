import { createSubscriptions } from './subscriptions.js';

export { combineReducers } from './combineReducers.js';

export const createStore = (reducer, initialState = undefined) => {
  let state = initialState;
  const { subscribe, notify } = createSubscriptions();

  const getState = () => state;

  const dispatch = (action) => {
    state = reducer(state, action);
    notify();
  };

  // Applies several actions as one change: folds them through the reducer to
  // build a single next state, then commits that state and notifies once.
  // If the reducer throws for any action, nothing is committed and nobody is
  // notified, so the store is never left half-applied and no listener ever
  // sees an in-between state (e.g. two Entries overlapping mid-move).
  const batch = (actions) => {
    if (actions.length === 0) {
      return;
    }
    state = actions.reduce(reducer, state);
    notify();
  };

  dispatch({}); // initialise state

  return {
    getState,
    dispatch,
    batch,
    subscribe,
  };
};
