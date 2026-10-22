# App shell

## Overview

The application frame every screen lives in: bootstrap, root component,
routing, navigation bar, the background wrapper with the dotted flag, and
the edition switch between the main site and the kids one. The screens themselves are in
[schermate.md](./schermate.md).

- `src/main.ts` — entry point: installs the design tokens, imports the three
  global stylesheets, mounts `App` with the router on `#app`.
- `src/App.vue` — root: `FondoBandiera` wrapping `NavBar` and `RouterView`.
- `src/components/FondoBandiera.vue` — `div.fondo` (glow background) holding
  the decorative `svg.bandiera` (dotted Union Jack fragment, bottom right)
  and a default slot.
- `src/fondo/bandiera.ts` — `puntiBandiera()`, the dot geometry.
- `src/edizione.ts` — which edition this build is (`principale` | `kids`).
- `src/router/index.ts` — route table and router factory.
- `src/components/NavBar.vue` — the four-item navigation bar.
Tests: `tests/router.test.ts`, `tests/navbar.test.ts`,
`tests/fondo-bandiera.test.ts`, `tests/edizione.test.ts`, and the
"placeholder screens" block of `tests/tokens.test.ts` (every route renders
inside the one `.fondo`, with one `svg.bandiera`, within a `main .carta`).

## Public API

- `src/router/index.ts::createAppRouter(edizione = EDIZIONE): Router` —
  builds a fresh router each call (tests rely on this to get isolated
  instances). Hash history. Main edition: `/` → redirect `/esercizi`; named
  routes `esercizi`, `vocaboli`, `dizionario`, `grammatica`,
  `grammatica-lezione` (`/grammatica/:id`); catch-all → `/esercizi`. Kids
  edition: only `vocaboli` and `dizionario`; every other address, `/`
  included, → `/vocaboli`.
- `src/components/NavBar.vue` — no props. Reads the current route via
  `useRoute()` and the router via `useRouter()`. Renders `header.barra` with
  `span.barra-nome` ("maies") and `nav[aria-label="Sezioni"]` holding one
  `a.voce` per screen the router has.
- `src/edizione.ts` — `Edizione`, `EDIZIONE` (`kids` only when Vite's mode is
  `kids`), `chiaveProgressi(edizione)`.
- `src/fondo/bandiera.ts::puntiBandiera(): { fondo, diagonali, croce }` —
  one SVG path string per flag part, each a run of small circles.

## Internal patterns

- **Navigation items are data.** `NavBar.vue` holds a `voci` array (name,
  route name `rotta`, address, SVG `tracciati` paths and `rettangoli`) on a
  24px icon grid; order is fixed: Esercizi, Vocaboli, Dizionario,
  Grammatica. Only items whose `rotta` the router has are shown, so the kids
  edition shows two. Adding a screen means a route in `router/index.ts`, a
  view, and an entry in `voci`.
- **The flag is computed once per mount** by `puntiBandiera()`, with the
  geometry of `design/schermate/*.dc.html`: dots on an 8px grid, radius up to
  2.2px at the fragment centre, shrinking away from it. The SVG uses
  `viewBox="0 420 400 400"` and `xMaxYMax meet`, so it anchors bottom right;
  its size and colours are CSS (`styles-tokens.md`).
- **Current item** is computed by `corrente()`: exact path or any sub-route
  (`/grammatica/...`) keeps the item highlighted; it gets the
  `voce-corrente` class and `aria-current="page"`.
- Links use `RouterLink` with `custom` + `v-slot` so the `<a>` carries the
  classes directly.
- **Layout order**: on the phone the bar is sticky at the bottom and placed
  after the screen via CSS `order`; on computer `computer.css` turns it into
  a header bar at the top (`order: 0`).
  Markup order in `App.vue` (bar before view) is not visual order.
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
  (`fondo`, `barra*`, `voce*`) is
  styled there; phone vs computer layout lives there.
- [build-test-deploy.md](./build-test-deploy.md) — how the tests mount the
  app (jsdom, `@vue/test-utils`) and why hash history suits GitHub Pages.

## When to read the source

- Adding, renaming or reordering a route or screen: `src/router/index.ts`
  and the `voci` array in `src/components/NavBar.vue`.
- Changing a navigation icon or the current-item rule (`corrente()`).
- Mounting the whole app in a test: the helper `mountAppAt()` in
  `tests/navbar.test.ts`. `tests/router.test.ts` also stubs
  `window.scrollTo`, which the lesson page calls and jsdom lacks.
- Changing what `main.ts` installs or mounts.
- Changing the dotted flag's geometry: `src/fondo/bandiera.ts` and
  `tests/fondo-bandiera.test.ts`, which pins grid, radii and the SVG frame.
- Adding a section to the kids edition: its branch in `createAppRouter()`
  and `tests/router.test.ts`.
