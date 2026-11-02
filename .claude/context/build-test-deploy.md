# Build, test and deploy

## Overview

Tooling, publication and the scheduled surprise question. No server: the
build is a static site.

- `package.json` — scripts `dev` (vite; `-- --mode kids` for the kids
  edition), `test` (vitest run), `typecheck` (vue-tsc --noEmit), `build`
  (`vite build && vite build --mode kids` → `dist/` and `dist/kids/`),
  `domanda-a-sorpresa` (`node scripts/domanda-a-sorpresa.mjs`). Runtime deps: `vue`,
  `vue-router`, `markdown-it`; `zod` and `@types/node` are dev-only.
- `vite.config.ts` — a function of the mode: `base` `/` (kids: `/kids/`),
  `build.outDir` `dist` (kids: `dist/kids`), alias `@lezioni` →
  `contenuti/lezioni` (kids: `contenuti/kids`), `@vitejs/plugin-vue`; Vitest
  block: `environment: 'jsdom'`, `include: ['tests/**/*.test.ts']`,
  `css: true`.
- `tsconfig.json` — strict, bundler resolution, `verbatimModuleSyntax`
  (type-only imports must use `import type`), `noEmit`, `allowJs` (tests
  import the `.mjs` scripts under `scripts/`, typed by their JSDoc); covers
  `src/`, `tests/`, `vite.config.ts`.
- `index.html` — `lang="it"`, favicon `/maies-icona.svg` and
  `apple-touch-icon` `/maies-icona-512.png`, loads Poppins from Google Fonts,
  mounts `/src/main.ts` on `#app`.
- `public/` — the app icon files, copied into both editions (Vite prefixes
  their URLs with each edition's base).
- `CNAME` — `maies.chosko.com`.
- `.github/workflows/deploy.yml` — on push to `main`: `npm ci`,
  typecheck, test, build, upload `dist/` (both editions) and deploy to
  GitHub Pages.
- `scripts/domanda-a-sorpresa.mjs` — the surprise question: plain Node ESM
  typed by JSDoc, no dependencies beyond Node modules. Pure exports
  `scegliVocabolo` (lessons of the three highest lesson numbers weigh 3,
  the rest 1), `componiNotifica` (title, `Come si dice «<it>»?`, click URL
  `#/vocaboli?parola=<encoded global id>`, tag `speech_balloon`),
  `scegliDomanda`, `leggiLezioni` (the `.json` files of a folder, missing
  folder → none) and `esegui` (one POST to `https://ntfy.sh/<NTFY_TOPIC>`;
  no topic or no vocabulary → logs why and exits 0; ntfy error or no
  answer → throws, never naming the topic). Run directly, it reads
  `contenuti/lezioni/` and sets exit code 1 on error.
- `scripts/domanda-a-sorpresa.workflow.yml` — the TEMPLATE of the
  scheduled workflow: cron `17 9`, `47 13`, `23 18` UTC plus
  `workflow_dispatch`, `contents: read`, `npm ci` then
  `npm run domanda-a-sorpresa` with `NTFY_TOPIC` from the repository
  secret. The active `.github/workflows/domanda-a-sorpresa.yml` is a copy a
  person creates by hand on the main branch.
- `tests/` — flat folder of `*.test.ts`, one per module or area, named
  after it (`router`, `navbar`, `tokens`, `catalogo`, `sessione`, …).
  `domanda-a-sorpresa.test.ts` covers the script with a fake `fetch` and
  the real lessons; `domanda-a-sorpresa-workflow.test.ts` reads the
  workflow template as text and pins its schedule, triggers, permissions
  and the secret.
- `README.md` — commands, where lesson content and progress live, one
  section per screen, the one-time Pages setup and the surprise question
  with its three activation steps (Italian).

`dist/` and `node_modules/` are git-ignored build output.

## Public API

- `npm run dev | test | typecheck | build | domanda-a-sorpresa` — the only
  entry points; the deploy workflow runs `typecheck`, `test`, `build` in
  that order, the surprise-question workflow `domanda-a-sorpresa`.

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
- **Workflows under `.github/workflows/` are not written by Claude**: its
  GitHub connection cannot push there. A new workflow lives as a template
  under `scripts/`, the test reads the template, and a person copies it to
  `.github/workflows/` (activation steps in `README.md`).
- A script under `scripts/` runs its side effects only when it is the
  process entry point, so tests can import its functions.
- Project testing policy is full TDD (see `CLAUDE.md`): tests first.

## Domain dependencies

- Hosting, domain, CI gate: `.claude/domain/technical-direction.md`
  § Hosting and deployment.
- Publication design and the manual Pages setup:
  `.claude/domain/features/scheletro-e-pubblicazione.md`.
- Surprise question — choice rule, schedule, ntfy contract, activation:
  `.claude/domain/features/domanda-a-sorpresa.md`.

## Cross-references

- [app-shell.md](./app-shell.md) — what `index.html` mounts and what the
  router/navbar tests cover.
- [styles-tokens.md](./styles-tokens.md) — the stylesheet rules
  `tokens.test.ts` enforces.
- [contenuti.md](./contenuti.md) — the content validity test and the
  zod-out-of-the-bundle check; the lesson format and global id the
  surprise-question script reads.

## When to read the source

- Adding a dependency or script: `package.json`.
- Changing the test environment, test globs or Vite plugins:
  `vite.config.ts`.
- Changing the publish pipeline, Node version or triggers:
  `.github/workflows/deploy.yml`.
- Adding an edition or changing what the kids mode switches:
  `vite.config.ts`, `src/edizione.ts` and `tests/vite-config.test.ts`.
- Changing the surprise question's choice, text or ntfy request:
  `scripts/domanda-a-sorpresa.mjs` and `tests/domanda-a-sorpresa.test.ts`.
- Changing its schedule, triggers or permissions:
  `scripts/domanda-a-sorpresa.workflow.yml` and
  `tests/domanda-a-sorpresa-workflow.test.ts`; the active copy is updated
  by hand.
- Changing fonts loaded or page metadata: `index.html`.
- A `vue-tsc` error about imports: `tsconfig.json` options.
