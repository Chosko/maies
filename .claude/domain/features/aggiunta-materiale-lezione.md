# Aggiunta del materiale da una lezione

Il modo in cui maies riceve contenuti nuovi. Sara passa in chat un PDF, una
foto o un vocabolo. Claude ne ricava frasi da tradurre, vocaboli e schede di
grammatica e li scrive nel repository come file di lezione. L'app li legge
alla compilazione attraverso un catalogo di sola lettura. Questo documento
fissa il formato dei file di lezione e i loro identificatori stabili, il
catalogo, il test che valida i file e il procedimento che Claude segue per
scriverli. Tutte le altre funzionalità adottano formato e catalogo così come
sono definiti qui.

## Purpose

Serve la funzionalità "Aggiunta del materiale da una lezione" e il flusso
"Arriva una nuova lezione" di [product-design.md](../product-design.md).
L'app è un sito statico senza intelligenza artificiale, quindi tutto il
materiale di ripasso esiste solo come file scritti da Claude. Il formato di
questi file è il contratto comune di esercizi, vocaboli, dizionario e
grammatica. I suoi identificatori sono la chiave con cui la ripetizione
degli errori ricorda i progressi: se cambiano, i progressi si perdono.

## Scope and non-goals

In:

- Il formato dei file di lezione e le regole dei loro identificatori.
- Il catalogo dei contenuti: caricamento alla compilazione e accesso in sola
  lettura per le altre funzionalità.
- Lo schema dei file e il test che li valida e blocca la pubblicazione di un
  file malformato.
- Il procedimento di Claude per una lezione da PDF o foto, per un vocabolo
  singolo e per la correzione di un elemento.
- Una skill del progetto che esegue quel procedimento quando una sessione
  riceve materiale in chat.

Fuori:

- **Le schermate.** Mostrare frasi, vocaboli e schede spetta alle
  funzionalità che le usano, compresa la conversione del Markdown in HTML,
  che fa parte delle schede di grammatica.
- **Il controllo delle risposte** (maiuscole, spazi, traduzioni accettate):
  è dell'allenamento vocaboli.
- **I progressi e la scelta del prossimo elemento:** sono della ripetizione
  degli errori, che usa gli identificatori definiti qui.
- **Generazione dei contenuti dall'app** e qualunque chiave API: il
  materiale lo scrive Claude nel repository.
- **I PDF e le foto originali:** non entrano mai nel repository, che è
  pubblico.
- **Un editor dei contenuti nell'app**, l'importazione da altri formati, le
  date delle lezioni e i livelli di difficoltà.
- **Vocaboli inglese → italiano:** la direzione è solo italiano → inglese.

## Architecture

Costruito sullo stack di [technical-direction.md](../technical-direction.md):
TypeScript, Vite e Vitest. È la parte "Contenuti" della sua topologia.

- **File di lezione:** un file JSON per lezione, in una cartella per
  edizione del sito: `contenuti/lezioni/` per la principale e
  `contenuti/kids/` per quella kids, le cui lezioni hanno solo vocaboli
  (frasi e schede vuote, nello stesso formato). È l'unica fonte del
  materiale e lo scrive solo Claude.
- **Schema dei contenuti:** una definizione zod della lezione e dei suoi
  elementi. Da questa sola definizione derivano i tipi TypeScript usati
  dall'app e la validazione usata nel test, quindi tipi e schema non possono
  divergere. zod si usa solo in sviluppo: l'app ne importa soltanto i tipi.
- **Catalogo dei contenuti:** carica tutti i file di lezione della
  cartella dell'edizione alla compilazione, con l'importazione statica di Vite, e li espone in sola
  lettura con gli identificatori globali già calcolati. Le altre
  funzionalità leggono i contenuti solo da qui, mai dai file.
- **Test di validità dei contenuti:** una suite Vitest che passa ogni file
  di ciascuna cartella allo schema e poi controlla i vincoli tra file (vedi
  *Interfaces and contracts*). Gira nella pipeline di pubblicazione di
  [scheletro-e-pubblicazione](./scheletro-e-pubblicazione.md): se fallisce,
  il sito non si pubblica.
