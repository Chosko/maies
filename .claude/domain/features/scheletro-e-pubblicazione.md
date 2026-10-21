# Scheletro dell'app e pubblicazione

L'applicazione maies vuota ma navigabile: il progetto Vue con le quattro
schermate segnaposto (esercizi, allenamento vocaboli, dizionario,
grammatica) raggiungibili da una barra di navigazione, un layout che si
adatta a telefono e computer, i test configurati, e la pubblicazione
automatica del sito su `maies.chosko.com` a ogni push sul branch principale.

## Purpose

Ogni funzionalità di [product-design.md](../product-design.md) è una
schermata o un modulo dentro la stessa applicazione statica, e tutte
arrivano a Sara solo attraverso il sito pubblicato. Questa funzionalità
fornisce il contenitore comune — progetto, navigazione, layout, test e
pubblicazione — così che le funzionalità successive aggiungano solo il
proprio contenuto. Serve la decisione "Funziona su telefono e computer" e
il passo 4 del flusso "Arriva una nuova lezione" (il nuovo materiale
compare dopo la pubblicazione).

## Scope and non-goals

In:

- Il progetto Vue 3 + Vite + TypeScript, con Vue Router e Vitest
  configurati e un test di esempio funzionante.
- Le quattro schermate come segnaposto: ognuna mostra il proprio titolo e
  un'indicazione che il contenuto è in arrivo.
- La navigazione tra le schermate e il layout responsivo.
- La GitHub Action di test, compilazione e pubblicazione su GitHub Pages.

Fuori:

- **Il contenuto delle schermate**, il formato dei file di lezione, i
  progressi e la ripetizione: appartengono alle funzionalità architettate
  dopo questa.
- **Una pagina iniziale**: con la barra sempre visibile non serve.
- **Rotte annidate** (per esempio la grammatica di una singola lezione):
  le aggiunge la funzionalità che ne ha bisogno.
- **ESLint, Prettier e librerie di componenti o di CSS**: non servono a un
  prodotto di questa dimensione.
- **Esecuzione della Action su pull request o altri branch**: gira solo sui
  push al branch principale.
- **PWA e sincronizzazione dei progressi**: decisioni aperte in
  [technical-direction.md](../technical-direction.md).

## Architecture

Costruito sullo stack di [technical-direction.md](../technical-direction.md):
TypeScript, Vue 3 con Composition API e single-file components, Vue Router
in modalità hash, Vite, Vitest con Vue Test Utils, GitHub Pages.

- **Guscio dell'applicazione** — il componente radice. Contiene la barra di
  navigazione e lo spazio in cui il router mostra la schermata corrente.
  Imposta la lingua della pagina (italiano) e il titolo "maies".
- **Router** — Vue Router con cronologia hash. Associa ogni schermata al
  suo indirizzo e porta `#/` e ogni indirizzo sconosciuto agli Esercizi.
  È l'unico punto in cui le funzionalità successive registrano le proprie
  schermate e sottorotte.
- **Barra di navigazione** — un componente con le quattro voci, che
  evidenzia quella corrente. Sul telefono è una barra di schede fissa in
  basso, a portata di pollice; sul computer è una pillola in alto a destra
  accanto al nome "maies". Stesse voci, stesso ordine, su ogni schermo.
  L'aspetto è quello delle schermate in `design/schermate/`: la barra in
  basso in qualunque schermata da telefono, quella in alto in
  `EserciziComputer.dc.html`.
- **Schermate segnaposto** — un componente per schermata, sostituito dalla
  funzionalità che ne porta il contenuto.
- **Stile di base** — CSS semplice, scritto mobile-first, con un solo punto
  di passaggio tra layout telefono e computer. Una variabile CSS per ogni
  token di `design/tokens.json`, generata dal file e non trascritta a mano,
  così una copia nuova del design aggiorna lo stile; il carattere Poppins;
  gli elementi comuni descritti in `design/design-system.md` (fondo con
  bagliore e bandiera a linee, carte, bottoni, campi, cerchi icona), che le
  schermate future riusano.
- **Pipeline di pubblicazione** — una GitHub Action che, a ogni push sul
  branch principale (`main`), installa le dipendenze, esegue il controllo
  dei tipi e i test, compila e pubblica su GitHub Pages. Se uno di questi
  passi fallisce, il sito non viene pubblicato.

## Data and state

Nessun dato persistito. L'unico stato è la rotta corrente, che vive
nell'indirizzo (`#/…`) ed è quindi condivisibile e sopravvive al
ricaricamento della pagina.

## Interfaces and contracts

- **Indirizzi delle schermate:** `#/esercizi` (Esercizi di traduzione),
  `#/vocaboli` (Allenamento vocaboli), `#/dizionario` (Dizionario dei
  vocaboli), `#/grammatica` (Schede di grammatica). `#/` e ogni indirizzo
  sconosciuto portano a `#/esercizi`. Le funzionalità successive mantengono
  questi indirizzi e possono aggiungere sottorotte sotto il proprio.
- **Base del sito:** l'applicazione è compilata per essere servita alla
  radice `/` del dominio, non sotto il nome del repository.
- **Comandi del progetto:** sviluppo locale con il server di Vite;
  comandi separati per test, controllo dei tipi e compilazione, ognuno con
  esito non nullo in caso di fallimento. La Action usa gli stessi comandi.
- **Contratto di pubblicazione:** un push su `main` con test, controllo dei
  tipi e compilazione riusciti pubblica il sito; un fallimento lascia
  online la versione precedente.
- **Configurazione manuale di GitHub Pages:** con la pubblicazione tramite
  Action, GitHub ignora un file CNAME nel sito. L'utente imposta nelle
  impostazioni Pages del repository la sorgente "GitHub Actions", il
  dominio personalizzato `maies.chosko.com` e "Enforce HTTPS". Il record
  DNS CNAME esiste già. È un intervento manuale del task di pubblicazione.

## Dependencies

Nessuna dipendenza da altre funzionalità: è la base di tutte.

Dipendenze esterne:

- **vue, vue-router** — interfaccia e schermate, come da direzione tecnica.
- **vite e il plugin Vue di Vite** — sviluppo e compilazione.
- **typescript, vue-tsc** — il controllo dei tipi dei single-file
  components, che la Action esegue prima dei test.
- **vitest, @vue/test-utils e un DOM simulato (jsdom)** — i test dei
  componenti.
- **Le azioni ufficiali di GitHub per Pages** (configurazione, caricamento
  del sito, pubblicazione) e quella di Node per l'installazione — la
  pubblicazione senza server.

## Open questions

- **Il nome del branch principale** è `main`, il branch predefinito del
  repository. Il lavoro attuale avviene su un branch di sviluppo: il sito
  sarà pubblicato solo quando il lavoro arriverà su `main`.
