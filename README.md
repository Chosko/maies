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
