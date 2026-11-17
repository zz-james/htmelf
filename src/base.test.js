import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TinyBase } from './base.js';
import { countProps } from './propsRegistry.js';
import { createStore } from './store.js';
import { setAppStore } from './appStore.js';
import { createPropsRegistry } from './propsRegistry.js';
import { resetSharedState } from './testing.js';

function define(name, cls) {
  if (!customElements.get(name)) {
    customElements.define(name, cls);
  }
}

// bare subclass: exercises the lifecycle helpers
class Harness extends TinyBase {}
define('tb-harness', Harness);

// child that only reads the props its parent handed it
class Child extends TinyBase {
  render() {
    this.textContent = 'child';
  }
}
define('tb-child', Child);

// parent that passes callbacks to a child through the props registry
class Parent extends TinyBase {
  saved = [];
  renders = 0;
  render() {
    this.renders++;
    this.innerHTML = `<tb-child ${this.setProps({
      save: (value) => this.saved.push(value),
    })}></tb-child>`;
  }
}
define('tb-parent', Parent);

// builds markup for a child it never mounts
class UnmountedMarkupHost extends TinyBase {
  render() {
    this.pendingMarkup = `<tb-child ${this.setProps({ noop: () => {} })}></tb-child>`;
  }
}
define('tb-unmounted-host', UnmountedMarkupHost);

class RenderOnce extends TinyBase {
  static renderOnce = true;
  renders = 0;
  render() {
    this.renders++;
    this.innerHTML = '<span></span>';
  }
}
define('tb-render-once', RenderOnce);

beforeEach(() => {
  document.body.innerHTML = '';
  resetSharedState();
});

