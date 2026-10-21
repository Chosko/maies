# Allenamento vocaboli

La schermata in cui Sara si allena sui vocaboli di tutte le lezioni. L'app
mostra una parola italiana e Sara ne scrive la traduzione inglese. L'app la
verifica da sola, accettando ogni traduzione prevista e senza badare a
maiuscole, spazi superflui, apostrofi tipografici e punteggiatura finale.
Poi mostra l'esito con le traduzioni corrette, e con "Avanti" si passa al
vocabolo successivo, scelto dalla ripetizione degli errori, finché Sara non
smette.

## Purpose

Serve la funzionalità "Allenamento vocaboli" e il flusso "Ripasso dei
vocaboli" di [product-design.md](../product-design.md). Diversamente dagli
esercizi di traduzione, qui l'esito non lo decide Sara: lo decide l'app
confrontando la risposta con le traduzioni del vocabolo. Questo documento
descrive quel confronto, la schermata e il ciclo di ogni vocabolo. I vocaboli
li fornisce il catalogo dei contenuti. Quale vocabolo proporre, e cosa
ricordare dell'esito, lo decide la sessione di ripasso.

## Scope and non-goals

In:

- La verifica della risposta e le regole di normalizzazione del testo.
- La schermata Vocaboli al posto del segnaposto dello scheletro.
- Il ciclo di ogni vocabolo: risposta, verifica, esito, vocabolo successivo.
- Il caso in cui non c'è materiale.

Fuori:

- **La correzione manuale dell'esito**, anche per un refuso: la verifica è
  automatica e un vocabolo sbagliato torna semplicemente più spesso.
- **Le varianti dedotte dall'app**, come articoli, il "to" dei verbi,
  plurali o sinonimi: vale solo ciò che il file della lezione elenca in
  `en`. Le varianti le aggiunge Claude scrivendo i vocaboli.
- **Il confronto approssimato** (tolleranza ai refusi, distanza fra
  stringhe).
- **Un secondo tentativo** sullo stesso vocabolo dopo un errore.
- **La direzione inglese → italiano.**
- **La scelta del vocabolo e il salvataggio dei progressi:** appartengono a
  [ripetizione-errori](./ripetizione-errori.md). Questa schermata li usa
  senza ridefinirli.
- **Il formato dei vocaboli:** è fissato da
  [aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md).
- **La lista completa dei vocaboli:** è del dizionario dei vocaboli.
- **Contatori, punteggi o statistiche della sessione**, filtri per lezione
  e il ritorno al vocabolo precedente.

## Architecture

Costruito sullo stack di [technical-direction.md](../technical-direction.md):
TypeScript, Vue 3 con Composition API e single-file components, Vitest con
Vue Test Utils. È una schermata della parte "Interfaccia" della topologia.

- **Verifica della risposta:** una funzione pura che, data la risposta di
  Sara e le traduzioni accettate di un vocabolo, dice se la risposta è
  giusta. Normalizza entrambe le parti allo stesso modo (vedi *Interfaces
  and contracts*). È l'unico punto in cui vive la regola di confronto.
- **Ciclo dell'allenamento:** logica senza interfaccia che guida un
  vocabolo per volta. Crea una sessione di ripasso di tipo "vocaboli", tiene
  il vocabolo corrente e la fase in cui si trova, usa la verifica alla
  conferma e registra l'esito nella sessione. Non dipende dal DOM, così i
  test ne verificano tutte le transizioni con una sessione dalla casualità e
  dall'archivio sostituiti.
- **Schermata Vocaboli:** il componente registrato sulla rotta `#/vocaboli`
  dello scheletro, che sostituisce il segnaposto. Mostra la fase corrente
  del ciclo e gli inoltra le azioni di Sara. Usa le variabili di stile e il
  layout responsivo dello scheletro.
  - **Domanda:** la parola italiana, un campo di testo per la traduzione e
    il pulsante "Conferma". Anche Invio nel campo conferma. Il campo riceve
    il fuoco a ogni nuovo vocabolo e non applica correzioni o maiuscole
    automatiche della tastiera.
  - **Esito:** se la risposta era giusta o sbagliata, la risposta scritta da
    Sara, la traduzione principale (la prima di `en`), le altre traduzioni
    accettate (se ci sono) e il titolo della lezione da cui viene il
    vocabolo, più il pulsante "Avanti". Anche Invio passa avanti. Il formato
    è lo stesso dopo una risposta giusta e dopo una sbagliata.
  - **Nessun materiale:** un messaggio che dice che non ci sono ancora
    vocaboli su cui allenarsi.

