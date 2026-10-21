# Design process

The state of this project's `/product-design` run. `/product-design` reads
this file to decide where to resume; nothing else records that.

## Method

Design top-down del prodotto: utente e Claude attraversano le fasi qui sotto
in conversazione; l'output di ogni fase viene scritto in product-design.md
(e in technical-direction.md per le fasi 6-7) prima che inizi la successiva.

Greenfield or brownfield: greenfield — il repository non contiene codice né documenti di prodotto.
Business modelling: out of scope

## Phases

| Phase | What it does | State |
| --- | --- | --- |
| 0 — gate + resume | Verify the domain layer; resume or start fresh | done |
| 1 — orient + stub | Detect greenfield/brownfield, create the documents | done |
| 2 — interview | Product, users, experience, big decisions | done |
| 3 — write-back | Fill product-design.md | done |
| 4 — high-level features | Identify the feature set, user-experience angle | done |
| 5 — feature write-back | Record the feature set in product-design.md | done |
| 6 — technical direction | Decide the product's technical foundations | done |
| 7 — technical write-back | Record the direction in technical-direction.md | done |

## Current stage

**Process complete.**

- product-design.md — prodotto, utente, flussi, decisioni e sei funzionalità di alto livello.
- technical-direction.md — Vue 3 + Vite + TypeScript, contenuti JSON per lezione, progressi in localStorage, GitHub Pages su maies.chosko.com.

Funzionalità architettate e ordinate in `.claude/PLAN.md`. Prossimo passo: `/runbook-run pianificazione-task`, dopo il design della UI.

## Decisions worth keeping

- Nessuna AI nell'app: il materiale lo genera Claude nel repository dai PDF passati in chat — niente chiavi API né costi d'uso, e resta un sito statico.
- Traduzioni corrette per autovalutazione: una frase ha troppe traduzioni valide per un controllo automatico senza AI.
- Vocaboli aggiunti a mano passano da Claude in chat, non dall'app: dati salvati solo nel browser andrebbero persi e non comparirebbero sugli altri dispositivi.
- Progressi per dispositivo, senza sincronizzazione: sincronizzare senza server richiederebbe un servizio esterno; da rivedere solo se mancherà.
- Vue invece di Svelte: è il framework che Sara già conosce, la differenza di prestazioni a questa scala è trascurabile.
- Router in modalità hash: GitHub Pages non reindirizza gli indirizzi interni di una SPA.
- Mai i PDF originali nel repository: repository e sito sono pubblici.
- Nessun test in un browser reale: appesantisce lo sviluppo, e per un'app di queste dimensioni il DOM simulato basta.
- Il design approvato vive copiato in `design/`: chi implementa lo legge dal repository, senza dipendere dagli artifact di Claude Design.
