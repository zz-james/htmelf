import { describe, it, expect, vi, afterEach } from 'vitest';
import { createStore, combineReducers } from '../src/store.js';

const counter = (state = 0, action) => (action.type === 'INC' ? state + 1 : state);

describe('createStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initialises state from the reducer, and applies dispatched actions', () => {
    const store = createStore(counter);
    expect(store.getState()).toBe(0);

    store.dispatch({ type: 'INC' });

    expect(store.getState()).toBe(1);
  });

  it('notifies every subscriber once per dispatch, until unsubscribed', () => {
    const store = createStore(counter);
    const a = vi.fn();
    const b = vi.fn();
    store.subscribe(a);
    const unsubscribeB = store.subscribe(b);

    store.dispatch({ type: 'INC' });
    unsubscribeB();
    store.dispatch({ type: 'INC' });

    expect(a).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenCalledTimes(1);
  });

  // regression coverage (#142): unsubscribe replaced the listener array, but
  // dispatch was already iterating the old one, so a listener torn down by
  // an earlier listener in the same dispatch still ran - e.g. a Timeline
  // removed by DynamicTimelineUI.renderStack() on a breakpoint crossing
  // still got updateState() against its detached DOM
  it('does not call a listener that an earlier listener unsubscribed during the same dispatch', () => {
    const store = createStore(counter);
    const torndown = vi.fn();
    let unsubscribeTorndown;
    store.subscribe(() => unsubscribeTorndown());
    unsubscribeTorndown = store.subscribe(torndown);

    store.dispatch({ type: 'INC' });

    expect(torndown).not.toHaveBeenCalled();
  });

  it('does not call a listener subscribed during a dispatch until the next dispatch', () => {
    const store = createStore(counter);
    const late = vi.fn();
    let subscribed = false;
    store.subscribe(() => {
      if (!subscribed) {
        subscribed = true;
        store.subscribe(late);
      }
    });

    store.dispatch({ type: 'INC' });
    expect(late).not.toHaveBeenCalled();

    store.dispatch({ type: 'INC' });
    expect(late).toHaveBeenCalledOnce();
  });

  // regression coverage (#142): one listener throwing aborted every later
  // listener and threw out of dispatch() into whatever DOM event handler
  // called it, leaving the rest of the UI out of step with the store
  it('keeps notifying later listeners when one throws, and does not throw from dispatch', () => {
    const store = createStore(counter);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const later = vi.fn();
    store.subscribe(() => {
      throw new Error('boom');
    });
    store.subscribe(later);

    expect(() => store.dispatch({ type: 'INC' })).not.toThrow();

    expect(later).toHaveBeenCalledOnce();
    expect(store.getState()).toBe(1);
    expect(error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ message: 'boom' })
    );
  });

  // regression coverage (#142): subscribe(nonFunction) logged and returned
  // undefined, which callers hand straight to registerCleanup() - the
  // TypeError then surfaced at teardown, far from the actual mistake
  it('throws immediately when subscribing something that is not a function', () => {
    const store = createStore(counter);
    expect(() => store.subscribe(undefined)).toThrow(TypeError);
  });

  it('treats each subscription separately, even of the same function', () => {
    const store = createStore(counter);
    const listener = vi.fn();
    const unsubscribeFirst = store.subscribe(listener);
    store.subscribe(listener);

    unsubscribeFirst();
    store.dispatch({ type: 'INC' });

    expect(listener).toHaveBeenCalledOnce();
  });

  it('makes a repeated unsubscribe a no-op', () => {
    const store = createStore(counter);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.subscribe(listener);

    unsubscribe();
    unsubscribe();
    store.dispatch({ type: 'INC' });

    expect(listener).toHaveBeenCalledOnce();
  });
});

