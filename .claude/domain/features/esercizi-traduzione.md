# Esercizi di traduzione

La schermata in cui Sara si esercita a tradurre in inglese frasi italiane
prese da tutte le lezioni. Scrive la sua traduzione e la conferma, poi vede
la traduzione corretta con le varianti accettabili e segna da sola se la sua
risposta era giusta o sbagliata; nella stessa schermata può dare alla frase
un'importanza da 0 a 3, dove 0 la toglie dagli esercizi. Subito dopo arriva
la frase successiva, scelta dalla ripetizione degli errori, finché Sara non
smette.

## Purpose

Serve la funzionalità "Esercizi di traduzione" e il flusso "Ripasso con gli
esercizi" di [product-design.md](../product-design.md). Il design prevede un
solo tipo di esercizio, la traduzione dall'italiano all'inglese, corretto
dalla stessa Sara: niente controllo automatico e niente spiegazione
dell'errore. Questo documento descrive la schermata e il ciclo di ogni
frase. Le frasi le fornisce il catalogo dei contenuti. Quale frase proporre,
e cosa ricordare dell'esito, lo decide la sessione di ripasso.

## Scope and non-goals

In:

- La schermata Esercizi al posto del segnaposto dello scheletro.
- Il ciclo di ogni frase: risposta, soluzione, autovalutazione, frase
  successiva.
- La scelta dell'importanza della frase nella soluzione, con la conferma
  prima di toglierla.
- Il caso in cui non c'è materiale e quello in cui tutte le frasi sono state
  tolte.

Fuori:

- **Il confronto automatico** della risposta con le traduzioni previste, sia
  per decidere l'esito sia solo per segnalarlo: l'esito lo decide sempre Sara.
- **La scelta della frase, il salvataggio dei progressi e l'effetto
  dell'importanza:** appartengono a
  [ripetizione-errori](./ripetizione-errori.md). Questa schermata li usa
  senza ridefinirli.
- **Il recupero di una frase tolta** e la scelta dell'importanza fuori dalla
  soluzione.
- **Il formato delle frasi:** è fissato da
  [aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md).
- **La spiegazione dell'errore**, come stabilito nel design del prodotto.
- **Contatori, punteggi o statistiche della sessione.**
- **La modifica di un esito già dato** e il ritorno alla frase precedente.
- **I filtri per lezione:** le frasi arrivano mescolate tra tutte le lezioni.
- **Altri tipi di esercizio**, compresa la direzione inglese → italiano.

## Architecture

Costruito sullo stack di [technical-direction.md](../technical-direction.md):
TypeScript, Vue 3 con Composition API e single-file components, Vitest con
Vue Test Utils. È una schermata della parte "Interfaccia" della topologia.

- **Ciclo dell'esercizio:** logica senza interfaccia che guida una frase per
  volta. Crea una sessione di ripasso di tipo "frasi", tiene la frase
  corrente e la fase in cui si trova (vedi *Data and state*) e sa passare da
  una fase all'altra. Non dipende dal DOM, così i test ne verificano tutte le
  transizioni con una sessione dalla casualità e dall'archivio sostituiti.
- **Schermata Esercizi:** il componente registrato sulla rotta
  `#/esercizi` dello scheletro, che sostituisce il segnaposto. Mostra la fase
  corrente del ciclo e gli inoltra le azioni di Sara. Usa le variabili di
  stile e il layout responsivo dello scheletro.
  - **Domanda:** la frase italiana, un campo di testo per la traduzione e il
    pulsante "Conferma". Anche Invio nel campo conferma. Il campo riceve il
    fuoco a ogni nuova frase.
  - **Soluzione:** la risposta scritta da Sara, la traduzione corretta, le
    varianti accettabili (se ci sono) e il titolo della lezione da cui viene
    la frase, più i pulsanti "Giusta" e "Sbagliata". Sotto, in una riga
    secondaria ben separata da quei pulsanti, i pulsanti dell'importanza 0,
    1, 2 e 3, con il valore attuale della frase selezionato. Toccare 1, 2 o
    3 cambia subito il valore selezionato; toccare 0 apre la conferma.
  - **Conferma della rimozione:** un messaggio dentro la pagina, non il
    popup nativo del browser, che chiede se togliere la frase dagli esercizi,
    con "Togli" e "Annulla". Mentre è aperta, i pulsanti dell'importanza sono
    disabilitati: si può solo rispondere.
  - **Nessun materiale:** un messaggio che dice che non ci sono ancora frasi
    da tradurre.
  - **Tutti tolti:** un messaggio che dice che tutte le frasi sono state
    tolte dagli esercizi ("Hai tolto tutte le frasi dagli esercizi"), nella
    forma del messaggio senza materiale.
  - **Aspetto:** segue `design/schermate/EserciziDomanda.dc.html` (domanda),
    `EserciziVuoto.dc.html` (nessun materiale) ed `EserciziComputer.dc.html`
    (soluzione, su computer). La soluzione su telefono non ha una tavola
    propria: tiene la carta e i margini della domanda, con il contenuto e i
    due pulsanti della soluzione su computer impilati come in
    `VocaboliGiusta.dc.html`. La riga dell'importanza e la conferma della
    rimozione non hanno una tavola: seguono le variabili di stile e i
    pulsanti esistenti, con la riga visivamente secondaria rispetto a
    "Giusta" e "Sbagliata".

