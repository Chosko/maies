# Schermate

## Overview

The four screens behind the navigation bar, each a route view over a
UI-free logic module. Three read the catalogue only; Esercizi and Vocaboli
drive a review session.

- `src/views/EserciziView.vue` + `src/esercizi/ciclo.ts` — translation
  exercise: Sara may reveal the sentence's hint, types, sees the solution, marks herself right or wrong and
  sets the sentence's importance, 0 removing it after a confirmation.
- `src/views/VocaboliView.vue` + `src/vocaboli/ciclo.ts`,
  `src/vocaboli/verifica.ts`, `src/vocaboli/pronuncia.ts` — vocabulary
  drill: the app checks the answer; the result shows the translations, the
  word's example sentence and mnemonic, and buttons that speak the main
  translation and the example; a wrong answer must be rewritten correctly
  before "Avanti"; in the main edition the result also sets the word's
  importance, 0 removing it after a confirmation.
- `src/views/DizionarioView.vue` + `src/dizionario/voci.ts`,
  `src/dizionario/filtro.ts` — sorted word list with a live search field.
- `src/views/GrammaticaView.vue` + `src/grammatica/elenco.ts` — list of
  lessons that have grammar cards.
- `src/views/GrammaticaLezioneView.vue` + `src/grammatica/markdown.ts` —
  one lesson's cards, Markdown rendered to HTML (route `#/grammatica/:id`).
- `src/components/RigaImportanza.vue` — the 0–3 importance row and its
  removal confirmation, shared by Esercizi (on the solution) and Vocaboli
  (on the result).

Tests: `tests/esercizi.test.ts`, `ciclo-esercizi`, `riga-importanza`,
`vocaboli`, `ciclo-vocaboli`, `verifica`, `pronuncia`, `dizionario`, `voci`, `filtro`, `grammatica`,
`elenco-grammatica`, `grammatica-lezione`, `markdown` (all `tests/*.test.ts`).

## Public API

- `esercizi/ciclo.ts::creaCiclo(opzioni?): CicloEsercizio` — `stato`
  (`fase`: `in-attesa-di-risposta` | `soluzione-mostrata` |
  `nessun-materiale` | `tutti-tolti`; `frase`, `testo`, `titoloLezione`,
  `importanza`, `confermaRimozioneAperta`, `aiutoMostrato`), `avvio()`,
  `mostraAiuto()`, `conferma(testo)`, `segna('giusta' | 'sbagliata')`,
  `impostaImportanza(1 | 2 | 3)`, `chiediRimozione()`, `annullaRimozione()`,
  `confermaRimozione()`. `mostraAiuto()` acts only in
  `in-attesa-di-risposta` and for a sentence with a `hint`, sets
  `aiutoMostrato` and records nothing; every proposed sentence starts with
  it `false`. The importance actions act only in `soluzione-mostrata`, confirmation closed;
  `importanza` is the sentence's current value (`null` without a sentence);
  `confermaRimozione()` records importance 0, then proposes the next
  sentence, landing on `tutti-tolti` when the session reports every
  sentence removed.
- `vocaboli/ciclo.ts::creaCiclo(opzioni?): CicloAllenamento` — `stato`
  (`fase`: `in-attesa-di-risposta` | `riscrittura` | `esito-mostrato` |
  `nessun-materiale` | `tutti-tolti`; `vocabolo`, `testo`, `esito`,
  `riscrittura`, `riscritturaRespinta`, `titoloLezione`, `importanza`,
  `confermaRimozioneAperta`), `avvio()`, `conferma(testo)`,
  `riscrivi(testo)`, `avanti()`, `impostaImportanza(1 | 2 | 3)`,
  `chiediRimozione()`, `annullaRimozione()`, `confermaRimozione()`.
  `conferma()` records the checked result and goes to `esito-mostrato` on
  `giusto`, to `riscrittura` on `sbagliato`. `riscrivi()` acts only in
  `riscrittura` with the removal confirmation closed, checks the text with
  `verifica()`, records nothing, and goes to `esito-mostrato` when it
  passes, otherwise sets `riscritturaRespinta`. `avanti()` acts only in
  `esito-mostrato`, the removal confirmation closed. Importance actions:
  `esito-mostrato` or `riscrittura`, the removal confirmation closed;
  `importanza` is the word's current value (`null` without a word);
  `confermaRimozione()` records importance 0 (the result stays the one
  `conferma()` recorded), then proposes the next word — from `riscrittura`
  too — landing on `tutti-tolti` when the session reports every word
  removed.
