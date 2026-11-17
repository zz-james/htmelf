import { describe, it, expect, vi, afterEach } from 'vitest';
import { createSubscriptions } from './subscriptions.js';

describe('createSubscriptions', () => {
  afterEach(() => vi.restoreAllMocks());

  it('calls every subscriber on each notify, until it unsubscribes', () => {
    const { subscribe, notify } = createSubscriptions();
    const a = vi.fn();
    const b = vi.fn();
    const unsubscribeA = subscribe(a);
    subscribe(b);

    notify();
    unsubscribeA();
    notify();

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
  });

  it('does not call a listener subscribed during notify until the next notify', () => {
    const { subscribe, notify } = createSubscriptions();
    const late = vi.fn();
    subscribe(() => subscribe(late));

    notify();
    expect(late).not.toHaveBeenCalled();

    notify();
    expect(late).toHaveBeenCalledTimes(1);
  });

  it('does not call a listener that an earlier listener unsubscribed during notify', () => {
    const { subscribe, notify } = createSubscriptions();
    const second = vi.fn();
    let unsubscribeSecond;
    subscribe(() => unsubscribeSecond());
    unsubscribeSecond = subscribe(second);

    notify();

    expect(second).not.toHaveBeenCalled();
  });

  it('keeps notifying later listeners when one throws, and reports the error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { subscribe, notify } = createSubscriptions();
    const failure = new Error('listener failed');
    const after = vi.fn();
    subscribe(() => {
      throw failure;
    });
    subscribe(after);

    expect(() => notify()).not.toThrow();

    expect(after).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.any(String), failure);
  });

  it('treats each subscription separately, even of the same function', () => {
    const { subscribe, notify } = createSubscriptions();
    const listener = vi.fn();
    const first = subscribe(listener);
    subscribe(listener);

    first();
    notify();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('throws immediately when subscribing something that is not a function', () => {
    const { subscribe } = createSubscriptions();

    expect(() => subscribe('nope')).toThrow(TypeError);
  });

  it('makes a repeated unsubscribe a no-op', () => {
    const { subscribe, notify } = createSubscriptions();
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    unsubscribe();
    unsubscribe();

    expect(() => notify()).not.toThrow();
    expect(listener).not.toHaveBeenCalled();
  });
});