## Data and state

Nessun dato salvato da questa funzionalità: i progressi li salva la
sessione di ripasso.

In memoria, per la durata della schermata:

- la sessione di ripasso, creata a ogni ingresso nella schermata. Uscire e
  rientrare apre quindi una sessione nuova, con la finestra degli ultimi
  elementi proposti vuota;
- il vocabolo corrente, come lo restituisce la sessione (id globale, parola
  italiana, traduzioni accettate, id della lezione);
- il testo scritto da Sara e l'esito della verifica;
- la fase, una tra:
  - **in attesa di risposta**: Sara scrive;
  - **esito mostrato**: la risposta è stata verificata e l'esito registrato;
  - **nessun materiale**: la sessione non ha vocaboli da proporre.

Il titolo della lezione si ricava dal catalogo a partire dall'id della
lezione del vocabolo; non è uno stato a sé.

## Interfaces and contracts

### Verifica della risposta

- **verifica(risposta, traduzioni accettate)** → giusta | sbagliata. È
  giusta quando la risposta normalizzata coincide con almeno una traduzione
  normalizzata.
- La normalizzazione, applicata alla risposta e a ogni traduzione:
  - ignora le maiuscole;
  - toglie gli spazi iniziali e finali e riduce a uno gli spazi interni
    ripetuti;
  - tratta gli apostrofi tipografici (’ ‘ ʼ) come l'apostrofo semplice;
  - toglie la punteggiatura finale (punto, punto esclamativo, punto
    interrogativo, virgola, punto e virgola, due punti), e gli spazi che la
    precedono.
- Nient'altro si normalizza: articoli, accenti, trattini e parole in più o in
  meno contano.
- Una risposta che dopo la normalizzazione è vuota è sbagliata.

### Ciclo dell'allenamento

- **avvio:** crea la sessione di tipo "vocaboli" e chiede il prossimo
  elemento. Passa a "in attesa di risposta", oppure a "nessun materiale" se
  la sessione restituisce "nessuno".
- **conferma(testo):** solo da "in attesa di risposta". Verifica il testo,
  registra l'esito per l'id globale del vocabolo con la funzione "registra
  esito" della sessione e passa a "esito mostrato" conservando testo ed
  esito. Una risposta vuota è ammessa e vale sbagliata: serve quando Sara
  non sa la parola. In ogni altra fase non fa nulla, quindi un doppio tocco
  o un doppio Invio non registra due esiti.
- **avanti():** solo da "esito mostrato". Chiede il prossimo elemento e
  torna a "in attesa di risposta" con il campo vuoto. In ogni altra fase non
  fa nulla.

### Contratto con le altre funzionalità

- **Rotta:** occupa `#/vocaboli`, fissato da
  [scheletro-e-pubblicazione](./scheletro-e-pubblicazione.md). Non aggiunge
  sottorotte.
- **Sessione di ripasso:** usa "crea sessione", "prossimo elemento" e
  "registra esito" esattamente come li definisce
  [ripetizione-errori](./ripetizione-errori.md).
- **Catalogo:** legge dal vocabolo `it` ed `en`, e il titolo della lezione
  con la ricerca "una lezione per id" di
  [aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md).

### Contratto di errore

- **Nessun vocabolo nel catalogo:** la schermata mostra il messaggio di
  nessun materiale, senza errori.
- **Uscita a metà:** l'esito si registra alla conferma. Se Sara cambia
  schermata o chiude la pagina prima di confermare, per quel vocabolo non si
  registra nulla; se lo fa dopo, l'esito resta registrato.
- **Progressi non salvabili** (`localStorage` assente o pieno): li gestisce
  l'archivio della ripetizione degli errori, e l'allenamento funziona senza
  differenze visibili.
- **Lezione del vocabolo non trovata** (non dovrebbe accadere, perché il
  catalogo è coerente per costruzione): l'esito si mostra senza il titolo
  della lezione.

## Dependencies

- **[scheletro-e-pubblicazione](./scheletro-e-pubblicazione.md):** la rotta
  `#/vocaboli`, la barra di navigazione, lo stile di base e il progetto
  Vitest.
- **[aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md):** i campi
  dei vocaboli e il titolo della lezione dal catalogo dei contenuti.
- **[ripetizione-errori](./ripetizione-errori.md):** la sessione di ripasso,
  che sceglie il vocabolo successivo e salva gli esiti.

Nessuna dipendenza esterna oltre allo stack.
