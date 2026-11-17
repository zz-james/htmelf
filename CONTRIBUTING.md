# Contributing to tinybase-element

Thanks for your interest. Bug reports, fixes and small improvements are welcome.

## Getting started

```bash
npm install
npm run test:run   # run the tests once
npm test           # watch mode
npm run demos      # run the demos in a dev server
npm run size       # how big the library is on its own, minified and gzipped
```

Node 20.19 or later (CI uses 22).

## Ground rules

- **No runtime dependencies.** `package.json` must have no `dependencies`, only `devDependencies`. The library is plain ES modules in `src/` with no build step.
- **Add a test with every change.** Anything touching props ownership should check `countProps()` returns to its starting value. Tests run under jsdom.
- **Keep the invariants.** `CLAUDE.md` lists them (props resolved once on first connect, `renderOnce` semantics, cleanup through `registerCleanup` / `listen`, store `batch` atomicity). A change that breaks one needs a good reason, written up in the PR.
- **Keep demos small.** Each demo is a few files you can read top to bottom. A new demo should show a pattern the existing ones don't.
- **Update the README** when the public API changes.

## Pull requests

1. Fork and branch from `main`.
2. Make the change, with tests.
3. Run `npm run test:run` and `npm run build:demos`; CI runs both.
4. Open a PR describing what changed and why.

Small, focused PRs are reviewed fastest. For a larger change, open an issue first so we can agree on the approach.

## Licence

By contributing you agree your work is released under the [MIT licence](LICENSE).
