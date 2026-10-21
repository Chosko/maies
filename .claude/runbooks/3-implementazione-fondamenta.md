# Runbook: implementazione-fondamenta

Created: 2026-10-21 · Source: runbook pianificazione-task · Model: opus
Last step number: 16
Execution policy: unattended
Parallelism: 4

## [ ] 1. Task 1 — Creare il progetto Vue con router e schermate segnaposto

Depends on: none

Context: none

```prompt
/task-implement 1 --review
```

## [ ] 2. Task 2 — Stile di base generato dai token del design

Depends on: 1

Context: none

```prompt
/task-implement 2 --review
```

## [ ] 3. Task 3 — Barra di navigazione e layout responsivo del guscio

Depends on: 1, 2

Context: none

```prompt
/task-implement 3 --review
```

## [ ] 4. Task 4 — Pubblicazione automatica su GitHub Pages

Depends on: 1

Needs: agent+human

Context: none

```prompt
/task-implement 4 --review
```

## [ ] 5. Task 5 — Documentazione della feature scheletro-e-pubblicazione

Depends on: 1, 2, 3, 4

Context: none

```prompt
/task-implement 5 --review
```

## [ ] 6. Generare gli script dei test esterni

Depends on: 5

Needs: agent+human

Context:
- 2026-10-21 (amend): esegui il passo come `/task-setup --attended --commit`, così lo scaffolding finisce in un commit e il passo 7 (`/context-build --attended`) trova l'albero pulito. È una richiesta dell'utente.

```prompt
/task-setup --attended
```

## [ ] 7. Creare il context layer

Depends on: 6

Needs: agent+human

Context: none

```prompt
/context-build --attended
```

## [ ] 8. Task 6 — Schema delle lezioni e test di validità dei contenuti

Depends on: 1, 7

Context: none

```prompt
/task-implement 6 --review --rounds 2
```

## [ ] 9. Task 7 — Catalogo dei contenuti in sola lettura

Depends on: 1, 8, 7

Context: none

```prompt
/task-implement 7 --review
```

## [ ] 10. Task 8 — Skill di progetto per aggiungere il materiale di una lezione

Depends on: 8, 7

Context: none

```prompt
/task-implement 8 --review
```

## [ ] 11. Task 9 — Documentazione della feature aggiunta-materiale-lezione

Depends on: 8, 9, 10, 7

Context: none

```prompt
/task-implement 9 --review
```

## [ ] 12. Task 10 — Livelli e archivio dei progressi nel browser

Depends on: 1, 7

Context: none

```prompt
/task-implement 10 --review --rounds 2
```

## [ ] 13. Task 11 — Selettore pesato del prossimo elemento

Depends on: 12, 7

Context: none

```prompt
/task-implement 11 --review --rounds 2
```

## [ ] 14. Task 12 — Sessione di ripasso per frasi e vocaboli

Depends on: 9, 12, 13, 7

Context: none

```prompt
/task-implement 12 --review --rounds 2
```

## [ ] 15. Task 13 — Documentazione della feature ripetizione-errori

Depends on: 12, 13, 14, 7

Context: none

```prompt
/task-implement 13 --review
```

## [ ] 16. Aggiornare il context layer

Depends on: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15

Context: none

```prompt
/context-update
```

## Do not re-propose

- Dividere ogni passo `/task-implement <n> --review` in un passo di implementazione e uno di revisione (regola 10 di `/runbook-create`): rifiutato, è una scelta dell'utente tenere implementazione e revisione nello stesso passo.
