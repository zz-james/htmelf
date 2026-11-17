import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TinyBase } from './base';
import { countProps } from './propsRegistry';
import { createStore } from './store';
import { setAppStore } from './appStore';

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
});
