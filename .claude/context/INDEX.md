# Context index

Layout: flat
Last updated: 2026-10-21

Map of the maies codebase: a Vue 3 + TypeScript single-page app built with
Vite, tested with Vitest, published on GitHub Pages. Read this index, then
only the context files relevant to your task. For what the product is and
why it is built this way, see [../domain/INDEX.md](../domain/INDEX.md).

## Context files

| File | Covers | Status |
| --- | --- | --- |
| [app-shell.md](./app-shell.md) | App bootstrap, `App.vue`, router and routes, navigation bar, flag background, the four screen views | complete |
| [styles-tokens.md](./styles-tokens.md) | Design tokens turned into CSS variables, the global stylesheets, the single 768px breakpoint and the rules the tests enforce on CSS | complete |
| [build-test-deploy.md](./build-test-deploy.md) | npm scripts, Vite/TypeScript config, `index.html`, test layout, the GitHub Pages workflow and custom domain | complete |

## Outside the context layer

- `design/` — the approved design copied into the repo (design system,
  `tokens.json`, reference screens). Canonical for how the UI looks; read
  [../../design/README.md](../../design/README.md) first.
- `.claude/domain/` — product and feature documents (canonical domain layer).
