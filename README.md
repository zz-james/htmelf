# tinybase-element

A zero-dependency base class for vanilla web components, plus a tiny Redux-style store. Extracted from the ELiDDI project.

- `TinyBase` - a `HTMLElement` subclass with a render lifecycle, automatic cleanup and a way to pass objects and callbacks to child components through HTML attributes.
- `createStore` / `combineReducers` - a minimal Redux clone (`getState`, `dispatch`, `batch`, `subscribe`).
- `setAppStore` / `getAppStore` - holds the single store that `TinyBase#getStore()` returns.
- `propsRegistry` - the registry behind `setProps` / `getProps`.

No runtime dependencies. `jsdom` and `vitest` are dev-only.

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
    this.registerCleanup(this.getStore().subscribe(() => this.render()));
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
- A child must not call `getProps(key)` after its owner has re-rendered; the key no longer resolves.
- `countProps()` returns the number of live keys, for leak checks in tests.
- To replace part of your markup outside `render()`, call `releaseOwnedProps()` first.

## Store

```js
const store = createStore(rootReducer, optionalInitialState);
store.getState();
store.dispatch(action);
store.batch([a, b, c]); // one state change, one notification; nothing is committed if the reducer throws
const unsubscribe = store.subscribe(listener);
```

`combineReducers({ a, b })` combines slice reducers. A listener that throws is logged and does not stop other listeners. A listener unsubscribed during dispatch is not called.

## Demos

**[Try the live demos](https://zz-james.github.io/tinybase-element/).** Three small demos live in `demos/`, each a single `main.js` you can read top to bottom:

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
```
