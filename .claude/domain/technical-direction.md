# Technical direction — maies

maies è una single-page application statica, scelta greenfield: un unico
frontend Vue compilato con Vite e pubblicato su GitHub Pages all'indirizzo
`maies.chosko.com`. Non c'è backend: i contenuti di ripasso sono file nel
repository inclusi nel sito alla compilazione, i progressi vivono nel
browser.

## Stack

- **TypeScript** come unico linguaggio.
- **Vue 3** (Composition API, single-file components) per l'interfaccia,
  con **Vue Router** per le schermate.
- **Vite** per sviluppo e compilazione.
- **Vitest** con **Vue Test Utils** per i test (il progetto segue
  `full-tdd`, vedi CLAUDE.md).
- Le schede di grammatica sono scritte in Markdown e convertite in HTML nel
  browser con una libreria Markdown leggera.

Tutte le funzionalità di `product-design.md` condividono questo stack;
nessuna ne richiede un altro.

## Topology / architecture

Un monolite frontend: una sola applicazione, nessun servizio. Al suo
interno, tre parti con confini netti:

- **Contenuti** — il caricamento dei file delle lezioni e il loro modello
  (lezioni, frasi, vocaboli, schede), di sola lettura per l'app.
- **Progressi e ripetizione** — il salvataggio degli errori e la scelta del
  prossimo elemento da proporre, usata da esercizi e vocaboli.
- **Interfaccia** — le schermate di esercizi, allenamento vocaboli,
  dizionario e grammatica.

## Data and storage

- **Contenuti:** un file JSON per lezione in una cartella dedicata del
  repository, con frasi (italiano, traduzione corretta, varianti
  accettabili), vocaboli (italiano, traduzioni inglesi accettate) e schede
  di grammatica (titolo, testo in Markdown). Ogni elemento ha un
  identificatore stabile, così i progressi sopravvivono a modifiche dei
  contenuti. Vengono letti alla compilazione e inclusi nel sito.
- **Formato validato:** uno schema dei file di lezione, verificato dai
  test, così un file malformato blocca la pubblicazione invece di arrivare
  nell'app.
- **Progressi:** `localStorage` del browser, per dispositivo, indicizzati
  per identificatore di elemento. Nessuna sincronizzazione.
- **PDF e foto originali:** mai salvati nel repository; vi entra solo il
  materiale rielaborato.

## Async / queueing

Nessuno. Non c'è nulla fuori dal ciclo dell'interfaccia: niente processi in
background, code o lavori pianificati. La generazione dei contenuti avviene
fuori dall'app, quando Claude scrive i file delle lezioni.

## Hosting and deployment

- **GitHub Pages**, con il dominio personalizzato `maies.chosko.com` (record
  CNAME già configurato verso GitHub); il sito è servito alla radice `/`.
- **Pubblicazione:** una GitHub Action che, a ogni push sul branch
  principale, installa le dipendenze, esegue i test, compila e pubblica su
  GitHub Pages. Un test fallito blocca la pubblicazione.
- Un solo ambiente: produzione. Lo sviluppo locale usa il server di Vite.

## Inter-component protocols

Nessuno tra componenti: tutto gira nel browser. Il router usa la **modalità
hash** (`#/…`), perché GitHub Pages non reindirizza gli indirizzi interni di
una single-page application.

## Cross-cutting concerns

- **Autenticazione:** nessuna; una sola utente, nessun dato personale sul
  server.
- **Privacy:** il repository e il sito sono pubblici; vi entra solo
  materiale rielaborato, mai i documenti originali della scuola.
- **Osservabilità:** nessuna.
- **Test:** Vitest per la logica (controllo delle risposte ai vocaboli,
  scelta degli elementi da riproporre, salvataggio dei progressi), per la
  validità dei file di lezione e, con Vue Test Utils in un DOM simulato,
  per i componenti. Nessun test in un browser reale (Playwright, Chromium
  o simili), in nessun caso.
- **Interfaccia responsiva:** utilizzabile sia su telefono sia su computer.

## Explicitly open decisions

- **PWA (uso offline e installazione sul telefono):** non prevista ora; da
  aggiungere se l'uso senza connessione si rivela necessario.
- **Sincronizzazione dei progressi tra dispositivi:** non prevista; da
  rivedere solo se i progressi separati per dispositivo si rivelano un
  problema. Richiederebbe un servizio esterno.
