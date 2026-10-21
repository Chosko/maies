# Domain index

Product and rules knowledge for maies. Read this first, then the
files relevant to your task.

This layer answers WHAT the product is and WHY it is built this way. For
CODEBASE STRUCTURE — which file implements what — see
[../context/INDEX.md](../context/INDEX.md) if the project has a context
layer.

## Files

| File | Covers |
| --- | --- |
| [design-process.md](./design-process.md) | Stato del processo di `/product-design`: metodo, fasi, fase corrente |
| [product-design.md](./product-design.md) | Il design del prodotto: cos'è, utenti, flussi, decisioni, funzionalità di alto livello |
| [technical-direction.md](./technical-direction.md) | Le fondamenta tecniche del prodotto: stack, topologia, dati, hosting |
| [features/scheletro-e-pubblicazione.md](./features/scheletro-e-pubblicazione.md) | Scheletro dell'app: progetto Vue, rotte e navigazione, layout responsivo, pubblicazione su GitHub Pages |
| [features/aggiunta-materiale-lezione.md](./features/aggiunta-materiale-lezione.md) | Formato dei file di lezione e identificatori stabili, catalogo dei contenuti, test di validità, procedimento di Claude per aggiungere materiale |
| [features/ripetizione-errori.md](./features/ripetizione-errori.md) | Progressi nel browser per id globale, algoritmo a tre livelli, sessione di ripasso usata da esercizi e vocaboli |
| [features/esercizi-traduzione.md](./features/esercizi-traduzione.md) | Schermata degli esercizi: ciclo risposta, soluzione e autovalutazione, frase successiva dalla sessione di ripasso |
| [features/allenamento-vocaboli.md](./features/allenamento-vocaboli.md) | Schermata dei vocaboli: verifica automatica con normalizzazione, ciclo risposta, esito e Avanti, vocabolo successivo dalla sessione di ripasso |
| [features/dizionario-vocaboli.md](./features/dizionario-vocaboli.md) | Schermata del dizionario: vocaboli in ordine alfabetico, ricerca in italiano e inglese |

## Features

Low-level feature documents live under [features/](./features/), one per
feature, written by `/architect`. The feature index — status and generated
task IDs per feature — is [../FEATURES.md](../FEATURES.md).
