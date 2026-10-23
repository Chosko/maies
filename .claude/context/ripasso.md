# Ripasso

## Overview

Spaced review: each sentence and word has one of three levels, stored in
the browser, and a session picks the next item weighted by level.

- `src/ripasso/livelli.ts` — levels, weights, initial level and the
  transition rule.
- `src/ripasso/archivio.ts` — progress store over `localStorage`.
- `src/ripasso/selettore.ts` — weighted random pick with exclusions.
- `src/ripasso/sessione.ts` — `creaSessione()`, the entry point the
  exercise and vocabulary screens use.

Tests: `tests/livelli.test.ts`, `tests/archivio.test.ts`,
`tests/selettore.test.ts`, `tests/sessione.test.ts`.

## Public API

- `livelli.ts` — `LIVELLI` (`da-ripassare`, `normale`, `consolidato`),
  `Livello`, `Esito` (`giusto` | `sbagliato`), `LIVELLO_INIZIALE`
  (`normale`), `PESI` (6 / 3 / 1), `isLivello()`,
  `nuovoLivello(attuale, esito)`: wrong → `da-ripassare`; right → one step
  up (`da-ripassare` → `normale` → `consolidato`).
- `archivio.ts` — `CHIAVE_PROGRESSI`, the edition's key
  (`chiaveProgressi(EDIZIONE)`: `maies.progressi`, or `maies.kids.progressi`
  in the kids edition); `creaArchivio(salvataggio?: Storage | null,
  chiave = CHIAVE_PROGRESSI): ArchivioProgressi` with
  `leggiLivello(idGlobale)` and `salvaLivello(idGlobale, livello)`.
- `selettore.ts` — `scegli(candidati, esclusi, casualita): T | null` over
  `{ id, livello, importanza }` candidates, each weighted
  `PESI[livello] × FATTORI[importanza]`; importance 0 is never picked;
  `Casualita` is `() => number` in [0, 1).
- `sessione.ts` — `creaSessione('frasi' | 'vocaboli', opzioni?)` returns
  `prossimoElemento()` (a `FraseCatalogo` / `VocaboloCatalogo`, or `null`
  with no items) and `registraEsito(idGlobale, esito)`. `opzioni` injects
  `catalogo`, `archivio` and `casualita` for tests.

## Internal patterns

- **One key per edition**: both editions share the domain and their lesson
  ids overlap, so the kids edition never reads or writes the main key.
- **Stored shape:** `{ versione: 1, livelli: { [idGlobale]: Livello } }`. A
  missing, unparsable or other-version value, or an unknown level, reads as
  `LIVELLO_INIZIALE`.
- **Storage never throws to the caller.** Unreadable storage (private mode,
  blocked access) switches the store to memory only; a failed write keeps
  the level in memory.
- **One store per page.** Sessions without an injected `archivio` share a
  lazily created module-level store, so all screens see the same progress.
- **No immediate repeats.** A session excludes its last
  `min(3, items − 1)` picks; with one item it always returns that item.
- `registraEsito()` ignores ids not in the session's own item list.
- Tests pass a seeded `casualita` and a fake `Storage` class; reuse those
  helpers from `tests/sessione.test.ts` / `tests/archivio.test.ts`.

## Domain dependencies

- The three-level algorithm and its reasons:
  `.claude/domain/features/ripetizione-errori.md`.

## Cross-references

- [contenuti.md](./contenuti.md) — `catalogo`, `FraseCatalogo`,
  `VocaboloCatalogo` and the `idGlobale` key.
- [schermate.md](./schermate.md) — the Esercizi and Vocaboli cycles that
  drive sessions.

## When to read the source

- Changing weights, levels or transitions: `livelli.ts` (and
  `tests/livelli.test.ts`, which pins the values).
- Changing the stored format: `archivio.ts`; a new `VERSIONE` makes every
  stored value read as empty, so existing progress is lost.
- Changing the anti-repeat window or what a session offers: `sessione.ts`.
