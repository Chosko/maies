# App shell

## Overview

The application frame every screen lives in: bootstrap, root component,
routing, navigation bar and background. The screens themselves are in
[schermate.md](./schermate.md).

- `src/main.ts` — entry point: installs the design tokens, imports the three
  global stylesheets, mounts `App` with the router on `#app`.
- `src/App.vue` — root: `FondoBandiera` wrapping `NavBar` and `RouterView`.
- `src/router/index.ts` — route table and router factory.
- `src/components/NavBar.vue` — the four-item navigation bar.
- `src/components/FondoBandiera.vue` — screen background with the
  line-drawn Union Jack SVG; renders its slot on top.
Tests: `tests/router.test.ts`, `tests/navbar.test.ts`, and the
"placeholder screens" block of `tests/tokens.test.ts` (every route renders
on the flag background inside a `main .carta`).

## Public API

- `src/router/index.ts::createAppRouter(): Router` — builds a fresh router
  each call (tests rely on this to get isolated instances). Hash history.
  Routes: `/` → redirect `/esercizi`; named routes `esercizi`, `vocaboli`,
  `dizionario`, `grammatica`, `grammatica-lezione` (`/grammatica/:id`);
  catch-all `/:pathMatch(.*)*` → redirect `/esercizi`.
- `src/components/NavBar.vue` — no props. Reads the current route via
  `useRoute()`. Renders `header.barra` with `span.barra-nome` ("maies") and
  `nav[aria-label="Sezioni"]` holding one `a.voce` per screen.
- `src/components/FondoBandiera.vue` — no props, one default slot. Renders
  `div.fondo` > `svg.bandiera` (aria-hidden) + slot.

## Internal patterns

- **Navigation items are data.** `NavBar.vue` holds a `voci` array (name,
  address, SVG `tracciati` paths and `rettangoli`) on a 24px icon grid; order
  is fixed: Esercizi, Vocaboli, Dizionario, Grammatica. Adding a screen means
  a route in `router/index.ts`, a view, and an entry in `voci`.
- **Current item** is computed by `corrente()`: exact path or any sub-route
  (`/grammatica/...`) keeps the item highlighted; it gets the
  `voce-corrente` class and `aria-current="page"`.
- Links use `RouterLink` with `custom` + `v-slot` so the `<a>` carries the
  classes directly.
- **Layout order**: on the phone the bar is sticky at the bottom and placed
  after the screen via CSS `order`; on computer `computer.css` turns it into
  a header bar at the top (`order: 0`).
  Markup order in `App.vue` (bar before view) is not visual order.
- `FondoBandiera` generates the flag geometry once at setup
  (`generaBandiera()`: perspective-warped cross, diagonals, border paths)
  and namespaces its SVG gradient/mask ids with `useId()` so several
  instances never collide.
- Components and views use global classes from the stylesheets, not
  scoped styles. No component uses `<style>`.
- UI text is Italian, addressed with "tu" (see design voice rules).

## Domain dependencies

- Hash routing, and why: `.claude/domain/technical-direction.md`
  § Inter-component protocols.
- Screens, navigation and responsive layout:
  `.claude/domain/features/scheletro-e-pubblicazione.md`
  (§ Architecture, § Interfaces and contracts).
- Icons, voice and screen look: `design/design-system.md`,
  `design/schermate/*.dc.html`.

## Cross-references

- [schermate.md](./schermate.md) — the views the routes mount and their
  logic modules.

- [styles-tokens.md](./styles-tokens.md) — every class used here
  (`fondo`, `bandiera*`, `barra*`, `voce*`) is
  styled there; phone vs computer layout lives there.
- [build-test-deploy.md](./build-test-deploy.md) — how the tests mount the
  app (jsdom, `@vue/test-utils`) and why hash history suits GitHub Pages.

## When to read the source

- Adding, renaming or reordering a route or screen: `src/router/index.ts`
  and the `voci` array in `src/components/NavBar.vue`.
- Changing a navigation icon or the current-item rule (`corrente()`).
- Changing the flag drawing or its gradients: `generaBandiera()` and the
  template of `src/components/FondoBandiera.vue`.
- Mounting the whole app in a test: the helper `mountAppAt()` in
  `tests/navbar.test.ts`. `tests/router.test.ts` also stubs
  `window.scrollTo`, which the lesson page calls and jsdom lacks.
- Changing what `main.ts` installs or mounts.
