# Runbook: pianificazione-task

Created: 2026-10-21 · Source: /product-design run · Model: opus
Last step number: 8
Execution policy: attended
Sequencing: i task si scrivono nell'ordine di `.claude/PLAN.md`, così i numeri dei task seguono l'ordine di costruzione.

## [ ] 1. Scrivere i task dello scheletro dell'app e della pubblicazione

Depends on: none

Needs: agent+human

Context: none

```prompt
Esegui `/task-add feature=<slug>` per ogni documento di feature nato dalla funzionalità "Scheletro dell'app e pubblicazione": trova gli slug in `.claude/FEATURES.md` (sono le voci il cui `Source:` cita quella funzionalità; `/architect` può averla divisa in più documenti) e procedi nell'ordine in cui `.claude/PLAN.md` li elenca, un `/task-add` alla volta.

Questo runbook parte solo dopo che il runbook `architettura` è `[DONE]`: se `.claude/PLAN.md` non esiste, fermati e dillo.

Ogni azione che richiede l'utente (per esempio attivare GitHub Pages o il dominio personalizzato nelle impostazioni del repository) va in un task con il `Target:` che lo dichiara, non lasciata implicita.

Con l'utente parla in italiano.
```

## [ ] 2. Scrivere i task dell'aggiunta del materiale da una lezione

Depends on: 1

Needs: agent+human

Context: none

```prompt
Esegui `/task-add feature=<slug>` per ogni documento di feature nato dalla funzionalità "Aggiunta del materiale da una lezione": trova gli slug in `.claude/FEATURES.md` (le voci il cui `Source:` cita quella funzionalità) e procedi nell'ordine in cui `.claude/PLAN.md` li elenca, un `/task-add` alla volta.

Con l'utente parla in italiano.
```

## [ ] 3. Scrivere i task della ripetizione degli errori

Depends on: 2

Needs: agent+human

Context: none

```prompt
Esegui `/task-add feature=<slug>` per ogni documento di feature nato dalla funzionalità "Ripetizione degli errori": trova gli slug in `.claude/FEATURES.md` (le voci il cui `Source:` cita quella funzionalità) e procedi nell'ordine in cui `.claude/PLAN.md` li elenca, un `/task-add` alla volta.

Con l'utente parla in italiano.
```

## [ ] 4. Scrivere i task degli esercizi di traduzione

Depends on: 3

Needs: agent+human

Context: none

```prompt
Esegui `/task-add feature=<slug>` per ogni documento di feature nato dalla funzionalità "Esercizi di traduzione": trova gli slug in `.claude/FEATURES.md` (le voci il cui `Source:` cita quella funzionalità) e procedi nell'ordine in cui `.claude/PLAN.md` li elenca, un `/task-add` alla volta.

Con l'utente parla in italiano.
```

## [ ] 5. Scrivere i task dell'allenamento vocaboli

Depends on: 3

Needs: agent+human

Context: none

```prompt
Esegui `/task-add feature=<slug>` per ogni documento di feature nato dalla funzionalità "Allenamento vocaboli": trova gli slug in `.claude/FEATURES.md` (le voci il cui `Source:` cita quella funzionalità) e procedi nell'ordine in cui `.claude/PLAN.md` li elenca, un `/task-add` alla volta.

Con l'utente parla in italiano.
```

## [ ] 6. Scrivere i task del dizionario dei vocaboli

Depends on: 2

Needs: agent+human

Context: none

```prompt
Esegui `/task-add feature=<slug>` per ogni documento di feature nato dalla funzionalità "Dizionario dei vocaboli": trova gli slug in `.claude/FEATURES.md` (le voci il cui `Source:` cita quella funzionalità) e procedi nell'ordine in cui `.claude/PLAN.md` li elenca, un `/task-add` alla volta.

Con l'utente parla in italiano.
```

## [ ] 7. Scrivere i task delle schede di grammatica

Depends on: 2

Needs: agent+human

Context: none

```prompt
Esegui `/task-add feature=<slug>` per ogni documento di feature nato dalla funzionalità "Schede di grammatica": trova gli slug in `.claude/FEATURES.md` (le voci il cui `Source:` cita quella funzionalità) e procedi nell'ordine in cui `.claude/PLAN.md` li elenca, un `/task-add` alla volta.

Con l'utente parla in italiano.
```

## [ ] 8. Creare i runbook di implementazione

Depends on: 1, 2, 3, 4, 5, 6, 7

Needs: agent+human

Context:
- 2026-10-21 (amend): nel runbook `implementazione-fondamenta`, subito dopo l'ultimo task della funzionalità `scheletro-e-pubblicazione`, aggiungi due passi che dipendono da esso: `/task-setup` (genera gli script `.claude/external/run-*.sh`, ora che Vitest esiste) e poi `/context-build` (crea il context layer, nel layout flat predefinito). I task delle altre funzionalità dipendono da `/context-build`.
- 2026-10-21 (amend): ogni runbook di implementazione termina con un passo `/context-update`, che dipende da tutti i passi del runbook.
- 2026-10-21 (amend): eccezione alla modalità unattended dei runbook di implementazione, voluta dall'utente: i passi `/task-setup` e `/context-build` di `implementazione-fondamenta` devono aspettare l'utente prima di proseguire. Scrivili con `Needs: agent+human` e con il prompt `/task-setup --attended` e `/context-build --attended`, così ogni loro conferma e domanda si ferma in attesa dell'utente (sotto la policy unattended il passo resta in pausa finché l'utente non risponde, e i passi che dipendono da `/context-build` non partono prima).
- 2026-10-21 (amend): ogni passo `/task-implement` dei runbook di implementazione porta `--review` (`/task-implement <n> --review`). Ai soli task più complessi (logica con molti casi, più moduli toccati insieme, o il formato e la validazione dei contenuti) aggiungi anche `--rounds 2`, e nomina questi task al gate. È una scelta dell'utente: non dividere il passo in implementazione e revisione separate (regola 10 di `/runbook-create`), e dillo nel report di conferma.

```prompt
Crea con `/runbook-create` i runbook di implementazione che coprono tutti i task `[TODO]` di `.claude/TASKS.md`, ognuno con un passo `/task-implement <n>` per task. Va per ultimo: richiede che tutti i task esistano.

Decisioni già prese con l'utente:
- Un runbook per gruppo: un gruppo per milestone di `.claude/PLAN.md` se il piano ne ha più di una; altrimenti due gruppi, `implementazione-fondamenta` (scheletro dell'app e pubblicazione, aggiunta del materiale, ripetizione degli errori) e `implementazione-schermate` (esercizi di traduzione, allenamento vocaboli, dizionario, schede di grammatica). I runbook si eseguono uno alla volta, nell'ordine dei gruppi: dillo all'utente nel report finale, perché una dipendenza tra runbook non si può esprimere con `Depends on:`.
- Ogni runbook di implementazione è unattended (`Execution policy: unattended`) e parallelo (`Parallelism: 4`); le dipendenze tra passi seguono le `Preconditions:` dei task in `.claude/TASKS.md`. Un task con `Target:` diverso da `claude` porta il `Needs:` corrispondente.
- Nessun passo invoca `/runbook-run`.

Con l'utente parla in italiano.
```

## Do not re-propose

- Un unico runbook per architettura e task: rifiutato, il piano di produzione e i documenti di feature vanno rivisti insieme prima di scrivere i task.
- Un unico runbook di implementazione con tutti i task: rifiutato, un runbook per gruppo.
- Eseguire questo runbook in parallelo o in modalità unattended: ogni passo richiede la presenza dell'utente.
