// A list of teardown functions that run together, once. TinyBase gives each
// component one scope and runs it on disconnect; it has no DOM dependency, so
// it can be used and tested on its own.
export function createCleanupScope() {
  let cleanupFns = [];

  // register a function to call when the scope runs
  const add = (cleanupFn) => {
    cleanupFns.push(cleanupFn);
  };

  // addEventListener, removed again when the scope runs
  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    add(() => target.removeEventListener(type, handler, options));
  };

  // Runs every registered function, then forgets them, so a second run does
  // nothing. The list is emptied first and each function is isolated: one
  // that throws is reported and must not stop the ones after it.
  const run = () => {
    const toRun = cleanupFns;
    cleanupFns = [];
    toRun.forEach((cleanupFn) => {
      try {
        cleanupFn();
      } catch (error) {
        console.error('A cleanup function threw:', error);
      }
    });
  };

  return { add, listen, run };
}
