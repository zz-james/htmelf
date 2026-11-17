import { getAppStore } from './appStore.js';
import { createCleanupScope } from './cleanupScope.js';
import * as propsRegistry from './propsRegistry.js';

export class TinyBase extends HTMLElement {
  key;
  cleanups = createCleanupScope();

  constructor() {
    super();
    // every render() replaces this component's previous markup, so first
    // free the props it handed out to that markup (see propsRegistry.js).
    // Wrapped here, once, so subclasses can keep calling this.render()
    // directly (e.g. from a reset method) without remembering to release
    const renderMarkup = this.render;
    this.render = (...args) => {
      this.releaseOwnedProps();
      return renderMarkup.apply(this, args);
    };
  }

  // Lifecycle rule - anything that outlives a single render is set up in
  // connectedCallback and torn down through registerCleanup, which
  // disconnectedCallback runs:
  //   - listeners on `this`, `document` or `window`: use listen()
  //   - timers, store subscriptions, helper objects that own timers
  //     (e.g. a controller with a destroy() method): registerCleanup()
  // Listeners on elements this component's own render() creates may be
  // bound directly in render(): they are discarded with that markup.
  registerCleanup(cleanupFn) {
    this.cleanups.add(cleanupFn);
  }

  // addEventListener, removed again when this component disconnects
  listen(target, type, handler, options) {
    this.cleanups.listen(target, type, handler, options);
  }

  // A component sets `static renderOnce = true` when its markup must survive
  // a DOM move: it renders on first connect only, and a reconnect keeps that
  // markup (with whatever state it holds), re-running just the rest of its
  // connectedCallback - so listeners and subscriptions, which disconnect
  // tore down, must be set up there, per the lifecycle rule above. Every
  // other component re-renders on each connect.
  connectedCallback() {
    this.resolveProps();
    if (this.constructor.renderOnce && this.hasRendered) {
      return;
    }
    this.render();
    this.hasRendered = true;
  }

  // props are resolved on first connect and kept: on a reconnect (a DOM
  // move) the parent may already have released the key
  resolveProps() {
    this.key = this.getAttribute('key');
    this.props = this.getProps(this.key) ?? this.props;
  }

  getProps(key) {
    return propsRegistry.getProps(key);
  }

  getStore() {
    return getAppStore();
  }

  setProps(newProps, returnKey = false) {
    return propsRegistry.setProps(this, newProps, returnKey);
  }

  // for a component that replaces part of its markup outside render()
  // (e.g. a method that re-renders only one section)
  releaseOwnedProps() {
    propsRegistry.releaseAllOwnedBy(this);
  }

  disconnectedCallback() {
    this.releaseOwnedProps();
    this.cleanups.run();
  }

  render() {
    // overriden by child components
  }
}
