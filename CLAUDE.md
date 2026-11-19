# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm test                          # vitest, watch mode
npm run test:run                  # run once
npx vitest run tests/store.test.js  # single test file
npx vitest run -t "name"          # tests matching a name
npm run demos                     # vite dev server for demos/
npm run build:demos               # static build into dist-demos/ (gitignored)
npm run size                      # bundled/minified/gzip/brotli size of src/index.js alone (scripts/size.mjs)
```

Tests run under jsdom (see `vitest.config.js`). Unit tests for `src/` live in `tests/` (one `<module>.test.js` per module); each demo keeps its tests beside it in `demos/`. There is no lint step and the library has no build: the package (`htmelf`, MIT) ships `src/` as plain ES modules (`"type": "module"`, entry `src/index.js`). `vite`, `jsdom` and `vitest` are dev-only. `package.json` must never gain `dependencies`.

CI (`.github/workflows/ci.yml`) runs `npm run test:run` then `npm run build:demos` on PRs and pushes to `main`. `deploy-demos.yml` publishes `dist-demos/` to GitHub Pages from `main`. Run both locally before opening a PR. `CONTRIBUTING.md` has the contribution rules.

## Workflow

`workflow_guide.md` is the source of truth for issue handling, branching and commits. In short:

- The repo's GitHub Project board is https://github.com/users/zz-james/projects/2 (owner `zz-james`, project number 2, private). Its Status field is Backlog / Ready / In progress / In review / Done, Priority is P0-P2, and Size is XS-XL. These are separate from the `status:*`, `priority:*` and `size:*` labels in the guide, which exist as repo labels. Keep the two in step when moving an issue. `gh project` commands need the `read:project` / `project` token scopes.
- Work is tracked as GitHub issues labelled `type:*` (bug, feature, tech-debt) and `status:*`. Move an issue `todo` -> `in-progress` when starting and `in-review` when the PR opens.
- Branch as `bugfix/`, `feature/` or `chore/` + issue number + short hyphenated description, e.g. `feature/211-implement-oauth-google-sign-in`.
- Commit messages follow Conventional Commits (`fix:`, `feat:`, `chore:`, `docs:`, `style:`, `refactor:`, `test:`). The PR description must end with `Closes #N` and carry the issue's `type:*` and `priority:*` labels.

## Architecture

htmelf is a base class for vanilla web components plus a minimal Redux-style store. See `README.md` for usage and the public API. The parts below span several files.

- `src/base.js` - the `Htmelf` class (extends `HTMLElement`). Its constructor wraps `this.render` so every call, including direct calls from subclasses, first runs `releaseOwnedProps()`. Don't bypass that wrapper.
- `src/cleanupScope.js` - `createCleanupScope()`: the list of teardown functions behind `registerCleanup` / `listen`. `run()` empties the list first and isolates each function, so one that throws can't stop the rest. Each `Htmelf` holds one as `this.cleanups` and runs it on disconnect.
- `src/propsRegistry.js` - `createPropsRegistry()` returns an independent registry: a `Map` of `key -> props` plus a `WeakMap` of owner -> its keys so releasing an owner touches only its own keys. The module also exports a shared `defaultPropsRegistry` and its functions, which `Htmelf` uses through its `propsRegistry` getter. `Htmelf.withContext({ store, propsRegistry })` returns a base class using different ones; a parent and its children must share a registry. `src/testing.js` has `resetSharedState()` for tests (not exported from `index.js`). `Htmelf#setProps`/`getProps`/`releaseOwnedProps` delegate to it. Props are passed to child components through a `key="<uuid>"` HTML attribute. The component that calls `setProps` owns the key. A child never frees a key it was given.
- `src/appStore.js` - `setAppStore` registers a single global store, which `Htmelf#getStore()` returns.
- `src/store.js` + `src/subscriptions.js` + `src/combineReducers.js` - the Redux clone. `createStore` owns state, `dispatch` and `batch` and delegates listener bookkeeping to `createSubscriptions()` (snapshot iteration, skip-if-unsubscribed-mid-notify, error isolation). `store.js` re-exports `combineReducers`.
- `src/index.js` - the public exports (`Htmelf`, store functions, `setAppStore`/`getAppStore`, and the props registry functions including `countProps`).
- `demos/` - three small apps (`todo`, `kanban`, `stopwatch`), each with one component per file, a `reducer.js`, a `main.js` that sets the store and then defines the elements, and tests that `vitest` picks up. Define elements only after `setAppStore`: defining upgrades markup already on the page. `demos/vite.config.js` aliases `htmelf` to `src/index.js`, so demos import the package by name. A new demo needs an entry in that config's `rollupOptions.input` and a link from `demos/index.html`.

### Invariants to preserve

- Props are resolved once, on first connect (`resolveProps`), and kept. On a DOM move the owner may already have released the key, so a reconnect must not clear `this.props`. `this.props` defaults to `{}`.
- `static renderOnce = true` makes a component render on first connect only. Reconnects skip `render()` but still run the rest of `connectedCallback`. Subscriptions and listeners are torn down on disconnect, so they must be set up in `connectedCallback`, not in `render()`.
- Anything that outlives a render goes through `registerCleanup()`, `listen()` or `watchStore()` (a store subscription whose cleanup is registered for you), which `disconnectedCallback` runs. Subclasses that override `connectedCallback` or `disconnectedCallback` must call `super`.
- Store: listeners are notified only when the reducer returns a different state object (`===`); `combineReducers` returns the previous object when no slice changed, so reducers must never mutate state in place. `batch()` commits nothing if the reducer throws. A throwing listener is logged and doesn't stop the others. A listener unsubscribed during dispatch is not called.
- `countProps()` exists for leak checks in tests. Anything touching props ownership should check it returns to its starting value.
- Update `README.md` when the public API changes.

### Code notes

- Relative imports in `src/` use explicit `.js` extensions, so the package loads in Node or a browser without a bundler. Keep that in new code.
