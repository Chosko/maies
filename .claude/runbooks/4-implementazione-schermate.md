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

## [x] 2. Task 15 — Schermata Esercizi al posto del segnaposto

Depends on: 1

Context:
- 2026-10-21 (from step 1): `creaCiclo(opzioni?)` in `src/esercizi/ciclo.ts` exposes `avvio()`, `conferma(testo)`, `segna('giusta' | 'sbagliata')` and a read-only reactive `stato` (`fase`, `frase`, `testo`, `titoloLezione`); phases are `'in-attesa-di-risposta'`, `'soluzione-mostrata'`, `'nessun-materiale'`. The cycle starts in `'nessun-materiale'` until `avvio()`, so the screen must call `avvio()` synchronously in setup to avoid flashing the no-material message.

```prompt
/task-implement 15 --review
```

Done: 2026-10-21, commit `67a15ff` (7 files, +551/-8). The screen title is "Esercizi" as in the boards, not the placeholder's "Esercizi di traduzione".

## [x] 3. Task 16 — Documentazione della feature esercizi-traduzione

Depends on: 1, 2

Context: none

```prompt
/task-implement 16 --review
```

Done: 2026-10-21, commit `9828384` (2 files, +20/-1).

## [x] 4. Task 17 — Verifica della risposta con normalizzazione

Depends on: none

Context: none

```prompt
/task-implement 17 --review
```

Done: 2026-10-21, commit `812a64d` (3 files, +170/-1). `verifica()` returns the existing `Esito` (`'giusto' | 'sbagliato'`), not the "giusta | sbagliata" literals of the task body.

## [x] 5. Task 18 — Ciclo dell'allenamento vocaboli

Depends on: 1, 4

Context:
- 2026-10-21 (from step 4): `verifica()` returns the existing `Esito` type of `src/ripasso/livelli.ts` (`'giusto' | 'sbagliato'`), not the "giusta | sbagliata" literals of the task body and feature document; it can be passed to `registraEsito` as is. Whitespace normalisation treats any whitespace (tabs, newlines) as a space.

```prompt
/task-implement 18 --review --rounds 2
```

Done: 2026-10-21, commit `c3d0e51` (3 files, +320/-1).

## [x] 6. Task 19 — Schermata Vocaboli al posto del segnaposto

Depends on: 2, 5

Context:
- 2026-10-21 (from step 5): `creaCiclo` in `src/vocaboli/ciclo.ts` exposes phases `'in-attesa-di-risposta' | 'esito-mostrato' | 'nessun-materiale'` and a state of `fase`, `vocabolo`, `testo`, `esito` (the `Esito` type, `'giusto' | 'sbagliato'`) and `titoloLezione`.
- 2026-10-21 (from step 2): the Esercizi screen takes its cycle as a prop `creaCiclo?: () => CicloEsercizio` defaulting to the app's cycle (not `provide`) — a pattern the other screens can follow. `tests/tokens.test.ts` "placeholder screens" checks "in arrivo" only for the routes still placeholders: drop this route from that list. Screen styles go at the end of `src/styles/elements.css` and in the 768px block of `src/styles/computer.css`, where parallel steps may conflict on rebase.

```prompt
/task-implement 19 --review
```

Done: 2026-10-21, commit `4451399` (8 files, +608/-27). The screen title is "Vocaboli" as in the boards, not "Allenamento vocaboli"; no route is a placeholder any more, so the "still say the content is coming" test was removed.

## [x] 7. Task 20 — Documentazione della feature allenamento-vocaboli

Depends on: 4, 5, 6

Context: none

```prompt
/task-implement 20 --review
```

Done: 2026-10-21, commit `c0e4376` (2 files, +24/-1).

## [x] 8. Task 21 — Voci ordinate e filtro di ricerca del dizionario

Depends on: none

Context: none

```prompt
/task-implement 21 --review
```

Done: 2026-10-21, commit `40733b9` (5 files, +174/-1).

## [x] 9. Task 22 — Schermata Dizionario al posto del segnaposto

