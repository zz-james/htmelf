import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPropsRegistry,
  getProps,
  setProps,
  releaseAllOwnedBy,
  countProps,
} from './propsRegistry.js';
import { resetSharedState } from './testing.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

beforeEach(resetSharedState);

describe('createPropsRegistry', () => {
  it('gives registries that do not see each other, or the shared default', () => {
    const one = createPropsRegistry();
    const two = createPropsRegistry();
    const owner = {};

    const key = one.setProps(owner, { a: 1 }, true);

    expect(one.getProps(key)).toEqual({ a: 1 });
    expect(two.getProps(key)).toBeUndefined();
    expect(getProps(key)).toBeUndefined();
    expect(one.countProps()).toBe(1);
    expect(two.countProps()).toBe(0);
    expect(countProps()).toBe(0);
  });

  it('releases an owner only from the registry that holds its keys', () => {
    const one = createPropsRegistry();
    const two = createPropsRegistry();
    const owner = {};
    const keyOne = one.setProps(owner, { a: 1 }, true);
    const keyTwo = two.setProps(owner, { b: 2 }, true);

    one.releaseAllOwnedBy(owner);

    expect(one.getProps(keyOne)).toBeUndefined();
    expect(two.getProps(keyTwo)).toEqual({ b: 2 });
  });

  it('forgets everything on clear()', () => {
    const registry = createPropsRegistry();
    const owner = {};
    const key = registry.setProps(owner, { a: 1 }, true);

    registry.clear();

    expect(registry.getProps(key)).toBeUndefined();
    expect(registry.countProps()).toBe(0);
  });
});

describe('propsRegistry', () => {
  it('stores props under a generated key and returns them via getProps', () => {
    const key = setProps({}, { content: [1, 2, 3] }, true);

    expect(getProps(key)).toEqual({ content: [1, 2, 3] });
  });

  it('returns a quoted key="<uuid>" attribute by default, for embedding in a template', () => {
    const result = setProps({}, { content: [] });

    expect(result).toMatch(/^key="[^"]+"$/);
    const key = result.slice('key="'.length, -1);
    expect(getProps(key)).toEqual({ content: [] });
  });

  it('generates keys with crypto.randomUUID()', () => {
    expect(setProps({}, {}, true)).toMatch(UUID);
  });

  it('binds function props to the given owner', () => {
    const owner = { name: 'owner' };
    const callback = vi.fn(function () {
      return this;
    });

    const key = setProps(owner, { onClick: callback }, true);
    const boundCallback = getProps(key).onClick;

    expect(boundCallback()).toBe(owner);
  });

  // regression coverage (#140): functions were rebound in place on the
  // caller's object, so reusing an object re-bound already-bound functions
  it('does not mutate the object passed to it', () => {
    const onClick = function () {};
    const newProps = Object.freeze({ onClick, content: 'x' });

    const key = setProps({}, newProps, true);

    expect(newProps.onClick).toBe(onClick);
    expect(getProps(key)).not.toBe(newProps);
    expect(getProps(key).content).toBe('x');
  });

  // regression coverage (#140): a non-object was logged and undefined
  // returned, which a template embeds as the literal attribute "undefined"
  it.each([
    ['an array', [1, 2, 3]],
    ['null', null],
    ['a string', 'content'],
    ['undefined', undefined],
  ])('throws a TypeError for %s', (_, value) => {
    expect(() => setProps({}, value)).toThrow(TypeError);
  });

  it('releases every key an owner allocated, and only those', () => {
    const owner = {};
    const other = {};
    const before = countProps();
    const ownedA = setProps(owner, { a: 1 }, true);
    const ownedB = setProps(owner, { b: 2 }, true);
    const othersKey = setProps(other, { c: 3 }, true);

    releaseAllOwnedBy(owner);

    expect(getProps(ownedA)).toBeUndefined();
    expect(getProps(ownedB)).toBeUndefined();
    expect(getProps(othersKey)).toEqual({ c: 3 });
    expect(countProps()).toBe(before + 1);
    releaseAllOwnedBy(other);
  });

  it('releasing an owner that has no keys, or twice, does nothing', () => {
    const owner = {};
    const before = countProps();
    setProps(owner, { a: 1 }, true);

    releaseAllOwnedBy({});
    releaseAllOwnedBy(owner);
    releaseAllOwnedBy(owner);

    expect(countProps()).toBe(before);
  });

  it('lets an owner allocate again after it was released', () => {
    const owner = {};
    setProps(owner, { a: 1 }, true);
    releaseAllOwnedBy(owner);

    const key = setProps(owner, { b: 2 }, true);
    expect(getProps(key)).toEqual({ b: 2 });

    releaseAllOwnedBy(owner);
    expect(getProps(key)).toBeUndefined();
  });

  // the cost of releasing one owner must not grow with other owners' keys:
  // it may only touch its own keys, never walk the whole registry
  it('releases an owner without iterating the registry', () => {
    const bystanders = Array.from({ length: 200 }, () => ({}));
    bystanders.forEach((bystander) => setProps(bystander, { x: 1 }, true));
    const owner = {};
    const key = setProps(owner, { a: 1 }, true);
    const iterations = ['forEach', 'keys', 'values', 'entries', Symbol.iterator].map((method) =>
      vi.spyOn(Map.prototype, method)
    );

    releaseAllOwnedBy(owner);

    iterations.forEach((spy) => expect(spy).not.toHaveBeenCalled());
    expect(getProps(key)).toBeUndefined();
    vi.restoreAllMocks();
    bystanders.forEach(releaseAllOwnedBy);
  });
});