- `vocaboli/pronuncia.ts::creaPronuncia(opzioni?): Pronuncia` —
  `disponibile()` (an English voice exists), `leggi(testo)` (cancels the
  reading in progress, then speaks), `quandoCambia(ascoltatore)` (listens
  to `voiceschanged`, returns the unsubscribe). Prefers an `en-GB` / `en_GB`
  voice, else any `en*` voice; voices are re-read on every call. Without
  `speechSynthesis`, `SpeechSynthesisUtterance` or an English voice it is
  unavailable; every browser call is wrapped so nothing throws. `opzioni`
  `{ sintesi?, Enunciato? }` inject the narrow `SintesiVocale` /
  `CostruttoreEnunciato` interfaces for tests.
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
- `components/RigaImportanza.vue` — props `importanza`, `confermaAperta`,
  `messaggio` (the confirmation's question); emits `scegli(1 | 2 | 3)`,
  `chiediRimozione` (on the 0 button), `confermaRimozione` ("Togli"),
  `annullaRimozione` ("Annulla"). Display-only: the cycle holds the
  importance and whether the confirmation is open. Buttons carry
  `aria-pressed` and are disabled while the confirmation is open; the
  confirmation is an inline `role="alertdialog"`.
- Views: Esercizi and Vocaboli take an optional `creaCiclo` prop, and
  Vocaboli optional `edizione` (default `EDIZIONE`) and `pronuncia`
  (default `creaPronuncia()`) props; Dizionario,
  Grammatica and GrammaticaLezione an optional `catalogo` prop.
  The app passes none; tests inject.

## Internal patterns

- **Logic out of the view.** Each rule lives in one module, never in the
  `.vue`: the vocabulary check only in `verifica()` (answer and rewrite
  alike), the voice choice only in `creaPronuncia()`, the dictionary search
  only in `filtra()` (a different rule from `verifica()`), Markdown → HTML
  only in `html()`.
- **A cycle exposes a readonly reactive `stato`**; actions outside their
  phase are no-ops. `avvio()` is called synchronously in setup so the empty
  state never flashes; a new cycle (and session) per mount.
- Esercizi records the self-assessment on `segna()`, an importance on
  `impostaImportanza()` and importance 0 on `confermaRimozione()` (no
  result, and `segna()` is a no-op while the removal confirmation is open);
  Vocaboli records the checked result on `conferma()`, an importance on
  `impostaImportanza()` and importance 0 on `confermaRimozione()`, and
  nothing on `riscrivi()`. Both key the session by `idGlobale`.
- Esercizi shows the secondary "Aiuto" button (`.esercizio-aiuto`) under
  the sentence only in `in-attesa-di-risposta` and only for a sentence with
  a `hint`; tapping it calls `mostraAiuto()`, the hint text
  (`.esercizio-aiuto-testo`) takes the button's place and stays until the
  next sentence, and focus goes back to the answer field after `nextTick()`.
- Esercizi shows `RigaImportanza` only in `soluzione-mostrata`, below the
  Sbagliata/Giusta buttons, wiring its events straight to the cycle's
  actions. Its empty card has two texts: `nessun-materiale` ("Ancora
  nessuna frase da tradurre") and `tutti-tolti` ("Hai tolto tutte le frasi
  dagli esercizi").
- Vocaboli renders one result card for `riscrittura` and `esito-mostrato`:
  the result, the answer, the main translation, "Accettata anche" for the
  other `en`, then — in `riscrittura` only — the rewrite field ("Riscrivi la
  traduzione", `.vocabolo-riscrittura`) with the `role="alert"` notice
  "Non è ancora giusta: riprova." (`.vocabolo-riscrittura-avviso`) when
  `riscritturaRespinta`, then "Esempio" (`.vocabolo-esempio`) and "Trucco
  per ricordare" (`.vocabolo-trucco`), each only when the word has
  `example` / `mnemonic`. Below the card the main button is "Controlla"
  (calls `riscrivi()`) in `riscrittura` and "Avanti" in `esito-mostrato`.
- Vocaboli puts a speaker button (`.cerchio-icona.vocabolo-ascolta`, inside
  a `.vocabolo-ascoltabile` row) beside the main translation ("Ascolta la
  traduzione") and the example ("Ascolta la frase d'esempio"), calling
  `pronuncia.leggi()`; both appear only while `pronuncia.disponibile()`,
  held in a ref refreshed by `quandoCambia()` and unsubscribed on unmount.
- Vocaboli shows `RigaImportanza` in `riscrittura` and `esito-mostrato`,
  only when its `edizione` is `principale`, below the main button, wiring
  its events straight to the cycle's actions. Its empty card has two
  texts: `nessun-materiale` ("Ancora nessun vocabolo su cui allenarti") and
  `tutti-tolti` ("Hai tolto tutti i vocaboli dall'allenamento").
- Vocaboli moves focus to the answer field on each new word, to the
  rewrite field on `riscrittura` (and back to it, text kept, after a
  rejected rewrite) and to "Avanti" on `esito-mostrato`, and ignores
  held-down Enter (`evento.repeat`), so one Enter never confirms, checks
  and advances.
- Vocaboli adds `vocabolo-carta-sbagliata` to the result card on a wrong
  answer, rewrite included; the red styling is all CSS
  (`styles-tokens.md`).
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
- Changing which voice speaks or how a reading starts: `pronuncia.ts` and
  `tests/pronuncia.test.ts`. jsdom has no `speechSynthesis`, so screen
  tests pass Vocaboli a stand-in `pronuncia` prop.
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