- **Skill di aggiunta del materiale:** una skill del progetto sotto
  `.claude/skills/` che una sessione di Claude usa quando Sara passa in
  chat un PDF, una foto, un vocabolo o una lista di vocaboli per i kids. Esegue il procedimento descritto in
  *Procedimento di Claude*: questo documento ne fissa il comportamento e la
  skill ne è l'esecuzione.

## Data and state

### La lezione

Ogni file contiene una lezione, con queste chiavi:

- `id`: l'identificatore della lezione, nella forma `NN-argomento`. `NN` è
  il numero progressivo d'arrivo, a due cifre e con lo zero iniziale;
  `argomento` è in kebab-case (per esempio `03-present-continuous`). Coincide
  con il nome del file senza estensione. Il numero dà l'ordine delle lezioni.
- `title`: il titolo leggibile della lezione, in italiano.
- `sentences`: le frasi da tradurre. Ogni frase ha:
  - `id`;
  - `it`, la frase italiana;
  - `en`, la traduzione inglese corretta;
  - `alternatives`, le altre traduzioni accettabili (eventualmente vuoto).
- `vocabulary`: i vocaboli. Ogni vocabolo ha:
  - `id`;
  - `it`, la parola o espressione italiana; un significato ambiguo si
    distingue fra parentesi, per esempio "pesca (frutto)";
  - `en`, le traduzioni inglesi accettate. Ce n'è almeno una e la prima è
    quella mostrata come risposta.
- `grammar`: le schede di grammatica. Ogni scheda ha:
  - `id`;
  - `title`, il titolo dell'argomento;
  - `body`, il testo in Markdown standard, senza HTML né immagini.

Le tre liste possono essere vuote, ma una lezione ne ha almeno una non
vuota. Tutti i testi sono non vuoti e senza spazi iniziali o finali.

### Identificatori

- **Id dell'elemento:** progressivo per tipo dentro la lezione, a due cifre:
  `f01`, `f02`, … per le frasi, `v01`, … per i vocaboli e `g01`, … per le
  schede. Il nuovo elemento prende il numero successivo al più alto del suo
  tipo nella lezione.
- **Id globale:** `<id-lezione>/<id-elemento>`, per esempio
  `03-present-continuous/v07`. È l'unica chiave con cui le altre funzionalità
  si riferiscono a un elemento. La ripetizione degli errori indicizza i
  progressi su questo id.
- **Stabilità:**
  - Correggere un elemento (un refuso, una variante in più) ne conserva l'id.
  - Un id non si rinumera né si riusa, e una lezione non si rinomina.
  - Un elemento si elimina solo quando è sbagliato senza rimedio. I progressi
    legati al suo id restano orfani e la ripetizione li ignora.

### Stato

Nessuno stato a tempo di esecuzione: i contenuti sono inclusi nel sito alla
compilazione e sono immutabili per l'app. L'unica fonte è il repository.

## Interfaces and contracts

### Catalogo dei contenuti

Il catalogo espone, tutto in sola lettura:

- **le lezioni**, in ordine di id, ognuna con id, titolo e i propri
  elementi;
- **una lezione per id**, oppure nessuna se l'id non esiste;
- **tutte le frasi** di tutte le lezioni, ognuna con il proprio id globale e
  l'id della lezione;
- **tutti i vocaboli** di tutte le lezioni, con gli stessi dati delle frasi;
- **la ricerca di una frase o di un vocabolo per id globale**: un id
  sconosciuto, per esempio quello di un elemento eliminato, dà "nessuno", non
  un errore.

Con zero lezioni il catalogo restituisce liste vuote, e le schermate
mostrano che non c'è ancora materiale.

### Test di validità

Controlla ogni cartella per conto suo: i vincoli tra file valgono dentro
una cartella, mai tra le due. Fallisce, nominando il file e l'elemento
colpevoli, quando:

