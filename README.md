# tinybase-element

A zero-dependency base class for vanilla web components, plus a tiny Redux-style store.

- `TinyBase` - a `HTMLElement` subclass with a render lifecycle, automatic cleanup and a way to pass objects and callbacks to child components through HTML attributes.
- `createStore` / `combineReducers` - a minimal Redux clone (`getState`, `dispatch`, `batch`, `subscribe`).
- `setAppStore` / `getAppStore` - holds the single store that `TinyBase#getStore()` returns. `getStore()` throws a clear error if no store has been registered.
- `propsRegistry` - the registry behind `setProps` / `getProps`.

No runtime dependencies. `vite`, `jsdom` and `vitest` are dev-only.

## Usage

```js
import { TinyBase, createStore, setAppStore } from 'tinybase-element';

// 1. register your store once, before any component connects
const reducer = (state = { count: 0 }, action) =>
  action.type === 'inc' ? { count: state.count + 1 } : state;
setAppStore(createStore(reducer));

// 2. extend TinyBase, override render(), and define the element
class CounterButton extends TinyBase {
  connectedCallback() {
    super.connectedCallback();
    this.watchStore(); // re-render on every store change; unsubscribes on disconnect
  }

  render() {
    this.innerHTML = `<button>${this.getStore().getState().count}</button>`;
    this.querySelector('button').onclick = () => this.getStore().dispatch({ type: 'inc' });
  }
}
customElements.define('counter-button', CounterButton);
```

## Component lifecycle

- `connectedCallback` resolves props, then calls `render()`. It re-renders on every reconnect, unless the class sets `static renderOnce = true`, in which case it renders on first connect only and keeps its markup across DOM moves.
- Anything that outlives a single render (store subscriptions, timers) is set up in `connectedCallback` and torn down with `registerCleanup(fn)`. `disconnectedCallback` runs those functions.
- `watchStore(listener = () => this.render())` subscribes to the store and registers the unsubscribe for you. It returns the unsubscribe function, for stopping early. Call it from `connectedCallback`, before or after `super.connectedCallback()`.
- `listen(target, type, handler, options)` is `addEventListener` that is removed again on disconnect. Use it for listeners on `this`, `document` or `window`.
- Listeners on elements your own `render()` creates can be bound directly: they go away with that markup.
- If you override `connectedCallback` or `disconnectedCallback`, call `super`.

## Passing props to children

Template strings can only carry string attributes. `setProps` lets a parent pass objects and callbacks to a child:

```js
class Parent extends TinyBase {
  render() {
    this.innerHTML = `<my-child ${this.setProps({ onSave: (v) => this.save(v) })}></my-child>`;
  }
}

class Child extends TinyBase {
  render() {
    this.props.onSave('hello'); // set before render() runs
  }
}
```

- `setProps(obj)` returns a `key="<uuid>"` attribute string. `setProps(obj, true)` returns the bare key.
- Functions in `obj` are bound to the parent, so `this` is correct wherever they are called.
- **Ownership:** the component that calls `setProps` owns the key. It is freed automatically when that component re-renders or disconnects. A child never frees the key it was given, so a child that is moved in the DOM keeps its props.
- `this.props` is `{}` for an element that has no `key` (or whose key no longer resolves), so a child can destructure it safely.
- A child must not call `getProps(key)` after its owner has re-rendered; the key no longer resolves.
- `countProps()` returns the number of live keys, for leak checks in tests.
- To replace part of your markup outside `render()`, call `releaseOwnedProps()` first.

## Store

```js
const store = createStore(rootReducer, optionalInitialState);
store.getState();
store.dispatch(action);
store.batch([a, b, c]); // one state change, one notification (none if nothing changed); nothing is committed if the reducer throws
const unsubscribe = store.subscribe(listener);
```

**Listeners are only notified when the state changes.** A `dispatch` or `batch` whose reducer returns the very same state object (an action it does not handle) notifies nobody. `combineReducers({ a, b })` combines slice reducers and returns the previous state object when no slice changed. This relies on the usual rule: a reducer returns a new value to change state and never mutates it in place, because an in-place change keeps the same reference and will not notify.

A listener that throws is logged and does not stop other listeners. A listener unsubscribed during dispatch is not called.

## Using a different store or registry

By default every component uses the shared app store and the shared props registry. To use others (for example in a test), build a base class with `TinyBase.withContext` and extend that:

```js
import { TinyBase, createStore, createPropsRegistry } from 'tinybase-element';

const Base = TinyBase.withContext({
  store: createStore(reducer),
  propsRegistry: createPropsRegistry(),
});
class MyWidget extends Base {}
```

Both options are optional; whichever you leave out falls back to the shared one. A parent and its children must share a registry, so make every component in a tree extend the same `Base`. `countProps()` only counts the shared registry; use `registry.countProps()` for an injected one.

In tests, `resetSharedState()` from `src/testing.js` (not part of the main entry point) clears the shared store and registry between tests.

## Demos

**[Try the live demos](https://zz-james.github.io/tinybase-element/).** Three small demos live in `demos/`, each a handful of small files (one component per file, wired together in `main.js`) you can read top to bottom:

| Demo | Shows |
| --- | --- |
| `demos/todo` | a store and reducer, `subscribe` + `registerCleanup`, `setProps` callbacks to child components, localStorage persistence |
| `demos/kanban` | `store.batch` for atomic moves, `renderOnce` so cards keep their state when moved in the DOM, `listen` |
| `demos/stopwatch` | timers and document listeners torn down on disconnect, and a live `countProps()` leak check |

```bash
npm run demos        # dev server
npm run build:demos  # static build into dist-demos/
```

## Development

```bash
npm install
npm test          # watch mode
npm run test:run  # run once
npm run demos        # demos dev server
npm run build:demos  # static demos build into dist-demos/
```
