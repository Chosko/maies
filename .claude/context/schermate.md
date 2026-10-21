# Schermate

## Overview

The four screens behind the navigation bar, each a route view over a
UI-free logic module. Three read the catalogue only; Esercizi and Vocaboli
drive a review session.

- `src/views/EserciziView.vue` + `src/esercizi/ciclo.ts` — translation
  exercise: Sara types, sees the solution, marks herself right or wrong.
- `src/views/VocaboliView.vue` + `src/vocaboli/ciclo.ts`,
  `src/vocaboli/verifica.ts` — vocabulary drill: the app checks the answer.
- `src/views/DizionarioView.vue` + `src/dizionario/voci.ts`,
  `src/dizionario/filtro.ts` — sorted word list with a live search field.
- `src/views/GrammaticaView.vue` + `src/grammatica/elenco.ts` — list of
  lessons that have grammar cards.
- `src/views/GrammaticaLezioneView.vue` + `src/grammatica/markdown.ts` —
  one lesson's cards, Markdown rendered to HTML (route `#/grammatica/:id`).

Tests: `tests/esercizi.test.ts`, `ciclo-esercizi`, `vocaboli`,
`ciclo-vocaboli`, `verifica`, `dizionario`, `voci`, `filtro`, `grammatica`,
`elenco-grammatica`, `grammatica-lezione`, `markdown` (all `tests/*.test.ts`).

## Public API

- `esercizi/ciclo.ts::creaCiclo(opzioni?): CicloEsercizio` — `stato`
  (`fase`: `in-attesa-di-risposta` | `soluzione-mostrata` |
  `nessun-materiale`; `frase`, `testo`, `titoloLezione`), `avvio()`,
  `conferma(testo)`, `segna('giusta' | 'sbagliata')`.
- `vocaboli/ciclo.ts::creaCiclo(opzioni?): CicloAllenamento` — `stato`
  (`fase`: `in-attesa-di-risposta` | `esito-mostrato` | `nessun-materiale`;
  `vocabolo`, `testo`, `esito`, `titoloLezione`), `avvio()`,
  `conferma(testo)`, `avanti()`.
- Both cycles take `opzioni` `{ creaSessione?, catalogo? }` for tests.
- `vocaboli/verifica.ts::verifica(risposta, traduzioniAccettate): Esito` —
  match after lower-casing, typographic apostrophes → `'`, collapsed
  whitespace, trailing punctuation dropped; empty answer is `sbagliato`.
- `dizionario/voci.ts::voci(vocaboli): Voce[]` — `{ idGlobale, it, en }`
  sorted by `it` with an Italian base-sensitivity collator.
- `dizionario/filtro.ts::filtra(elenco, testoCercato)` — substring match on
  `it` or any `en`, ignoring case, accents and apostrophe style; empty
  search returns the whole list.
- `grammatica/elenco.ts::elenco(lezioni): VoceGrammatica[]` — lessons with
  at least one card, by id, each with its card titles by card id.
- `grammatica/markdown.ts::html(body): string` — `markdown-it` in
  `commonmark` mode with `html: false`.
- Views: Esercizi and Vocaboli take an optional `creaCiclo` prop;
  Dizionario, Grammatica and GrammaticaLezione an optional `catalogo` prop.
  The app passes none; tests inject.

## Internal patterns

- **Logic out of the view.** Each rule lives in one module, never in the
  `.vue`: the vocabulary check only in `verifica()`, the dictionary search
  only in `filtra()` (a different rule from `verifica()`), Markdown → HTML
  only in `html()`.
- **A cycle exposes a readonly reactive `stato`**; actions outside their
  phase are no-ops. `avvio()` is called synchronously in setup so the empty
  state never flashes; a new cycle (and session) per mount.
- Esercizi records the self-assessment on `segna()`; Vocaboli records the
  checked result on `conferma()`. Both key the session by `idGlobale`.
- Vocaboli moves focus to "Avanti" on the result and ignores held-down
  Enter (`evento.repeat`), so one Enter never confirms and advances.
- **The only `v-html`** is the lesson page's `.scheda-testo`, fed by
  `html()`, which never passes raw HTML through.
- The lesson page reads `route.params.id`, scrolls to top on each id change,
  and shows a message for a missing lesson or one without cards.
- Every screen's empty state reuses the `esercizio-vuoto*` classes inside a
  `.carta`.
- Lists are computed once per mount from the catalogue; nothing is stored.

## Domain dependencies

- `.claude/domain/features/esercizi-traduzione.md`,
  `allenamento-vocaboli.md`, `dizionario-vocaboli.md`,
  `schede-grammatica.md` — one per screen, with the reasons for each rule.
- Screen look: `design/schermate/*.dc.html`, `design/design-system.md`.

## Cross-references

- [app-shell.md](./app-shell.md) — routes and the navigation bar that
  reach these views.
- [ripasso.md](./ripasso.md) — `creaSessione()`, `registraEsito()` and the
  `Esito` type the cycles use.
- [contenuti.md](./contenuti.md) — `catalogo`, `FraseCatalogo`,
  `VocaboloCatalogo`, `LezioneCatalogo`.
- [styles-tokens.md](./styles-tokens.md) — the per-screen class families.

## When to read the source

- Changing what counts as a correct word: `verifica()` and
  `tests/verifica.test.ts`.
- Changing dictionary search or ordering: `filtro.ts` / `voci.ts`.
- Changing a screen's phases or what it records: the matching `ciclo.ts`
  and its `tests/ciclo-*.test.ts`.
- Importing `markdown-it` anywhere but `src/grammatica/markdown.ts` fails
  "la libreria Markdown" in `tests/markdown.test.ts`.
- A screen that stops rendering a `main .carta` with the real (possibly
  empty) catalogue fails `tests/router.test.ts` and the "placeholder
  screens" block of `tests/tokens.test.ts`.
- Test patterns: the `catalogoDi()` / `preparaCiclo()` helpers at the top
  of `tests/ciclo-esercizi.test.ts` and `tests/esercizi.test.ts`.
  `window.scrollTo`, which the lesson page calls, is not implemented in
  jsdom; `tests/grammatica-lezione.test.ts` stubs it.
