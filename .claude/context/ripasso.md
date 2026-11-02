# Ripasso

## Overview

Spaced review: each sentence and word has one of three levels and one of
four importance values, stored in the browser, and a session picks the next
item weighted by both.

- `src/ripasso/apprendimento.ts` — learning states, outcome transitions,
  check scale and local calendar days.
- `src/ripasso/livelli.ts` — levels, weights, initial level and the
  transition rule, still used by the selector, the session and the store's
  level bridge.
- `src/ripasso/importanza.ts` — importance values, initial importance and
  the check-interval factors.
- `src/ripasso/archivio.ts` — progress store over `localStorage`: learning
  state and importance per id.
- `src/ripasso/selettore.ts` — weighted random pick with exclusions.
- `src/ripasso/sessione.ts` — `creaSessione()`, the entry point the
  exercise and vocabulary screens use.

Tests: `tests/apprendimento.test.ts`, `tests/livelli.test.ts`, `tests/importanza.test.ts`,
`tests/archivio.test.ts`, `tests/selettore.test.ts`,
`tests/sessione.test.ts`.

## Public API

- `apprendimento.ts` — `Esito` (`giusto` | `sbagliato`), `Giorno`
  (`AAAA-MM-GG` local day), `StatoApprendimento` (`nuovo`, `da-riprendere`,
  `nel-gruppo` with `serie` 0–2, `imparato` with `gradino`, `controllo`,
  `ultimaVista`), `STATO_INIZIALE` (`nuovo`), `SCALA` (1, 3, 7, 14, 30),
  `intervallo(gradino, importanza)`, `giornoLocale(data)`,
  `aggiungiGiorni(giorno, n)`, `controlloScaduto(stato, oggi)` and
  `applicaEsito(stato, esito, importanza, oggi)`, which applies the
  feature's *Transizioni*.
- `livelli.ts` — `LIVELLI` (`da-ripassare`, `normale`, `consolidato`),
  `Livello`, `Esito` (re-exported from `apprendimento.ts`), `LIVELLO_INIZIALE`
  (`normale`), `PESI` (6 / 3 / 1), `isLivello()`,
  `nuovoLivello(attuale, esito)`: wrong → `da-ripassare`; right → one step
  up (`da-ripassare` → `normale` → `consolidato`).
- `importanza.ts` — `IMPORTANZE` (0, 1, 2, 3), `Importanza`,
  `ImportanzaAttiva` (1–3), `IMPORTANZA_INIZIALE` (2), `FATTORI_INTERVALLO`
  (1 → ×2, 2 → ×1, 3 → ×0.5), `isImportanza()`.
  Importance 0 means the item is removed from review.
- `archivio.ts` — `CHIAVE_PROGRESSI`, the edition's key
  (`chiaveProgressi(EDIZIONE)`: `maies.progressi`, or `maies.kids.progressi`
  in the kids edition); `creaArchivio(salvataggio?: Storage | null,
  chiave = CHIAVE_PROGRESSI, oggi = giornoLocale(new Date())):
  ArchivioProgressi` with `leggiStato(idGlobale)` (`nuovo` for an id never
  recorded), `salvaStato(idGlobale, stato)`, `leggiImportanza(idGlobale)`
  (2 for an id never recorded) and `salvaImportanza(idGlobale, importanza)`.
  `oggi` dates the converted `consolidato` items. A bridge for the
  three-level session: `leggiLivello()` reads `da-riprendere` and
  `nel-gruppo` as `da-ripassare`, `imparato` as `consolidato`, `nuovo` as
  `normale`; `salvaLivello()` saves a level as the state the conversion
  gives it.
- `selettore.ts` — `scegli(candidati, esclusi, casualita): T | null` over
  `{ id, livello, importanza }` candidates, each weighted
  `PESI[livello] ×` its own importance factor (0 / 0.5 / 1 / 2); a candidate of weight 0
  (importance 0) is never picked, and `null` means no excluded-free
  candidate with positive weight is left; `Casualita` is `() => number` in
  [0, 1).
