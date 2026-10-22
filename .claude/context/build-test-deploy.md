# Build, test and deploy

## Overview

Tooling and publication. No server: the build is a static site.

- `package.json` — scripts `dev` (vite; `-- --mode kids` for the kids
  edition), `test` (vitest run), `typecheck` (vue-tsc --noEmit), `build`
  (`vite build && vite build --mode kids` → `dist/` and `dist/kids/`). Runtime deps: `vue`,
  `vue-router`, `markdown-it`; `zod` and `@types/node` are dev-only.
- `vite.config.ts` — a function of the mode: `base` `/` (kids: `/kids/`),
  `build.outDir` `dist` (kids: `dist/kids`), alias `@lezioni` →
  `contenuti/lezioni` (kids: `contenuti/kids`), `@vitejs/plugin-vue`; Vitest
  block: `environment: 'jsdom'`, `include: ['tests/**/*.test.ts']`,
  `css: true`.
- `tsconfig.json` — strict, bundler resolution, `verbatimModuleSyntax`
  (type-only imports must use `import type`), `noEmit`; covers `src/`,
  `tests/`, `vite.config.ts`.
- `index.html` — `lang="it"`, favicon `/maies-icona.svg` and
  `apple-touch-icon` `/maies-icona-512.png`, loads Poppins from Google Fonts,
  mounts `/src/main.ts` on `#app`.
- `public/` — the app icon files, copied into both editions (Vite prefixes
  their URLs with each edition's base).
- `CNAME` — `maies.chosko.com`.
- `.github/workflows/deploy.yml` — on push to `main`: `npm ci`,
  typecheck, test, build, upload `dist/` (both editions) and deploy to
  GitHub Pages.
- `tests/` — flat folder of `*.test.ts`, one per module or area, named
  after it (`router`, `navbar`, `tokens`, `catalogo`, `sessione`, …).
- `README.md` — commands, where lesson content and progress live, one
  section per screen, and the one-time Pages setup (Italian).

`dist/` and `node_modules/` are git-ignored build output.

## Public API

- `npm run dev | test | typecheck | build` — the only entry points; the
  workflow runs `typecheck`, `test`, `build` in that order.

## Internal patterns

- **A failing typecheck or test blocks publication**: the deploy job needs
  the build job, so the site stays at the previous version.
- Tests mount the real `App` with a fresh `createAppRouter()` via
  `@vue/test-utils`, then `await router.isReady()` and `flushPromises()`.
- Tests run in `jsdom`; a test that reads files from disk opts into Node
  with a first line `// @vitest-environment node` plus
  `/// <reference types="node" />` (`@types/node` is not in `tsconfig`'s
  `types`).
- **Lesson files gate publication too**: `tests/contenuti.test.ts` validates
  `contenuti/lezioni/` inside `npm test` (rules in
  [contenuti.md](./contenuti.md)).
- `css: true` lets tests import stylesheets; `tokens.test.ts` reads them
  with `import.meta.glob` to lint them (rules in
  [styles-tokens.md](./styles-tokens.md)).
- `base: '/'` matches the custom domain at the root and `/kids/` serves the
  kids edition from `dist/kids/`; hash routing avoids needing Pages rewrites.
- `tests/vite-config.test.ts` calls the config function for both modes and
  pins the build script; `tests/icona.test.ts` pins the icon links.
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
- [contenuti.md](./contenuti.md) — the content validity test and the
  zod-out-of-the-bundle check.

## When to read the source

- Adding a dependency or script: `package.json`.
- Changing the test environment, test globs or Vite plugins:
  `vite.config.ts`.
- Changing the publish pipeline, Node version or triggers:
  `.github/workflows/deploy.yml`.
- Adding an edition or changing what the kids mode switches:
  `vite.config.ts`, `src/edizione.ts` and `tests/vite-config.test.ts`.
- Changing fonts loaded or page metadata: `index.html`.
- A `vue-tsc` error about imports: `tsconfig.json` options.
