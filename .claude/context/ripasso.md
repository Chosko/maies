# Ripasso

## Overview

Spaced review: each sentence and word has one of three levels and one of
four importance values, stored in the browser, and a session picks the next
item weighted by both.

- `src/ripasso/livelli.ts` — levels, weights, initial level and the
  transition rule.
- `src/ripasso/importanza.ts` — importance values, initial importance and
  the weight factors.
- `src/ripasso/archivio.ts` — progress store over `localStorage`.
- `src/ripasso/selettore.ts` — weighted random pick with exclusions.
- `src/ripasso/sessione.ts` — `creaSessione()`, the entry point the
  exercise and vocabulary screens use.

Tests: `tests/livelli.test.ts`, `tests/importanza.test.ts`,
`tests/archivio.test.ts`, `tests/selettore.test.ts`,
`tests/sessione.test.ts`.

## Public API

- `livelli.ts` — `LIVELLI` (`da-ripassare`, `normale`, `consolidato`),
  `Livello`, `Esito` (`giusto` | `sbagliato`), `LIVELLO_INIZIALE`
  (`normale`), `PESI` (6 / 3 / 1), `isLivello()`,
  `nuovoLivello(attuale, esito)`: wrong → `da-ripassare`; right → one step
  up (`da-ripassare` → `normale` → `consolidato`).
- `importanza.ts` — `IMPORTANZE` (0, 1, 2, 3), `Importanza`,
  `IMPORTANZA_INIZIALE` (2), `FATTORI` (0 / 0.5 / 1 / 2), `isImportanza()`.
  Importance 0 means the item is removed from review.
- `archivio.ts` — `CHIAVE_PROGRESSI`, the edition's key
  (`chiaveProgressi(EDIZIONE)`: `maies.progressi`, or `maies.kids.progressi`
  in the kids edition); `creaArchivio(salvataggio?: Storage | null,
  chiave = CHIAVE_PROGRESSI): ArchivioProgressi` with
  `leggiLivello(idGlobale)`, `salvaLivello(idGlobale, livello)`,
  `leggiImportanza(idGlobale)` and `salvaImportanza(idGlobale, importanza)`.
- `selettore.ts` — `scegli(candidati, esclusi, casualita): T | null` over
  `{ id, livello, importanza }` candidates, each weighted
  `PESI[livello] × FATTORI[importanza]`; a candidate of weight 0
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
- **Stored shape:** `{ versione: 2, elementi: { [idGlobale]: { livello?,
  importanza? } } }`. A field equal to its initial value is not stored, and
  an id with no field left is dropped. A missing, unparsable or
  unknown-version value, or an unknown level or importance, reads as
  `LIVELLO_INIZIALE` / `IMPORTANZA_INIZIALE`.
- **Previous format converted on read:** a version-1 value
  (`{ versione: 1, livelli: { [idGlobale]: Livello } }`) is read as
  version 2 with each level kept and importance at its initial value; the
  next write saves it as version 2.
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
- Changing weights or values of importance: `importanza.ts` (and
  `tests/importanza.test.ts`).
- Changing the stored format: `archivio.ts`; a new `VERSIONE` reads as
  empty every stored value it does not convert, so progress is lost unless
  the previous version gets a conversion like the one from version 1.
- Changing the anti-repeat window or what a session offers: `sessione.ts`.
