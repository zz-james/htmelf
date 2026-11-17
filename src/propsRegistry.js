// Lets a parent component pass complex values (objects, arrays, callback
// functions) down to a child that's about to be rendered into an HTML
// template string, which can otherwise only carry primitive attribute
// values. The parent calls setProps(...) while building its template and
// embeds the returned key="..." attribute; the child looks itself up via
// getProps(key) once connected (see TinyBase.connectedCallback).
//
// Ownership: the component that allocates a key owns it, and is the only
// thing that frees it. TinyBase releases everything a component allocated
// when it renders again (the old markup is being replaced) and when it
// disconnects. A child never deletes the key it was given, so:
//   - markup built but never mounted is still freed, by its owner
//   - a child that is disconnected and reconnected (a DOM move) keeps its
//     props: it resolves them once, on first connect, and holds on to them
//   - a child must not rely on getProps(key) after its owner has
//     re-rendered or disconnected - by then the key no longer resolves
//
// Each registry is independent: createPropsRegistry() gives a fresh one, and
// the module-level functions below are bound to a shared default instance
// that TinyBase uses unless told otherwise (see TinyBase.withContext).

export function createPropsRegistry() {
  // key -> props
  const registry = new Map();
  // owner -> the keys it allocated, so releasing an owner touches only its own
  // keys instead of walking every key in the registry on every render
  let keysByOwner = new WeakMap();

  const getProps = (key) => registry.get(key);

  // `owner` is the component instance whose functions in newProps get bound
  // to it, so a callback runs with the right `this` no matter who ends up
  // invoking it (e.g. a grandchild component holding the reference).
  // newProps is left untouched; the registry stores a bound copy.
  const setProps = (owner, newProps, returnKey = false) => {
    if (newProps === null || typeof newProps !== 'object' || Array.isArray(newProps)) {
      throw new TypeError('setProps expects a plain object of { key: value } props');
    }

    const props = Object.fromEntries(
      Object.entries(newProps).map(([name, value]) => [
        name,
        typeof value === 'function' ? value.bind(owner) : value,
      ])
    );

    const key = crypto.randomUUID();
    registry.set(key, props);
    if (!keysByOwner.has(owner)) {
      keysByOwner.set(owner, new Set());
    }
    keysByOwner.get(owner).add(key);

    return returnKey ? key : `key="${key}"`;
  };

  const releaseAllOwnedBy = (owner) => {
    const keys = keysByOwner.get(owner);
    if (!keys) {
      return;
    }
    keys.forEach((key) => registry.delete(key));
    keysByOwner.delete(owner);
  };

  // how many keys are currently allocated - for tests and leak checks
  const countProps = () => registry.size;

  // forget everything, for tests that share a registry
  const clear = () => {
    registry.clear();
    keysByOwner = new WeakMap();
  };

  return { getProps, setProps, releaseAllOwnedBy, countProps, clear };
}

export const defaultPropsRegistry = createPropsRegistry();

export const { getProps, setProps, releaseAllOwnedBy, countProps } = defaultPropsRegistry;