describe('TinyBase.registerCleanup', () => {
  it('runs every registered cleanup once on disconnect, and not again', () => {
    const el = document.createElement('tb-harness');
    document.body.appendChild(el);
    const a = vi.fn();
    const b = vi.fn();
    el.registerCleanup(a);
    el.registerCleanup(b);

    el.remove();
    document.body.appendChild(el);
    el.remove();

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  describe('when a cleanup throws', () => {
    let errorSpy;
    beforeEach(() => {
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => errorSpy.mockRestore());

    it('still runs the cleanups registered after it, and reports the error', () => {
      const el = document.createElement('tb-harness');
      document.body.appendChild(el);
      const failure = new Error('cleanup failed');
      const before = vi.fn();
      const after = vi.fn();
      el.registerCleanup(before);
      el.registerCleanup(() => {
        throw failure;
      });
      el.registerCleanup(after);

      el.remove();

      expect(before).toHaveBeenCalledTimes(1);
      expect(after).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(expect.any(String), failure);
    });

    it('does not re-run old cleanups after a reconnect', () => {
      const el = document.createElement('tb-harness');
      document.body.appendChild(el);
      const survivor = vi.fn();
      el.registerCleanup(() => {
        throw new Error('cleanup failed');
      });
      el.registerCleanup(survivor);

      el.remove();
      document.body.appendChild(el);
      el.remove();

      expect(survivor).toHaveBeenCalledTimes(1);
    });

    it('still releases the props the component owned', () => {
      const start = countProps();
      const parent = document.createElement('tb-parent');
      document.body.appendChild(parent);
      parent.registerCleanup(() => {
        throw new Error('cleanup failed');
      });
      expect(countProps()).toBeGreaterThan(start);

      parent.remove();

      expect(countProps()).toBe(start);
    });
  });
});

describe('TinyBase.listen', () => {
  it('adds the listener, and removes it on disconnect', () => {
    const el = document.createElement('tb-harness');
    document.body.appendChild(el);
    const handler = vi.fn();

    el.listen(document, 'tb-ping', handler);
    document.dispatchEvent(new Event('tb-ping'));
    el.remove();
    document.dispatchEvent(new Event('tb-ping'));

    expect(handler).toHaveBeenCalledOnce();
  });

  it('passes options through to addEventListener', () => {
    const el = document.createElement('tb-harness');
    document.body.appendChild(el);
    const handler = vi.fn();

    el.listen(el, 'tb-ping', handler, { once: true });
    el.dispatchEvent(new Event('tb-ping'));
    el.dispatchEvent(new Event('tb-ping'));

    expect(handler).toHaveBeenCalledOnce();
  });
});

describe('TinyBase props', () => {
  it('starts with empty props, and keeps them when the element has no key', () => {
    const el = document.createElement('tb-harness');
    expect(el.props).toEqual({});

    document.body.appendChild(el);

    expect(el.props).toEqual({});
  });

  it('keeps empty props when the key no longer resolves', () => {
    const el = document.createElement('tb-harness');
    el.setAttribute('key', 'released-or-never-allocated');

    document.body.appendChild(el);

    expect(el.props).toEqual({});
  });

  it('lets a child that reads its props render without a key', () => {
    class Optional extends TinyBase {
      render() {
        const { label = 'default' } = this.props;
        this.textContent = label;
      }
    }
    define('tb-optional-props', Optional);

    const el = document.createElement('tb-optional-props');
    document.body.appendChild(el);

    expect(el.textContent).toBe('default');
  });

  it('hands a child its parent callbacks, bound to the parent', () => {
    const parent = document.createElement('tb-parent');
    document.body.appendChild(parent);
    const child = parent.querySelector('tb-child');

    expect(child.key).toBe(child.getAttribute('key'));
    child.props.save('x');

    expect(parent.saved).toEqual(['x']);
  });

  it('returns a bare key instead of an attribute with returnKey', () => {
    const el = document.createElement('tb-harness');
    document.body.appendChild(el);

    const key = el.setProps({ a: 1 }, true);

    expect(key).not.toContain('key=');
    expect(el.getProps(key)).toEqual({ a: 1 });
  });

  it('returns the registry to its starting size after repeated mount/unmount', () => {
    const before = countProps();
    for (let i = 0; i < 5; i++) {
      const parent = document.createElement('tb-parent');
      document.body.appendChild(parent);
      parent.render();
      parent.remove();
    }
    expect(countProps()).toBe(before);
  });

  it('does not grow the registry when a mounted component re-renders', () => {
    const parent = document.createElement('tb-parent');
    document.body.appendChild(parent);
    const mounted = countProps();

    for (let i = 0; i < 5; i++) {
      parent.render();
    }

    expect(countProps()).toBe(mounted);
  });

  it('releases keys for markup that was built but never mounted', () => {
    const before = countProps();
    for (let i = 0; i < 5; i++) {
      const host = document.createElement('tb-unmounted-host');
      document.body.appendChild(host);
      host.render();
      host.remove();
    }
    expect(countProps()).toBe(before);
  });

  it('keeps a child working after it is moved in the DOM', () => {
    const parent = document.createElement('tb-parent');
    document.body.appendChild(parent);
    const child = parent.querySelector('tb-child');
    const elsewhere = document.createElement('div');
    parent.appendChild(elsewhere);

    elsewhere.appendChild(child);

    expect(child.props).toBeDefined();
    child.props.save('moved');
    expect(parent.saved).toEqual(['moved']);
  });

  it('re-renders a moved owner without leaking its old keys', () => {
    const before = countProps();
    const parent = document.createElement('tb-parent');
    document.body.appendChild(parent);
    const mounted = countProps();
    const elsewhere = document.createElement('div');
    document.body.appendChild(elsewhere);

    elsewhere.appendChild(parent);

    expect(countProps()).toBe(mounted);
    parent.remove();
    expect(countProps()).toBe(before);
  });
});

describe('TinyBase render lifecycle', () => {
  it('has not rendered before it connects, and has after', () => {
    const el = document.createElement('tb-render-once');
    expect(el.hasRendered).toBe(false);

    document.body.appendChild(el);

    expect(el.hasRendered).toBe(true);
  });

  it('renders on connect and again on every reconnect by default', () => {
    const parent = document.createElement('tb-parent');
    document.body.appendChild(parent);
    parent.remove();
    document.body.appendChild(parent);

    expect(parent.renders).toBe(2);
  });

  it('renders only once with static renderOnce, keeping its markup across a move', () => {
    const el = document.createElement('tb-render-once');
    document.body.appendChild(el);
    const span = el.firstChild;

    el.remove();
    document.body.appendChild(el);

    expect(el.renders).toBe(1);
    expect(el.firstChild).toBe(span);
  });
});

describe('TinyBase.getStore', () => {
  it('returns the store registered with setAppStore', () => {
    const store = createStore((state = 0) => state, 5);
    setAppStore(store);
    const el = document.createElement('tb-harness');

    expect(el.getStore()).toBe(store);
    expect(el.getStore().getState()).toBe(5);
  });

  describe('when no store is registered', () => {
    beforeEach(() => setAppStore(undefined));

    it('throws an error that names setAppStore', () => {
      const el = document.createElement('tb-harness');

      expect(() => el.getStore()).toThrow(/setAppStore/);
    });

    it('fails at the first getStore() call a component makes on connect', () => {
      class NeedsStore extends TinyBase {
        render() {
          this.textContent = String(this.getStore().getState());
        }
      }
      define('tb-needs-store', NeedsStore);
      const el = document.createElement('tb-needs-store');

      expect(() => el.connectedCallback()).toThrow(/no app store is registered/i);
    });
  });
});

describe('TinyBase.withContext', () => {
  it('uses an injected store without setAppStore being called', () => {
    const store = createStore((state = 0) => state, 7);
    const Base = TinyBase.withContext({ store });
    class Counter extends Base {
      render() {
        this.textContent = String(this.getStore().getState());
      }
    }
    define('tb-injected-store', Counter);

    const el = document.createElement('tb-injected-store');
    document.body.appendChild(el);

    expect(el.textContent).toBe('7');
  });

  it('does not change the shared store for plain TinyBase components', () => {
    const shared = createStore((state = 0) => state, 1);
    setAppStore(shared);
    TinyBase.withContext({ store: createStore((state = 0) => state, 2) });

    expect(document.createElement('tb-harness').getStore()).toBe(shared);
  });

  it('falls back to the shared store when only a registry is injected', () => {
    const shared = createStore((state = 0) => state, 3);
    setAppStore(shared);
    class Plain extends TinyBase.withContext({ propsRegistry: createPropsRegistry() }) {}
    define('tb-registry-only', Plain);

    expect(document.createElement('tb-registry-only').getStore()).toBe(shared);
  });

  it('keeps a parent and child on the injected registry, away from the shared one', () => {
    const registry = createPropsRegistry();
    const Base = TinyBase.withContext({ propsRegistry: registry });
    class CtxChild extends Base {
      render() {
        this.textContent = 'child';
      }
    }
    class CtxParent extends Base {
      saved = [];
      render() {
        this.innerHTML = `<tb-ctx-child ${this.setProps({
          save: (value) => this.saved.push(value),
        })}></tb-ctx-child>`;
      }
    }
    define('tb-ctx-child', CtxChild);
    define('tb-ctx-parent', CtxParent);

    const parent = document.createElement('tb-ctx-parent');
    document.body.appendChild(parent);

    expect(registry.countProps()).toBe(1);
    expect(countProps()).toBe(0);
    parent.querySelector('tb-ctx-child').props.save('hi');
    expect(parent.saved).toEqual(['hi']);

    parent.remove();
    expect(registry.countProps()).toBe(0);
  });
});
