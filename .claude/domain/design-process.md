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
| 4 — high-level features | Identify the feature set, user-experience angle | not started |
| 5 — feature write-back | Record the feature set in product-design.md | not started |
| 6 — technical direction | Decide the product's technical foundations | not started |
| 7 — technical write-back | Record the direction in technical-direction.md | not started |

## Current stage

**PHASE 4 — high-level features: not started**

Intervista chiusa e product-design.md scritto (prodotto, utente, flussi,
decisioni). Prossimo passo: identificare le funzionalità di alto livello.

## Decisions worth keeping

- Nessuna AI nell'app: il materiale lo genera Claude nel repository dai PDF passati in chat — niente chiavi API né costi d'uso, e resta un sito statico.
- Traduzioni corrette per autovalutazione: una frase ha troppe traduzioni valide per un controllo automatico senza AI.
- Vocaboli aggiunti a mano passano da Claude in chat, non dall'app: dati salvati solo nel browser andrebbero persi e non comparirebbero sugli altri dispositivi.
- Progressi per dispositivo, senza sincronizzazione: sincronizzare senza server richiederebbe un servizio esterno; da rivedere solo se mancherà.
