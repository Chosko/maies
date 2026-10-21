# Styles and design tokens

## Overview

How the approved design system reaches the page: tokens become CSS custom
properties at runtime, and three global stylesheets use only those
properties. No component carries scoped styles.

- `src/styles/tokens.ts` — reads `design/tokens.json`, turns it into CSS
  variables, injects them into `<head>`.
- `src/styles/base.css` — reset, `body` typography and colours, headings,
  links, form-control font, placeholder colour, `.titolo-schermata`.
- `src/styles/elements.css` — common elements at phone size: `.fondo`
  (glow background), `.bandiera*` (flag), `.schermata` (screen column),
  `.carta`, `.carta-pila` / `.carta-dietro` (card peeking behind),
  `.bottone`, `.bottone-principale`, `.bottone-secondario`, `.etichetta`,
  `.campo`, `.cerchio-icona`, `.barra*` and `.voce*` (navigation).
- `src/styles/computer.css` — the computer variants, all inside one
  `@media (min-width: 768px)` block.
- `design/tokens.json` — token source (copied from the design system; edit
  only when the design changes).

Tests: `tests/tokens.test.ts` ("design tokens" and "stylesheets" blocks).

## Public API

- `tokenVariables(tokens: DesignTokens): [string, string][]` — pure; maps
  tokens to variable/value pairs: `--color-<name>`, `--font-<family>`,
  `--type-<style>-size|line|weight`, and `--<name>` for spacing and radius
  tokens (e.g. `--space-2`).
- `tokensCss(tokens = designTokens): string` — a `:root { … }` block.
- `installTokens(doc = document): void` — prepends
  `<style id="design-tokens">` to `doc.head`; idempotent (returns if the id
  exists). Called once from `src/main.ts`.
- `DesignTokens` — the interface of the parts of `tokens.json` it reads.
- CSS classes listed in the overview are the API views and components use.

## Internal patterns

Enforced by `tests/tokens.test.ts` over every `src/**/*.css` file and every
`<style>` block of `src/**/*.vue`:

- **No hand-written colour**: no hex literal and no `rgb()/hsl()/lab()/…`
  function; colours come only from `var(--color-…)`.
- `font-family`, `font-size`, `line-height`, `border-radius` take only a
  `var(--…)` or `inherit`; the `font` shorthand is forbidden;
  `font-weight` is a variable or 400/500/600.
- `padding`, `margin`, `gap` (and their longhands) and `left`/`right` take
  only `var(--…)`, `0` or `auto` — no bare lengths.
- **One breakpoint, one place**: the only width media query in the whole
  stylesheet set is `@media (min-width: 768px)`, in `computer.css`. Every
  phone/computer difference goes in that block.

Other conventions:

- `elements.css` is phone-first; computer overrides repeat the selector in
  `computer.css`.
- `.fondo` uses `overflow: clip` (not `hidden`) so the sticky bar is not
  trapped in a scroll container.
- The `.carta-pila` peek effect needs the front and back cards in the same
  container (comment in `elements.css`).
- Global stylesheets are imported in `main.ts` order: base, elements,
  computer; the token `<style>` is prepended so it comes first.

## Domain dependencies

- Visual foundations, components, icons, voice:
  `design/design-system.md`; reference screens: `design/schermate/`
  (where they disagree with the design system, the screens win — per
  `design/design-system.md`).
- Token values: `design/tokens.json`.
- Responsive layout and the single breakpoint:
  `.claude/domain/features/scheletro-e-pubblicazione.md`.

## Cross-references

- [app-shell.md](./app-shell.md) — the components and views that use these
  classes.
- [build-test-deploy.md](./build-test-deploy.md) — `css: true` in the Vitest
  config, needed by the stylesheet tests.

## When to read the source

- Adding a new token family or changing variable naming:
  `tokenVariables()` in `src/styles/tokens.ts` (and `DesignTokens`).
- Adding or restyling a shared element (card, button, field): the matching
  block in `src/styles/elements.css`, then its override in `computer.css`.
- Any change to the computer layout: `src/styles/computer.css`.
- A stylesheet test fails: the parsing helpers (`propertyValues`,
  `topLevelParts`, `bareLengths`) at the top of `tests/tokens.test.ts`.