- un file non rispetta lo schema;
- il nome del file non coincide con l'`id` della lezione, o l'id non ha la
  forma `NN-argomento`;
- due lezioni hanno lo stesso numero `NN`;
- un id di elemento non ha la forma del suo tipo o si ripete nella lezione;
- la stessa frase italiana o lo stesso vocabolo italiano compare due volte,
  anche in lezioni diverse. Per il confronto si ignorano le maiuscole, gli
  spazi superflui e la punteggiatura finale.
- la traduzione `en` di una frase compare anche fra le sue `alternatives`,
  o un vocabolo ripete una traduzione;
- nella cartella c'è un file che non è JSON, perché un PDF o una foto non
  devono entrare per sbaglio.

La cartella vuota è valida.

### Procedimento di Claude

Lo esegue la skill di aggiunta del materiale.

**Una lezione da PDF o foto:**

1. Leggere il materiale. Prima di scrivere, chiedere a Sara in chat le
   parti illeggibili o incerte.
2. Leggere tutte le lezioni esistenti e assegnare alla nuova il numero
   successivo al più alto e un argomento in kebab-case.
3. Ricavare i vocaboli: tutti quelli che il materiale presenta. Se un
   vocabolo esiste già in una lezione precedente, non si duplica; le sue
   eventuali traduzioni nuove si aggiungono al vocabolo esistente, nella sua
   lezione.
4. Ricavare le schede: una per ogni argomento di grammatica trattato.
   L'argomento di una lezione precedente ha una scheda nuova solo se questa
   lezione aggiunge qualcosa, e la scheda tratta solo la parte nuova.
5. Scrivere fra 10 e 20 frasi da tradurre, in proporzione a quanta
   grammatica e quanti vocaboli contiene la lezione. Sono frasi italiane
   originali che esercitano la grammatica e i vocaboli della lezione, mai
   uguali a frasi già esistenti. Ognuna ha la traduzione corretta e le
   varianti accettabili (forme contratte e non contratte, sinonimi
   equivalenti, ordini alternativi ammessi).
6. Scrivere il file, eseguire il test di validità e correggere finché passa.
7. Fare commit del solo file di lezione, più le eventuali lezioni precedenti
   arricchite al passo 3. L'originale non si salva mai nel repository: se è
   arrivato come file nella cartella di lavoro, si lascia fuori dal commit.

**Una lista di vocaboli per i kids** (una foto o un elenco che Sara indica
come per i kids): una lezione nuova in `contenuti/kids/` con i soli
vocaboli, secondo i passi 1–3 e 6–7 qui sopra applicati a quella cartella.
Numeri, duplicati e lezione più recente si cercano solo lì.

**Un vocabolo singolo passato in chat:**

1. Se il vocabolo esiste già, si aggiungono solo le traduzioni nuove.
2. Altrimenti va nella lezione che Sara indica; se non ne indica nessuna,
   nell'ultima lezione arrivata. Prende il numero successivo dei vocaboli di
   quella lezione.
3. Test e commit come sopra.

**Una correzione** (un refuso, una variante mancante) modifica l'elemento
mantenendone l'id.

### Contratto di errore

Un file malformato non arriva mai nell'app: il test fallisce e la
pubblicazione si ferma, lasciando online la versione precedente. Per questo
il catalogo non valida i file a tempo di esecuzione.

## Dependencies

- **[scheletro-e-pubblicazione](./scheletro-e-pubblicazione.md):** fornisce
  il progetto, Vitest e la pipeline che esegue il test di validità prima di
  pubblicare.
- **Usata da:** esercizi di traduzione, allenamento vocaboli, dizionario e
  schede di grammatica, che leggono dal catalogo, e ripetizione degli
  errori, che indicizza i progressi sugli id globali.

Dipendenze esterne:

- **zod** (solo sviluppo): una sola definizione per i tipi TypeScript e la
  validazione dei file di lezione.
