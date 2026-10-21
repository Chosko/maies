# Build, test and deploy

## Overview

Tooling and publication. No server: the build is a static site.

- `package.json` — scripts `dev` (vite), `test` (vitest run), `typecheck`
  (vue-tsc --noEmit), `build` (vite build → `dist/`). Runtime deps: `vue`,
  `vue-router`.
- `vite.config.ts` — `base: '/'`, `@vitejs/plugin-vue`; Vitest block:
  `environment: 'jsdom'`, `include: ['tests/**/*.test.ts']`, `css: true`.
- `tsconfig.json` — strict, bundler resolution, `verbatimModuleSyntax`
  (type-only imports must use `import type`), `noEmit`; covers `src/`,
  `tests/`, `vite.config.ts`.
- `index.html` — `lang="it"`, loads Poppins from Google Fonts, mounts
  `/src/main.ts` on `#app`.
- `CNAME` — `maies.chosko.com`.
- `.github/workflows/deploy.yml` — on push to `main`: `npm ci`,
  typecheck, test, build, upload `dist/` and deploy to GitHub Pages.
- `tests/` — flat folder of `*.test.ts`, one per area:
  `router.test.ts`, `navbar.test.ts`, `tokens.test.ts`.
- `README.md` — commands and the one-time Pages setup (Italian).

`dist/` and `node_modules/` are git-ignored build output.

## Public API

- `npm run dev | test | typecheck | build` — the only entry points; the
  workflow runs `typecheck`, `test`, `build` in that order.

## Internal patterns

- **A failing typecheck or test blocks publication**: the deploy job needs
  the build job, so the site stays at the previous version.
- Tests mount the real `App` with a fresh `createAppRouter()` via
  `@vue/test-utils`, then `await router.isReady()` and `flushPromises()`.
- `css: true` lets tests import stylesheets; `tokens.test.ts` reads them
  with `import.meta.glob` to lint them (rules in
  [styles-tokens.md](./styles-tokens.md)).
- `base: '/'` matches the custom domain at the root; hash routing avoids
  needing Pages rewrites.
- Project testing policy is full TDD (see `CLAUDE.md`): tests first.

## Domain dependencies

- Hosting, domain, CI gate: `.claude/domain/technical-direction.md`
  § Hosting and deployment.
- Publication design and the manual Pages setup:
  `.claude/domain/features/scheletro-e-pubblicazione.md`.

## Cross-references

- [app-shell.md](./app-shell.md) — what `index.html` mounts and what the
  router/navbar tests cover.
- [styles-tokens.md](./styles-tokens.md) — the stylesheet rules
  `tokens.test.ts` enforces.

## When to read the source

- Adding a dependency or script: `package.json`.
- Changing the test environment, test globs or Vite plugins:
  `vite.config.ts`.
- Changing the publish pipeline, Node version or triggers:
  `.github/workflows/deploy.yml`.
- Changing fonts loaded or page metadata: `index.html`.
- A `vue-tsc` error about imports: `tsconfig.json` options.
