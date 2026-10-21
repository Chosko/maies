# maies

maies è un'applicazione personale per ripassare l'inglese studiato in un
corso a scuola: esercizi di traduzione, allenamento sui vocaboli, un
dizionario e schede di grammatica ricavati dal materiale delle lezioni. È
un sito statico in Vue, pubblicato su <https://maies.chosko.com>.

## Comandi

Dopo `npm install`:

| Comando | Cosa fa |
| --- | --- |
| `npm run dev` | Avvia il server di sviluppo di Vite. |
| `npm test` | Esegue i test con Vitest. |
| `npm run typecheck` | Controlla i tipi con `vue-tsc`. |
| `npm run build` | Compila il sito statico in `dist/`. |

## Contenuti

Il materiale di ripasso sta in `contenuti/lezioni/`, un file JSON per
lezione. Lo scrive solo Claude, con la skill di progetto
[`aggiunta-materiale`](.claude/skills/aggiunta-materiale/SKILL.md), quando
in chat arriva un PDF, una foto o un vocabolo. I PDF e le foto originali non
entrano mai nel repository, che è pubblico.

L'app legge le lezioni alla compilazione dal catalogo in sola lettura
`src/contenuti/catalogo.ts`. Lo schema zod `src/contenuti/schema.ts` è
l'unica definizione del formato: zod è una dipendenza di sviluppo e l'app
importa dallo schema solo tipi, cosa che un test verifica.

Il test di validità (`tests/contenuti.test.ts`) fa parte di `npm test`:
rilegge la cartella con `node:fs` a ogni esecuzione, quindi controlla subito
un file appena scritto, e un file malformato ferma la pubblicazione. I test
che leggono i file girano nell'ambiente `node` di Vitest, con i tipi di
`@types/node`.

Il formato dei file, gli identificatori stabili e il perché sono nel
documento di feature
[`.claude/domain/features/aggiunta-materiale-lezione.md`](.claude/domain/features/aggiunta-materiale-lezione.md).

## Pubblicazione

Ogni push su `main` avvia la GitHub Action `.github/workflows/deploy.yml`,
che controlla i tipi, esegue i test, compila e pubblica `dist/` su GitHub
Pages. Se uno di questi passaggi fallisce, il sito resta alla versione
precedente.

La pubblicazione richiede una configurazione manuale, una volta sola, nelle
impostazioni Pages del repository:

- sorgente: **GitHub Actions**;
- dominio personalizzato: `maies.chosko.com` (il record DNS CNAME punta già
  a GitHub Pages);
- **Enforce HTTPS** attivo.

Il perché di queste scelte è nel documento di feature
[`.claude/domain/features/scheletro-e-pubblicazione.md`](.claude/domain/features/scheletro-e-pubblicazione.md).
