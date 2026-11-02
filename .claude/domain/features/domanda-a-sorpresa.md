# Domanda a sorpresa

Tre volte al giorno una notifica sul telefono di Sara le chiede come si dice
in inglese un vocabolo italiano: "Come si dice «cane»?". La manda una GitHub
Action pianificata, che sceglie il vocabolo dai file delle lezioni
dell'edizione principale e lo pubblica su un canale di ntfy.sh; Sara la
riceve con l'app ntfy. Toccando la notifica si apre l'allenamento vocaboli
con quella parola come prima domanda.

## Purpose

Serve la funzionalità "Domanda a sorpresa", il flusso omonimo e la
decisione "Domande a sorpresa sul telefono, solo per Sara" di
[product-design.md](../product-design.md). Il sito è statico e non può
mandare notifiche a pagina chiusa: la domanda parte quindi dal repository,
secondo il lavoro pianificato descritto in
[technical-direction.md](../technical-direction.md) § Async / queueing.

## Scope and non-goals

In:

- La scelta del vocabolo della domanda e il testo della notifica.
- Lo script che pubblica la notifica su ntfy.sh.
- La GitHub Action pianificata che lo esegue tre volte al giorno.
- Le istruzioni per attivare le notifiche: il segreto del repository e
  l'iscrizione nell'app ntfy.

Fuori:

- **L'apertura dell'allenamento sulla parola della notifica:** è
  dell'[allenamento vocaboli](./allenamento-vocaboli.md), che riceve l'id
  della parola nell'indirizzo.
- **La scelta del vocabolo in base ai progressi:** i progressi restano nel
  browser e l'automazione non li vede.
- **Notifiche per l'edizione kids**, risposte direttamente dalla notifica,
  orari scelti da Sara e notifiche web o push del sito.
- **Un servizio di notifiche proprio:** si usa il server pubblico ntfy.sh.

## Architecture

Costruito sullo stack di [technical-direction.md](../technical-direction.md):
TypeScript o JavaScript eseguito da Node nella GitHub Action, Vitest per i
test, nessuna dipendenza nuova.

- **Scelta della domanda:** una funzione pura che, dati i vocaboli
  dell'edizione principale con la loro lezione e una sorgente di casualità,
  sceglie il vocabolo e compone la notifica (vedi *Interfaces and
  contracts*). È l'unico punto in cui vivono la regola di scelta e il testo.
- **Script di invio:** legge i file di lezione di `contenuti/lezioni/`,
  chiede alla scelta la notifica e la pubblica con una richiesta HTTP a
  `https://ntfy.sh/<canale>`, con il canale preso da una variabile
  d'ambiente. Non usa il catalogo dell'app, che dipende dall'importazione di
  Vite, ma gli stessi file e lo stesso calcolo dell'id globale.
- **GitHub Action pianificata:** un workflow separato da quello di
  pubblicazione, eseguito a orari fissi e anche a mano, che installa le
  dipendenze ed esegue lo script con il segreto del canale. Il repository
  ne tiene il modello in `scripts/domanda-a-sorpresa.workflow.yml`, perché
  il collegamento di Claude a GitHub non può scrivere in
  `.github/workflows/`: il file attivo
  `.github/workflows/domanda-a-sorpresa.yml` lo crea a mano una persona,
  copiando il modello. Il test verifica il modello.

## Data and state

- **Canale:** il nome del canale ntfy è il segreto del repository
  `NTFY_TOPIC`, una stringa lunga e casuale. Non compare mai nel
  repository né nei log.
- **Orari:** tre domande al giorno. Le prime due alle 09:17 e 13:47 UTC
  (10:17 e 14:47 d'inverno, 11:17 e 15:47 d'estate). La terza sempre alle
  21:30 italiane: GitHub pianifica solo in UTC, quindi il workflow parte
  alle 19:30 e alle 20:30 UTC e solo l'esecuzione che cade alle 21 in Italia
  invia. GitHub può ritardare un'esecuzione pianificata di qualche minuto.
- Nessuno stato fra un'esecuzione e l'altra: ogni domanda è indipendente, e
  la stessa parola può tornare.

## Interfaces and contracts

### Scelta della domanda

- **Peso:** i vocaboli delle tre lezioni più recenti (numero di lezione più
  alto) pesano 3, gli altri 1; dentro lo stesso peso la scelta è uniforme.
  Con meno di tre lezioni pesano tutte 3.
- **Notifica:**
  - titolo `maies`;
  - testo `Come si dice «<it>»?`, con la parola italiana del vocabolo così
    com'è scritta, comprese le parentesi che ne distinguono il significato;
  - indirizzo da aprire al tocco
    `https://maies.chosko.com/#/vocaboli?parola=<id globale>`, con l'id
    codificato per un indirizzo;
  - come icona il logo di maies, il PNG `maies-icona-512.png` pubblicato
    dal sito (ntfy accetta solo icone PNG o JPEG).
- Senza vocaboli non c'è notifica.

### Script di invio

- Pubblica la notifica con una sola richiesta e termina con errore se
  ntfy.sh risponde con un errore o non risponde.
- Senza la variabile del canale, o senza vocaboli, non pubblica nulla e
  termina senza errore, scrivendo il motivo nel log, così un repository non
  ancora configurato non segnala fallimenti.
- Con la variabile `SOLO_ALLE` (un'ora 0–23) pubblica solo se in Italia
  (fuso `Europe/Rome`) è quell'ora; altrimenti termina senza errore,
  scrivendo il motivo.
- Non scrive mai il nome del canale nel log.

### GitHub Action

- Eseguita agli orari di *Data and state* e su richiesta manuale.
- Non pubblica il sito e non scrive nel repository: permessi di sola
  lettura.
- Gira solo sul branch principale, come ogni workflow pianificato di
  GitHub.

### Attivazione

Tre passi manuali, una volta sola, dopo che il modello è sul branch
principale:

1. Creare sul branch principale, dalla pagina web del repository, il file
   `.github/workflows/domanda-a-sorpresa.yml` con il contenuto del modello.
   Lo stesso vale per ogni modifica successiva del modello.
2. Creare il segreto `NTFY_TOPIC` nelle impostazioni del repository, con un
   nome di canale lungo e casuale.
3. Sul telefono di Sara, installare l'app ntfy e iscriversi a quel canale
   sul server `ntfy.sh`.

Un'esecuzione manuale della GitHub Action verifica che la notifica arrivi.

### Contratto di errore

- **ntfy.sh non raggiungibile o in errore:** l'esecuzione fallisce e GitHub
  la segnala; la domanda di quell'orario si perde, le successive partono
  normalmente.
- **Parola tolta o eliminata dopo l'invio:** la gestisce l'allenamento
  vocaboli, che parte come al solito.

## Dependencies

- **[aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md):** il
  formato dei file di lezione e la forma dell'id globale.
- **[allenamento-vocaboli](./allenamento-vocaboli.md):** l'indirizzo
  `#/vocaboli?parola=<id globale>`, che apre l'allenamento su quella
  parola.
- **[scheletro-e-pubblicazione](./scheletro-e-pubblicazione.md):** il
  progetto Vitest e il dominio del sito.

Dipendenze esterne: **ntfy.sh** (servizio pubblico gratuito) e l'app
**ntfy** sul telefono di Sara.

## Open questions

Nessuna.