describe('store.batch', () => {
  const adder = (state = 0, action) => (action.type === 'ADD' ? state + action.n : state);
  const throwing = (state = 0, action) => {
    if (action.type === 'BOOM') throw new Error('reducer failed');
    return adder(state, action);
  };

  it('ends in the same state as dispatching the actions one by one', () => {
    const actions = [
      { type: 'ADD', n: 2 },
      { type: 'ADD', n: 5 },
      { type: 'ADD', n: 1 },
    ];
    const batched = createStore(adder);
    const sequential = createStore(adder);

    batched.batch(actions);
    actions.forEach((action) => sequential.dispatch(action));

    expect(batched.getState()).toBe(sequential.getState());
    expect(batched.getState()).toBe(8);
  });

  it('notifies each subscriber exactly once, with the final state already set', () => {
    const store = createStore(adder);
    const seen = [];
    store.subscribe(() => seen.push(store.getState()));
    const second = vi.fn();
    store.subscribe(second);

    store.batch([
      { type: 'ADD', n: 1 },
      { type: 'ADD', n: 1 },
      { type: 'ADD', n: 1 },
    ]);

    expect(seen).toEqual([3]);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('commits nothing and notifies nobody if an action throws', () => {
    const store = createStore(throwing);
    store.dispatch({ type: 'ADD', n: 4 });
    const listener = vi.fn();
    store.subscribe(listener);

    expect(() =>
      store.batch([{ type: 'ADD', n: 1 }, { type: 'BOOM' }, { type: 'ADD', n: 1 }])
    ).toThrow('reducer failed');

    expect(store.getState()).toBe(4);
    expect(listener).not.toHaveBeenCalled();
  });

  it('notifies nobody for an empty batch', () => {
    const store = createStore(adder);
    const listener = vi.fn();
    store.subscribe(listener);

    store.batch([]);

    expect(listener).not.toHaveBeenCalled();
    expect(store.getState()).toBe(0);
  });

  it('keeps the notification rules: a throwing listener is logged and the rest are still called', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const store = createStore(adder);
    const after = vi.fn();
    store.subscribe(() => {
      throw new Error('listener failed');
    });
    store.subscribe(after);

    expect(() => store.batch([{ type: 'ADD', n: 1 }])).not.toThrow();

    expect(after).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();
  });
});

describe('combineReducers', () => {
  it('delegates each key of state to its own reducer', () => {
    const reducer = combineReducers({ a: counter, b: counter });
    const state = reducer({ a: 5, b: 0 }, { type: 'INC' });
    expect(state).toEqual({ a: 6, b: 1 });
  });
});

describe('notifying only on change', () => {
  const todos = (state = [], action) => (action.type === 'ADD' ? [...state, action.item] : state);
  const flag = (state = false, action) => (action.type === 'FLIP' ? !state : state);

  it('does not notify when the reducer returns the same state', () => {
    const store = createStore(counter);
    const listener = vi.fn();
    store.subscribe(listener);

    store.dispatch({ type: 'UNKNOWN' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('notifies when the reducer returns a new state', () => {
    const store = createStore(counter);
    const listener = vi.fn();
    store.subscribe(listener);

    store.dispatch({ type: 'INC' });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not notify for a batch that changes nothing, and notifies once for one that does', () => {
    const store = createStore(counter);
    const listener = vi.fn();
    store.subscribe(listener);

    store.batch([{ type: 'UNKNOWN' }, { type: 'OTHER' }]);
    expect(listener).not.toHaveBeenCalled();

    store.batch([{ type: 'UNKNOWN' }, { type: 'INC' }, { type: 'INC' }]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not notify for an action no slice of a combined reducer handles', () => {
    const store = createStore(combineReducers({ todos, flag }));
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.getState();

    store.dispatch({ type: 'UNKNOWN' });

    expect(listener).not.toHaveBeenCalled();
    expect(store.getState()).toBe(before);
  });

  it('notifies when any slice changes, leaving the other slices untouched', () => {
    const store = createStore(combineReducers({ todos, flag }));
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.getState();

    store.dispatch({ type: 'ADD', item: 'x' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState()).not.toBe(before);
    expect(store.getState().todos).toEqual(['x']);
    expect(store.getState().flag).toBe(before.flag);
  });
});

describe('combineReducers: reference stability', () => {
  const same = (state = { n: 0 }) => state;
  const bump = (state = 0, action) => (action.type === 'BUMP' ? state + 1 : state);

  it('returns the previous state object when no slice changed', () => {
    const reducer = combineReducers({ a: same, b: bump });
    const first = reducer(undefined, { type: 'INIT' });

    expect(reducer(first, { type: 'UNKNOWN' })).toBe(first);
  });

  it('returns a new object when a slice changed, reusing the unchanged slices', () => {
    const reducer = combineReducers({ a: same, b: bump });
    const first = reducer(undefined, { type: 'INIT' });

    const next = reducer(first, { type: 'BUMP' });

    expect(next).not.toBe(first);
    expect(next.b).toBe(1);
    expect(next.a).toBe(first.a);
  });

  it('builds the full state the first time, even when no slice reacts', () => {
    const reducer = combineReducers({ a: same, b: bump });

    expect(reducer(undefined, { type: 'INIT' })).toEqual({ a: { n: 0 }, b: 0 });
  });

  it('returns a new object when the previous state has a key the reducers do not', () => {
    const reducer = combineReducers({ b: bump });
    const previous = { b: 0, stale: true };

    const next = reducer(previous, { type: 'UNKNOWN' });

    expect(next).not.toBe(previous);
    expect(next).toEqual({ b: 0 });
  });

  it('returns a new object when the previous state is missing a key', () => {
    const reducer = combineReducers({ a: () => undefined, b: bump });
    const previous = { b: 0 };

    expect(reducer(previous, { type: 'UNKNOWN' })).not.toBe(previous);
  });
});
