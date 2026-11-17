// Helpers for tests of code built on tinybase-element. Not part of the main
// entry point; import from 'tinybase-element/src/testing.js' or a relative path.
import { setAppStore } from './appStore.js';
import { defaultPropsRegistry } from './propsRegistry.js';

// Forget the shared app store and every shared props key, so one test cannot
// leak into the next. Call it from beforeEach / afterEach.
export function resetSharedState() {
  setAppStore(undefined);
  defaultPropsRegistry.clear();
}
