# Runbook: implementazione-fondamenta

Created: 2026-10-21 · Source: runbook pianificazione-task · Model: opus
Last step number: 16
Execution policy: unattended
Parallelism: 4

## [x] 1. Task 1 — Creare il progetto Vue con router e schermate segnaposto

Depends on: none

Context: none

```prompt
/task-implement 1 --review
```

Done: 2026-10-21, commit `3027988` (15 files, +2835/-1). TypeScript fissato a `~6.0.3` (vue-tsc non supporta TS 7) e jsdom a `^29` (la 30 chiede Node ≥ 22.22.2).

## [x] 2. Task 2 — Stile di base generato dai token del design

Depends on: 1

Context: none

```prompt
/task-implement 2 --review
```

Done: 2026-10-21, commit `a23d4b0` (14 files, +632/-17). Aggiunti `src/components/FondoBandiera.vue` (fondo e bandiera, con slot) e `css: true` nella config di Vitest, non previsti dal task.

## [x] 3. Task 3 — Barra di navigazione e layout responsivo del guscio

Depends on: 1, 2

Context:
- 2026-10-21 (from step 2): esiste un solo blocco `@media (min-width: 768px)`, in `src/styles/computer.css`, e un test fa fallire la suite se ne compare un secondo: le regole della barra per il computer vanno lì. Un test di guardia rifiuta colori, font, raggi e spazi scritti a mano negli stili: usare le variabili `--color-*`, `--font-sans`, `--type-*`, `--space-*`, `--radius-*`. `FondoBandiera` avvolge per ora ciascuna delle quattro viste: il guscio probabilmente deve spostarlo in `App.vue`.

```prompt
/task-implement 3 --review
```

Done: 2026-10-21, commit `b218f9d` (10 files, +328/-52). `FondoBandiera` spostato in `App.vue` (le viste non lo usano più); il nome "maies" usa lo stile `sheet-title` (21px) perché i token non hanno uno stile a 22px.

## [x] 4. Task 4 — Pubblicazione automatica su GitHub Pages

Depends on: 1

Needs: agent+human

Context:
- 2026-10-21 (from step 1): il progetto è stato verificato su Node 22.22.0; jsdom 30 e alcune dipendenze indirette chiedono Node ≥ 22.22.2, quindi la Action può usare Node 22 (meglio l'ultima 22.x) ma non deve presupporre un Node più vecchio.
- 2026-10-21 (dall'utente): GitHub Pages è già configurato nelle impostazioni del repository; l'intervento manuale del task 4 è già fatto e non va richiesto. Scrivere solo il workflow. La verifica con `gh api repos/Chosko/maies/pages` non è possibile da una sessione cloud (il proxy blocca quel percorso): annotarlo nel report senza fermarsi.
- 2026-10-21 (dall'utente): la sorgente di Pages era "Deploy from a branch"; l'utente l'ha impostata su "GitHub Actions" (confermato), come prevede il task. Il workflow resta quello del task (azioni ufficiali di Pages, nessun branch `gh-pages`).

```prompt
/task-implement 4 --review
```

Done: 2026-10-21, commit `9bef5ea`, `016eced` (2 files, +47/-1). Il workflow è stato pubblicato dall'utente (`9bef5ea`, identico a quello del task), perché il token della sessione cloud non aveva lo scope `workflow`.

## [x] 5. Task 5 — Documentazione della feature scheletro-e-pubblicazione

Depends on: 1, 2, 3, 4

Context:
- 2026-10-21 (from steps 1–3): scostamenti dal documento di feature da registrare. TypeScript `~6.0.3` e jsdom `^29` per compatibilità; un solo blocco `@media (min-width: 768px)` in `src/styles/computer.css`, protetto da test; variabili dei token generate a runtime da `src/styles/tokens.ts`; `FondoBandiera` nel guscio (`App.vue`); barra del telefono `sticky` in fondo al flusso; il nome "maies" a 21px (`sheet-title`) invece di 22px per mancanza di un token.

```prompt
/task-implement 5 --review
```

Done: 2026-10-21, commit `1ed7883` (2 files, +36/-1).

## [x] 6. Generare gli script dei test esterni

Depends on: 5

Needs: agent+human

Context:
- 2026-10-21 (amend): esegui il passo come `/task-setup --attended --commit`, così lo scaffolding finisce in un commit e il passo 7 (`/context-build --attended`) trova l'albero pulito. È una richiesta dell'utente.

```prompt
/task-setup --attended
```

Done: 2026-10-21, commit `5eddc4b` (4 files, +144/-0). Il backlog esisteva già: aggiunti solo i quattro file di `.claude/external/`, con script di test che lanciano `npm test`.

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