## Data and state

Nessun dato salvato da questa funzionalità: i progressi li salva la
sessione di ripasso.

In memoria, per la durata della schermata:

- la sessione di ripasso, creata a ogni ingresso nella schermata. Uscire e
  rientrare apre quindi una sessione nuova, con la finestra degli ultimi
  elementi proposti vuota;
- la frase corrente, come la restituisce la sessione (id globale, frase
  italiana, traduzione corretta, varianti, id della lezione, importanza);
- il testo scritto da Sara;
- l'importanza attuale della frase, aggiornata a ogni scelta;
- se la conferma della rimozione è aperta;
- la fase, una tra:
  - **in attesa di risposta**: Sara scrive;
  - **soluzione mostrata**: Sara ha confermato e deve segnare l'esito;
  - **nessun materiale**: il catalogo non ha frasi;
  - **tutti tolti**: tutte le frasi hanno importanza 0.

Il titolo della lezione si ricava dal catalogo a partire dall'id della
lezione della frase; non è uno stato a sé.

## Interfaces and contracts

### Ciclo dell'esercizio

- **avvio:** crea la sessione di tipo "frasi" e chiede il prossimo
  elemento. Passa a "in attesa di risposta", oppure a "nessun materiale" o a
  "tutti tolti" secondo il caso vuoto che restituisce la sessione.
- **conferma(testo):** da "in attesa di risposta" passa a "soluzione
  mostrata" conservando il testo. Una risposta vuota è ammessa: serve
  quando Sara non sa la frase. In ogni altra fase non fa nulla.
- **segna(giusta | sbagliata):** solo da "soluzione mostrata". Registra
  l'esito per l'id globale della frase con la funzione "registra esito"
  della sessione, poi chiede il prossimo elemento e torna a "in attesa di
  risposta" con il campo vuoto. In ogni altra fase, o con la conferma della
  rimozione aperta, non fa nulla, quindi un doppio tocco non registra due
  esiti.
- **imposta importanza(1 | 2 | 3):** solo da "soluzione mostrata" con la
  conferma della rimozione chiusa. Registra
  l'importanza con la funzione "registra importanza" della sessione e
  aggiorna il valore selezionato. Non registra esiti e non cambia fase.
- **chiedi rimozione():** solo da "soluzione mostrata" con la conferma
  chiusa. Apre la conferma.
- **annulla rimozione():** chiude la conferma; nulla cambia.
- **conferma rimozione():** solo con la conferma aperta. Registra
  l'importanza 0 per la frase, senza registrare un esito, poi chiede il
  prossimo elemento come dopo "segna": "in attesa di risposta", oppure il
  caso vuoto restituito dalla sessione.

### Contratto con le altre funzionalità

- **Rotta:** occupa `#/esercizi`, che resta l'indirizzo predefinito
  dell'app come fissato da
  [scheletro-e-pubblicazione](./scheletro-e-pubblicazione.md). Non aggiunge
  sottorotte.
- **Sessione di ripasso:** usa "crea sessione", "prossimo elemento",
  "registra esito" e "registra importanza" esattamente come li definisce
  [ripetizione-errori](./ripetizione-errori.md).
- **Catalogo:** legge dalla frase `it`, `en` e `alternatives`, e il titolo
  della lezione con la ricerca "una lezione per id" di
  [aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md).

### Contratto di errore

- **Nessuna frase nel catalogo:** la schermata mostra il messaggio di
  nessun materiale, senza errori.
- **Tutte le frasi tolte:** la schermata mostra il messaggio "tutti tolti",
  senza errori e senza modo di recuperarle.
- **Uscita a metà:** l'esito si registra solo quando Sara segna "Giusta" o
  "Sbagliata". Se cambia schermata o chiude la pagina prima, per quella
  frase non si registra nessun esito; un'importanza già scelta resta
  registrata, e una rimozione non confermata non avviene.
- **Progressi non salvabili** (`localStorage` assente o pieno): li gestisce
  l'archivio della ripetizione degli errori, e l'esercizio funziona senza
  differenze visibili.
- **Lezione della frase non trovata** (non dovrebbe accadere, perché il
  catalogo è coerente per costruzione): la soluzione si mostra senza il
  titolo della lezione.

## Dependencies

- **[scheletro-e-pubblicazione](./scheletro-e-pubblicazione.md):** la rotta
  `#/esercizi`, la barra di navigazione, lo stile di base e il progetto
  Vitest.
- **[aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md):** i campi
  delle frasi e il titolo della lezione dal catalogo dei contenuti.
- **[ripetizione-errori](./ripetizione-errori.md):** la sessione di ripasso,
  che sceglie la frase successiva e salva esiti e importanza.

Nessuna dipendenza esterna oltre allo stack.
