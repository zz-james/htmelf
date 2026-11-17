// Holds the single app-wide store that TinyBase.getStore() returns.
// The host app creates its store (see createStore in store.js) and registers
// it once at startup, before any component connects:
//
//   import { createStore, setAppStore } from 'tinybase-element';
//   setAppStore(createStore(rootReducer, initialState));
//
// getAppStore() returns undefined until a store is registered; use
// TinyBase.getStore() in components, which throws a clear error instead.
let appStore;

export function setAppStore(store) {
  appStore = store;
}

export function getAppStore() {
  return appStore;
}
