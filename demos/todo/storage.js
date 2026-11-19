import { createStore } from 'htmelf';

// A store seeded from, and saved to, localStorage. Storage that is missing,
// full or holds bad JSON never breaks the app: it just starts empty, or the
// list does not survive a reload.
export function createPersistentStore(reducer, storageKey) {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(storageKey));
  } catch {
    // no storage or bad JSON: start empty
  }
  const store = createStore(reducer, saved ?? undefined);
  store.subscribe(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(store.getState()));
    } catch {
      // storage unavailable: the list just won't survive a reload
    }
  });
  return store;
}