Depends on: 2, 8

Context:
- 2026-10-21 (from step 2): the Esercizi screen takes its cycle as a prop `creaCiclo?: () => CicloEsercizio` defaulting to the app's cycle (not `provide`) — a pattern the other screens can follow. `tests/tokens.test.ts` "placeholder screens" checks "in arrivo" only for the routes still placeholders: drop this route from that list. Screen styles go at the end of `src/styles/elements.css` and in the 768px block of `src/styles/computer.css`, where parallel steps may conflict on rebase.

```prompt
/task-implement 22 --review
```

Done: 2026-10-21, commit `94c9f69` (8 files, +420/-9). The screen title is "Dizionario" as in the board, not "Dizionario dei vocaboli"; the empty-state copy ("Ancora nessun vocabolo") is the agent's own, as no board fixes it.

## [x] 10. Task 23 — Documentazione della feature dizionario-vocaboli

Depends on: 8, 9

Context: none

```prompt
/task-implement 23 --review
```

Done: 2026-10-21, commit `fa00032` (2 files, +21/-1).

## [x] 11. Task 24 — Elenco della grammatica e conversione del Markdown delle schede

Depends on: none

Context: none

```prompt
/task-implement 24 --review --rounds 2
```

Done: 2026-10-21, commit `2077cd5` (7 files, +274/-1). `@types/markdown-it` is not needed — `markdown-it` 15.0.3 ships its own types, so only `markdown-it` was added.

## [x] 12. Task 25 — Schermata Grammatica con l'elenco delle lezioni

Depends on: 2, 11

Context:
- 2026-10-21 (from step 11): `elenco()` returns `VoceGrammatica` entries shaped `{ id, title, schede: string[] }` (`title` as in `LezioneCatalogo`); task 25 uses these names.
- 2026-10-21 (from step 2): the Esercizi screen takes its cycle as a prop `creaCiclo?: () => CicloEsercizio` defaulting to the app's cycle (not `provide`) — a pattern the other screens can follow. `tests/tokens.test.ts` "placeholder screens" checks "in arrivo" only for the routes still placeholders: drop this route from that list. Screen styles go at the end of `src/styles/elements.css` and in the 768px block of `src/styles/computer.css`, where parallel steps may conflict on rebase.

```prompt
/task-implement 25 --review
```

Done: 2026-10-21, commit `7c2f655` (7 files, +245/-7). The screen title is "Grammatica" as in the board, not the placeholder's "Schede di grammatica".

## [x] 13. Task 26 — Pagina della lezione con le schede e stile del testo

Depends on: 11, 12

Context:
- 2026-10-21 (from step 12): each Grammatica list entry is a plain `<a href="#/grammatica/<id>">`, not a `RouterLink`; task 26 must register the `/grammatica/:id` sub-route for the links to work. The screen takes `catalogo?: Catalogo` as a prop, defaulting to the app's catalogue.

```prompt
/task-implement 26 --review --rounds 2
```

Done: 2026-10-21, commit `04513f9` (6 files, +378/-2). The empty-state copy ("Questa lezione non esiste", "Questa lezione non ha schede") is the agent's own, as the feature document fixes none; the real catalogue is empty, so the router test checks the unknown-lesson state.

## [x] 14. Task 27 — Documentazione della feature schede-grammatica

Depends on: 11, 12, 13

Context: none

```prompt
/task-implement 27 --review
```

Done: 2026-10-21, commit `249a730` (2 files, +20/-1).

## [x] 15. Aggiornare il context layer

Depends on: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14

Context: none

```prompt
/context-update
```

Done: 2026-10-21, commit `040e677` (6 files, +141/-26). INDEX.md's Last updated was already today, so the smart range was taken from the last commit touching it; screens moved out of `app-shell.md` into a new `schermate.md`.

## Do not re-propose

- Dividere ogni passo `/task-implement <n> --review` in un passo di implementazione e uno di revisione (regola 10 di `/runbook-create`): rifiutato, è una scelta dell'utente tenere implementazione e revisione nello stesso passo.
