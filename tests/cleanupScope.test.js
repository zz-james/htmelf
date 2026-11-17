import { describe, it, expect, vi, afterEach } from 'vitest';
import { createCleanupScope } from '../src/cleanupScope.js';

describe('createCleanupScope', () => {
  afterEach(() => vi.restoreAllMocks());

  it('runs every added function once, in order, and not again on a second run', () => {
    const scope = createCleanupScope();
    const calls = [];
    scope.add(() => calls.push('a'));
    scope.add(() => calls.push('b'));

    scope.run();
    scope.run();

    expect(calls).toEqual(['a', 'b']);
  });

  it('does nothing when nothing was added', () => {
    expect(() => createCleanupScope().run()).not.toThrow();
  });

  it('can be reused after a run, with only the functions added since', () => {
    const scope = createCleanupScope();
    const first = vi.fn();
    const second = vi.fn();
    scope.add(first);
    scope.run();
    scope.add(second);
    scope.run();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('runs the rest when one throws, and reports the error without rethrowing', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const scope = createCleanupScope();
    const failure = new Error('cleanup failed');
    const after = vi.fn();
    scope.add(() => {
      throw failure;
    });
    scope.add(after);

    expect(() => scope.run()).not.toThrow();

    expect(after).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.any(String), failure);
  });

  describe('listen', () => {
    it('adds the listener now and removes it, with the same options, on run', () => {
      const target = new EventTarget();
      const add = vi.spyOn(target, 'addEventListener');
      const remove = vi.spyOn(target, 'removeEventListener');
      const handler = vi.fn();
      const options = { passive: true };
      const scope = createCleanupScope();

      scope.listen(target, 'ping', handler, options);
      expect(add).toHaveBeenCalledWith('ping', handler, options);
      target.dispatchEvent(new Event('ping'));
      expect(handler).toHaveBeenCalledTimes(1);

      scope.run();
      expect(remove).toHaveBeenCalledWith('ping', handler, options);
      target.dispatchEvent(new Event('ping'));
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