- `sessione.ts` — `creaSessione('frasi' | 'vocaboli', opzioni?)` returns
  `prossimoElemento()`, `registraEsito(idGlobale, esito)` and
  `registraImportanza(idGlobale, importanza)`. `prossimoElemento()` returns
  a `Proposta`: `{ caso: 'elemento', elemento, importanza }` (a
  `FraseCatalogo` / `VocaboloCatalogo` with its current importance),
  `{ caso: 'nessun-materiale' }` when the catalogue has no items of that
  kind, or `{ caso: 'tutti-tolti' }` when every item has importance 0.
  `opzioni` injects `catalogo`, `archivio` and `casualita` for tests.

## Internal patterns

- **One key per edition**: both editions share the domain and their lesson
  ids overlap, so the kids edition never reads or writes the main key.
- **Stored shape:** `{ versione: 3, elementi: { [idGlobale]: { stato?,
  importanza? } } }`, `stato` being a `StatoApprendimento` object holding
  only its own kind's fields. A field equal to its initial value (`nuovo`,
  2) is not stored, and an id with no field left is dropped. A missing,
  unparsable or unknown-version value reads as empty; an unknown or
  incomplete state (`serie` outside 0–2, `gradino` not a positive integer,
  a date not `AAAA-MM-GG`) reads as `nuovo`, an unknown importance as 2.
- **Three-level formats converted on read:** version 1
  (`{ versione: 1, livelli: { [idGlobale]: Livello } }`) and version 2
  (`{ versione: 2, elementi: { [idGlobale]: { livello?, importanza? } } }`)
  map `da-ripassare` → `da-riprendere`, `consolidato` → `imparato` at step 1
  with `controllo` and `ultimaVista` set to `oggi`, `normale` or an unknown
  level → `nuovo`, keeping the importance; the next write saves version 3.
- **Storage never throws to the caller.** Unreadable storage (private mode,
  blocked access) switches the store to memory only; a failed write keeps
  the value in memory.
- **One store per page.** Sessions without an injected `archivio` share a
  lazily created module-level store, so all screens see the same progress.
- **No immediate repeats.** A session excludes its last
  `min(3, remaining − 1)` picks, where `remaining` is the number of items
  with importance other than 0, recomputed on every `prossimoElemento()`
  call because removing an item shrinks it; with one remaining item it
  always returns that item.
- `registraEsito()` and `registraImportanza()` ignore ids not in the
  session's own item list; `registraImportanza()` also ignores a value that
  is not an `Importanza`.
- Tests pass a seeded `casualita` and a fake `Storage` class; reuse those
  helpers from `tests/sessione.test.ts` / `tests/archivio.test.ts`.

## Domain dependencies

- The three-level algorithm, importance and their reasons:
  `.claude/domain/features/ripetizione-errori.md`.

## Cross-references

- [contenuti.md](./contenuti.md) — `catalogo`, `FraseCatalogo`,
  `VocaboloCatalogo` and the `idGlobale` key.
- [schermate.md](./schermate.md) — the Esercizi and Vocaboli cycles that
  drive sessions.

## When to read the source

- Changing weights, levels or transitions: `livelli.ts` (and
  `tests/livelli.test.ts`, which pins the values).
- Changing learning states, transitions or the check scale:
  `apprendimento.ts` (and `tests/apprendimento.test.ts`, which pins them).
- Changing interval factors or values of importance: `importanza.ts` (and
  `tests/importanza.test.ts`).
- Changing the stored format: `archivio.ts`; a new `VERSIONE` reads as
  empty every stored value it does not convert, so progress is lost unless
  the previous version gets a conversion like the ones from versions 1
  and 2.
- Changing the anti-repeat window or what a session offers: `sessione.ts`.
