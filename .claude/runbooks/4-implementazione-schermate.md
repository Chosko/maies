# Runbook: implementazione-schermate

Created: 2026-10-21 · Source: runbook pianificazione-task · Model: opus
Last step number: 15
Execution policy: unattended
Parallelism: 4

## [x] 1. Task 14 — Ciclo dell'esercizio di traduzione

Depends on: none

Context: none

```prompt
/task-implement 14 --review --rounds 2
```

Done: 2026-10-21, commit `501385d` (3 files, +306/-1). The cycle starts in `'nessun-materiale'` until `avvio()` is called — a state the feature document does not describe.

## [ ] 2. Task 15 — Schermata Esercizi al posto del segnaposto

Depends on: 1

Context:
- 2026-10-21 (from step 1): `creaCiclo(opzioni?)` in `src/esercizi/ciclo.ts` exposes `avvio()`, `conferma(testo)`, `segna('giusta' | 'sbagliata')` and a read-only reactive `stato` (`fase`, `frase`, `testo`, `titoloLezione`); phases are `'in-attesa-di-risposta'`, `'soluzione-mostrata'`, `'nessun-materiale'`. The cycle starts in `'nessun-materiale'` until `avvio()`, so the screen must call `avvio()` synchronously in setup to avoid flashing the no-material message.

```prompt
/task-implement 15 --review
```

## [ ] 3. Task 16 — Documentazione della feature esercizi-traduzione

Depends on: 1, 2

Context: none

```prompt
/task-implement 16 --review
```

## [x] 4. Task 17 — Verifica della risposta con normalizzazione

Depends on: none

Context: none

```prompt
/task-implement 17 --review
```

Done: 2026-10-21, commit `812a64d` (3 files, +170/-1). `verifica()` returns the existing `Esito` (`'giusto' | 'sbagliato'`), not the "giusta | sbagliata" literals of the task body.

## [ ] 5. Task 18 — Ciclo dell'allenamento vocaboli

Depends on: 1, 4

Context:
- 2026-10-21 (from step 4): `verifica()` returns the existing `Esito` type of `src/ripasso/livelli.ts` (`'giusto' | 'sbagliato'`), not the "giusta | sbagliata" literals of the task body and feature document; it can be passed to `registraEsito` as is. Whitespace normalisation treats any whitespace (tabs, newlines) as a space.

```prompt
/task-implement 18 --review --rounds 2
```

## [ ] 6. Task 19 — Schermata Vocaboli al posto del segnaposto

Depends on: 2, 5

Context: none

```prompt
/task-implement 19 --review
```

## [ ] 7. Task 20 — Documentazione della feature allenamento-vocaboli

Depends on: 4, 5, 6

Context: none

```prompt
/task-implement 20 --review
```

## [x] 8. Task 21 — Voci ordinate e filtro di ricerca del dizionario

Depends on: none

Context: none

```prompt
/task-implement 21 --review
```

Done: 2026-10-21, commit `40733b9` (5 files, +174/-1).

## [ ] 9. Task 22 — Schermata Dizionario al posto del segnaposto

Depends on: 2, 8

Context: none

```prompt
/task-implement 22 --review
```

## [ ] 10. Task 23 — Documentazione della feature dizionario-vocaboli

Depends on: 8, 9

Context: none

```prompt
/task-implement 23 --review
```

## [x] 11. Task 24 — Elenco della grammatica e conversione del Markdown delle schede

Depends on: none

Context: none

```prompt
/task-implement 24 --review --rounds 2
```

Done: 2026-10-21, commit `2077cd5` (7 files, +274/-1). `@types/markdown-it` is not needed — `markdown-it` 15.0.3 ships its own types, so only `markdown-it` was added.

## [ ] 12. Task 25 — Schermata Grammatica con l'elenco delle lezioni

Depends on: 2, 11

Context:
- 2026-10-21 (from step 11): `elenco()` returns `VoceGrammatica` entries shaped `{ id, title, schede: string[] }` (`title` as in `LezioneCatalogo`); task 25 uses these names.

```prompt
/task-implement 25 --review
```

## [ ] 13. Task 26 — Pagina della lezione con le schede e stile del testo

Depends on: 11, 12

Context: none

```prompt
/task-implement 26 --review --rounds 2
```

## [ ] 14. Task 27 — Documentazione della feature schede-grammatica

Depends on: 11, 12, 13

Context: none

```prompt
/task-implement 27 --review
```

## [ ] 15. Aggiornare il context layer

Depends on: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14

Context: none

```prompt
/context-update
```

## Do not re-propose

- Dividere ogni passo `/task-implement <n> --review` in un passo di implementazione e uno di revisione (regola 10 di `/runbook-create`): rifiutato, è una scelta dell'utente tenere implementazione e revisione nello stesso passo.
