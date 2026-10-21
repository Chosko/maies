# Contenuti

## Overview

The lesson content: one JSON file per lesson under `contenuti/lezioni/`
(written only by Claude through the `aggiunta-materiale` skill), the format
that defines them, the build-time catalogue the app reads, and the validity
check that gates publication.

- `src/contenuti/schema.ts` — zod schemas `schemaFrase`, `schemaVocabolo`,
  `schemaScheda`, `schemaLezione` and the inferred types `Frase`,
  `Vocabolo`, `Scheda`, `Lezione`. The only definition of the format.
- `src/contenuti/validazione.ts` — `validaLezioni()` and `descriviErrori()`:
  schema plus the cross-file rules the schema cannot express.
- `src/contenuti/catalogo.ts` — `costruisciCatalogo()` and the app's
  `catalogo`, built with `import.meta.glob` over
  `contenuti/lezioni/*.json`.
- `.claude/skills/aggiunta-materiale/SKILL.md` — project skill that turns a
  PDF, photo, word or correction into lesson files, runs `npm test` and
  commits.

`contenuti/lezioni/` may not exist yet; every reader treats a missing folder
as zero lessons.

Tests: `tests/validazione.test.ts`, `tests/catalogo.test.ts`,
`tests/contenuti.test.ts` (the validity check on the real folder),
`tests/skill-aggiunta-materiale.test.ts`.

## Public API

- `schema.ts` — field names are English (`id`, `title`, `sentences`,
  `vocabulary`, `grammar`; a sentence has `it`, `en`, `alternatives`; a word
  has `it` and `en: string[]` with at least one entry; a card has `title`,
  `body` in Markdown). Objects are strict; every text is non-empty with no
  leading or trailing whitespace; a lesson needs at least one item.
- `validaLezioni(files: FileLezione[]): ErroreValidazione[]` — takes
  `{ nome, contenuto }` pairs, returns `{ file, elemento?, messaggio }`
  errors in Italian, empty when valid.
- `descriviErrori(errori): string` — one line per error,
  `file › elemento: messaggio`.
- `costruisciCatalogo(moduli): Catalogo` — `lezioni` sorted by id; flat
  `frasi` and `vocaboli`; lookups `lezione(id)`, `frase(idGlobale)`,
  `vocabolo(idGlobale)`. Each sentence and word gains `idGlobale`
  (`<idLezione>/<id>`) and `idLezione`; cards do not.
- `catalogo` — the app's single catalogue over the real files.

## Internal patterns

- **zod stays out of the app bundle.** zod is a dev dependency; outside
  `schema.ts` and `validazione.ts` the app imports only types from the
  schema (`import type`). `tests/validazione.test.ts` ("zod resta fuori
  dall'app") scans every `src/**/*.{ts,vue}` and fails on a value import.
- **The catalogue does not validate.** A malformed file is stopped by the
  validity test, which runs in `npm test` and so in the deploy workflow.
- **Validation rules beyond the schema:** only `.json` files in the folder;
  lesson id shaped `NN-argomento`, `NN` unique across lessons, file name
  `<id>.json`; item ids `fNN` / `vNN` / `gNN` per list, unique in the
  lesson; an Italian sentence or word is unique across all lessons, and
  translations of one item are not repeated — both compared after
  lower-casing, collapsing whitespace and dropping trailing punctuation.
  Files are checked in name order, so "already in" names the earlier file.
- **Everything in the catalogue is frozen**, arrays included.
- **The validity test reads the folder with `node:fs` on every run**, not
  with `import.meta.glob`, whose result Vitest caches; a file just written
  is checked at once.

## Domain dependencies

- Format, identifiers, Claude's procedure and the validity contract:
  `.claude/domain/features/aggiunta-materiale-lezione.md`.

## Cross-references

- [ripasso.md](./ripasso.md) — the review session reads `catalogo.frasi` /
  `catalogo.vocaboli` and keys progress by `idGlobale`.
- [build-test-deploy.md](./build-test-deploy.md) — the `node` test
  environment and the deploy gate.

## When to read the source

- Changing the lesson format: `schema.ts`, then the feature document; the
  skill must not copy the format (its test forbids the JSON keys).
- Adding a cross-file rule or changing an error message:
  `validaLezioni()` and the matching block of `tests/validazione.test.ts`.
- Exposing new catalogue data or a lookup: `costruisciCatalogo()`.
- Importing schema code from a new app file: the allow-list regex in
  `tests/validazione.test.ts` ("zod resta fuori dall'app").
