# Runbook: architettura

Created: 2026-10-21 · Source: /product-design run · Model: opus
Last step number: 8
Execution policy: attended
Sequencing: lo scheletro e il formato dei contenuti vengono prima perché ogni altra funzionalità li usa; la ripetizione prima delle sessioni che la interrogano.

## [x] 1. Architettare lo scheletro dell'app e la pubblicazione

Depends on: none

Needs: agent+human

Context: none

```prompt
/architect "Scheletro dell'app e pubblicazione" — l'applicazione Vue 3 + Vite + TypeScript vuota con Vue Router in modalità hash e Vitest configurato, la navigazione tra le schermate (esercizi, allenamento vocaboli, dizionario, grammatica), il layout responsivo per telefono e computer, e la GitHub Action che a ogni push sul branch principale esegue i test, compila e pubblica su GitHub Pages con il dominio personalizzato maies.chosko.com servito alla radice `/`.

Questa funzionalità non è una sezione di `.claude/domain/product-design.md`: è stata aggiunta durante la pianificazione perché nessuna delle sei funzionalità di alto livello copre il progetto di base e la pubblicazione. Le decisioni tecniche sono già in `.claude/domain/technical-direction.md`; adottale, non ridiscuterle. Il record CNAME di maies.chosko.com verso GitHub esiste già. Le schermate qui sono solo segnaposto navigabili: il loro contenuto appartiene alle funzionalità architettate nei passi successivi.

Con l'utente parla in italiano.
```

Done: 2026-10-21, commit `200fdb7` (3 files, +132/-0). Feature `scheletro-e-pubblicazione`; dominio, sorgente "GitHub Actions" e HTTPS di Pages vanno impostati a mano (GitHub ignora il CNAME con il deploy via Action); il sito si pubblica solo da `main`.

## [ ] 2. Architettare l'aggiunta del materiale da una lezione

Depends on: 1

Needs: agent+human

Context: none

```prompt
/architect "Aggiunta del materiale da una lezione"

Va architettata subito dopo lo scheletro e prima di tutte le altre funzionalità, perché definisce il formato dei file di lezione — lezioni, frasi con traduzione corretta e varianti accettabili, vocaboli con traduzioni accettate, schede di grammatica in Markdown, e gli identificatori stabili di ogni elemento — che tutte le altre funzionalità leggono e da cui la ripetizione degli errori indicizza i progressi. Il documento deve fissare questo formato in modo che le altre funzionalità lo adottino senza ridefinirlo.

Il materiale non viene generato dall'app: è Claude a scrivere i file nel repository a partire dai PDF, dalle foto o dagli elenchi di vocaboli che l'utente passa in chat. Il documento descrive quindi anche il procedimento che una sessione di Claude segue per trasformare un PDF in un file di lezione (quante frasi ricavare, come evitare duplicati con le lezioni esistenti, come aggiungere un vocabolo singolo passato in chat), oltre allo schema e al test che lo valida.

Con l'utente parla in italiano.
```

## [ ] 3. Architettare la ripetizione degli errori

Depends on: 2

Needs: agent+human

Context: none

```prompt
/architect "Ripetizione degli errori"

Viene prima degli esercizi di traduzione e dell'allenamento vocaboli, perché entrambe le sessioni le chiedono quale elemento proporre dopo: l'interfaccia che espone va decisa qui e adottata da quelle due. Indicizza i progressi con gli identificatori stabili definiti dal formato dei file di lezione (documento della funzionalità "Aggiunta del materiale da una lezione" in `.claude/domain/features/`).

L'algoritmo di ripetizione è lasciato aperto da `.claude/domain/technical-direction.md` e va scelto qui con l'utente. Va bene una soluzione semplice: l'obiettivo dichiarato del prodotto è essere rapido da implementare.

Con l'utente parla in italiano.
```

## [ ] 4. Architettare gli esercizi di traduzione

Depends on: 2, 3

Needs: agent+human

Context: none

```prompt
/architect "Esercizi di traduzione"

Adotta il formato dei file di lezione e l'interfaccia della ripetizione degli errori così come li fissano i loro documenti in `.claude/domain/features/`; non ridefinirli.

Con l'utente parla in italiano.
```

## [ ] 5. Architettare l'allenamento vocaboli

Depends on: 2, 3

Needs: agent+human

Context: none

```prompt
/architect "Allenamento vocaboli"

Adotta il formato dei file di lezione e l'interfaccia della ripetizione degli errori così come li fissano i loro documenti in `.claude/domain/features/`; non ridefinirli.

Con l'utente parla in italiano.
```

## [ ] 6. Architettare il dizionario dei vocaboli

Depends on: 2

Needs: agent+human

Context: none

```prompt
/architect "Dizionario dei vocaboli"

Adotta il formato dei file di lezione così come lo fissa il documento della funzionalità "Aggiunta del materiale da una lezione" in `.claude/domain/features/`; non ridefinirlo.

Con l'utente parla in italiano.
```

## [ ] 7. Architettare le schede di grammatica

Depends on: 2

Needs: agent+human

Context: none

```prompt
/architect "Schede di grammatica"

Adotta il formato dei file di lezione così come lo fissa il documento della funzionalità "Aggiunta del materiale da una lezione" in `.claude/domain/features/`; non ridefinirlo.

Con l'utente parla in italiano.
```

## [ ] 8. Scrivere il piano di produzione

Depends on: 1, 2, 3, 4, 5, 6, 7

Needs: agent+human

Context: none

```prompt
/production-plan

Il progetto non ha una roadmap (`/product-roadmap` non è stato eseguito, e non va eseguito qui). Questo passo va per ultimo: ordina tutte le funzionalità architettate nei passi precedenti. Il piano che produce decide l'ordine in cui il runbook `pianificazione-task` scrive i task, e i gruppi in cui i task vengono poi divisi nei runbook di implementazione.

Con l'utente parla in italiano.
```

## Do not re-propose

- Intelligenza artificiale dentro l'app (generazione degli esercizi dal browser con una chiave API): rifiutata, l'app resta un sito statico e il materiale lo scrive Claude nel repository.
- Svelte o React: scelto Vue, il framework che l'utente già conosce.
- Sincronizzazione dei progressi tra dispositivi e PWA: rimandate, sono decisioni aperte in `technical-direction.md`, non da introdurre ora.
- Salvare nel repository i PDF o le foto originali della scuola: escluso, repository e sito sono pubblici.
- Eseguire questo runbook in parallelo o in modalità unattended: ogni passo richiede la presenza dell'utente.
