# Runbook: implementazione-schermate

Created: 2026-10-21 · Source: runbook pianificazione-task · Model: opus
Last step number: 15
Execution policy: unattended
Parallelism: 4

## [ ] 1. Task 14 — Ciclo dell'esercizio di traduzione

Depends on: none

Context: none

```prompt
/task-implement 14 --review --rounds 2
```

## [ ] 2. Task 15 — Schermata Esercizi al posto del segnaposto

Depends on: 1

Context: none

```prompt
/task-implement 15 --review
```

## [ ] 3. Task 16 — Documentazione della feature esercizi-traduzione

Depends on: 1, 2

Context: none

```prompt
/task-implement 16 --review
```

## [ ] 4. Task 17 — Verifica della risposta con normalizzazione

Depends on: none

Context: none

```prompt
/task-implement 17 --review
```

## [ ] 5. Task 18 — Ciclo dell'allenamento vocaboli

Depends on: 4

Context: none

```prompt
/task-implement 18 --review --rounds 2
```

## [ ] 6. Task 19 — Schermata Vocaboli al posto del segnaposto

Depends on: 5

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

## [ ] 8. Task 21 — Voci ordinate e filtro di ricerca del dizionario

Depends on: none

Context: none

```prompt
/task-implement 21 --review
```

## [ ] 9. Task 22 — Schermata Dizionario al posto del segnaposto

Depends on: 8

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

## [ ] 11. Task 24 — Elenco della grammatica e conversione del Markdown delle schede

Depends on: none

Context: none

```prompt
/task-implement 24 --review --rounds 2
```

## [ ] 12. Task 25 — Schermata Grammatica con l'elenco delle lezioni

Depends on: 11

Context: none

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
