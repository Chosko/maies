# Allenamento vocaboli

La schermata in cui Sara si allena sui vocaboli di tutte le lezioni. L'app
mostra una parola italiana e Sara ne scrive la traduzione inglese. L'app la
verifica da sola, accettando ogni traduzione prevista e senza badare a
maiuscole, spazi superflui, apostrofi tipografici e punteggiatura finale.
Poi mostra l'esito con le traduzioni corrette, la frase d'esempio,
l'eventuale trucco per ricordare la parola e i pulsanti per ascoltarne la
pronuncia. Dopo una risposta sbagliata Sara riscrive la traduzione corretta
prima di poter andare avanti. Nell'esito può dare al vocabolo un'importanza
da 0 a 3 (0 lo toglie dall'allenamento), e con "Avanti" si passa al
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
- L'apertura dell'allenamento su una parola indicata nell'indirizzo, usata
  dalla [domanda a sorpresa](./domanda-a-sorpresa.md).
- Il ciclo di ogni vocabolo: risposta, verifica, riscrittura dopo un errore,
  esito, vocabolo successivo.
- La frase d'esempio e il trucco per ricordare nell'esito.
- La pronuncia inglese letta dal browser.
- La scelta dell'importanza del vocabolo nell'esito, con la conferma prima
  di toglierlo, nella sola edizione principale.
- Il caso in cui non c'è materiale e quello in cui tutti i vocaboli sono
  stati tolti.

Fuori:

- **La correzione manuale dell'esito**, anche per un refuso: la verifica è
  automatica e un vocabolo sbagliato torna semplicemente più spesso.
- **Le varianti dedotte dall'app**, come articoli, il "to" dei verbi,
  plurali o sinonimi: vale solo ciò che il file della lezione elenca in
  `en`. Le varianti le aggiunge Claude scrivendo i vocaboli.
- **Il confronto approssimato** (tolleranza ai refusi, distanza fra
  stringhe).
- **Un secondo tentativo che cambi l'esito:** la riscrittura dopo un
  errore è un esercizio di memoria e l'esito resta sbagliato.
- **Registrazioni audio** o voci scaricate: la pronuncia è quella della
  sintesi vocale del browser.
- **La pronuncia e la frase d'esempio nel dizionario.**
- **La direzione inglese → italiano.**
- **La scelta del vocabolo, il salvataggio dei progressi e l'effetto
  dell'importanza:** appartengono a
  [ripetizione-errori](./ripetizione-errori.md). Questa schermata li usa
  senza ridefinirli.
- **L'importanza nell'edizione kids:** lì la riga dell'importanza non
  compare e ogni vocabolo resta a importanza 2.
- **Il recupero di un vocabolo tolto**, anche dal dizionario: resta
  un'idea per il futuro.
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
    accettate (se ci sono), la frase d'esempio, il trucco per ricordare (se
    c'è) e il titolo della lezione da cui viene il vocabolo, più il pulsante
    "Avanti". Accanto alla traduzione principale e alla frase d'esempio c'è
    un pulsante per ascoltarle. Anche Invio passa avanti. Il formato è lo
    stesso dopo una risposta giusta e dopo una sbagliata, salvo la
    riscrittura. Nell'edizione
    principale, sotto, in una riga secondaria ben separata da "Avanti", i
    pulsanti dell'importanza 0, 1, 2 e 3, con il valore attuale del vocabolo
    selezionato. Toccare 1, 2 o 3 cambia subito il valore selezionato;
    toccare 0 apre la conferma.
  - **Riscrittura:** dopo una risposta sbagliata, sotto le traduzioni
    corrette, un campo che chiede di riscrivere la traduzione e il pulsante
    "Controlla" al posto di "Avanti"; anche Invio controlla. Il campo riceve
    il fuoco. Una riscrittura che non passa la verifica lascia il campo con
    un breve messaggio di riprovare; quando passa, il campo lascia il posto
    ad "Avanti". La riga dell'importanza resta disponibile.
  - **Conferma della rimozione:** un messaggio dentro la pagina, non il
    popup nativo del browser, che chiede se togliere il vocabolo
    dall'allenamento, con "Togli" e "Annulla". Mentre è aperta, i pulsanti
    dell'importanza sono disabilitati: si può solo rispondere.
  - **Nessun materiale:** un messaggio che dice che non ci sono ancora
    vocaboli su cui allenarsi.
  - **Tutti tolti:** un messaggio che dice che tutti i vocaboli sono stati
    tolti dall'allenamento ("Hai tolto tutti i vocaboli dall'allenamento"),
    nella forma del messaggio senza materiale.
  - **Aspetto:** segue `design/schermate/VocaboliDomanda.dc.html`,
    `VocaboliGiusta.dc.html` e `VocaboliSbagliata.dc.html`; il messaggio
    senza materiale e quello dei vocaboli tolti hanno la forma di
    `EserciziVuoto.dc.html`. La riga dell'importanza e la conferma della
    rimozione non hanno una tavola: sono le stesse degli esercizi di
    traduzione, con la riga visivamente secondaria rispetto ad "Avanti".
    Frase d'esempio, trucco, pulsanti della pronuncia e riscrittura non
    hanno una tavola: seguono le variabili di stile e i componenti
    esistenti, con la frase d'esempio e il trucco in un testo secondario
    rispetto alle traduzioni.
- **Pronuncia:** un piccolo modulo che legge un testo inglese con la
  sintesi vocale del browser, preferendo una voce inglese britannica e
  altrimenti una qualunque voce inglese, e dice se la lettura è disponibile.
  Una nuova lettura interrompe quella in corso. È sostituibile nei test.

## Data and state

Nessun dato salvato da questa funzionalità: i progressi li salva la
sessione di ripasso.

In memoria, per la durata della schermata:

- la sessione di ripasso, creata a ogni ingresso nella schermata. Uscire e
  rientrare apre quindi una sessione nuova, con la finestra degli ultimi
  elementi proposti vuota;
- il vocabolo corrente, come lo restituisce la sessione (id globale, parola
  italiana, traduzioni accettate, id della lezione, importanza);
- il testo scritto da Sara e l'esito della verifica;
- il testo della riscrittura e se l'ultima riscrittura è stata respinta;
- l'importanza attuale del vocabolo, aggiornata a ogni scelta;
- se la conferma della rimozione è aperta;
- la fase, una tra:
  - **in attesa di risposta**: Sara scrive;
  - **riscrittura**: la risposta era sbagliata, l'esito è registrato e
    Sara deve riscrivere la traduzione;
  - **esito mostrato**: la risposta è stata verificata e l'esito registrato,
    e dopo un errore la riscrittura è passata;
  - **nessun materiale**: il catalogo non ha vocaboli;
  - **tutti tolti**: tutti i vocaboli hanno importanza 0.

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

- **avvio(parola iniziale?):** crea la sessione di tipo "vocaboli". Con
  una parola iniziale, chiede alla sessione quell'elemento con "elemento per
  id" e, se c'è, passa a "in attesa di risposta" su di esso; altrimenti, o
  senza parola iniziale, chiede il prossimo elemento e passa a "in attesa di
  risposta", oppure a "nessun materiale" o a "tutti tolti" secondo il caso
  vuoto che restituisce la sessione. Dopo la parola iniziale il ciclo
  continua come sempre.
- **conferma(testo):** solo da "in attesa di risposta". Verifica il testo,
  registra l'esito per l'id globale del vocabolo con la funzione "registra
  esito" della sessione e passa a "esito mostrato" se era giusta, a
  "riscrittura" se era sbagliata, conservando testo ed esito. Una risposta
  vuota è ammessa e vale sbagliata: serve quando Sara non sa la parola. In
  ogni altra fase non fa nulla, quindi un doppio tocco o un doppio Invio non
  registra due esiti.
- **riscrivi(testo):** solo da "riscrittura" con la conferma della
  rimozione chiusa. Verifica il testo con la stessa regola della risposta:
  se passa, va a "esito mostrato"; altrimenti resta in "riscrittura" e
  segna la riscrittura come respinta. Non registra esiti.
- **avanti():** solo da "esito mostrato" con la conferma della rimozione
  chiusa. Chiede il prossimo elemento e torna a "in attesa di risposta" con
  il campo vuoto, oppure al caso vuoto restituito dalla sessione. In ogni
  altra fase non fa nulla.
- **imposta importanza(1 | 2 | 3):** solo da "esito mostrato" o da
  "riscrittura", con la conferma della rimozione chiusa. Registra
  l'importanza con la funzione "registra importanza" della sessione e
  aggiorna il valore selezionato. Non cambia fase.
- **chiedi rimozione():** solo da "esito mostrato" o da "riscrittura", con
  la conferma chiusa. Apre la conferma.
- **annulla rimozione():** chiude la conferma; nulla cambia.
- **conferma rimozione():** solo con la conferma aperta. Registra
  l'importanza 0 per il vocabolo e passa al prossimo elemento come
  "avanti", anche da "riscrittura". L'esito della risposta, già registrato
  alla conferma, resta salvato.

### Contratto con le altre funzionalità

- **Rotta:** occupa `#/vocaboli`, fissato da
  [scheletro-e-pubblicazione](./scheletro-e-pubblicazione.md). Non aggiunge
  sottorotte. Il parametro `parola` dell'indirizzo
  (`#/vocaboli?parola=<id globale>`) è la parola iniziale dell'avvio: la
  schermata lo legge una volta all'ingresso e poi lo toglie dall'indirizzo
  senza aggiungere una voce alla cronologia, così ricaricare la pagina non
  ripropone la stessa parola. Vale in entrambe le edizioni.
- **Sessione di ripasso:** usa "crea sessione", "prossimo elemento",
  "elemento per id", "registra esito" e "registra importanza" esattamente
  come li definisce
  [ripetizione-errori](./ripetizione-errori.md).
- **Catalogo:** legge dal vocabolo `it`, `en`, `example` e `mnemonic`, e il
  titolo della lezione
  con la ricerca "una lezione per id" di
  [aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md).
- **Edizione:** mostra la riga dell'importanza solo quando l'edizione
  stabilita dallo [scheletro](./scheletro-e-pubblicazione.md) è la
  principale.

### Contratto di errore

- **Nessun vocabolo nel catalogo:** la schermata mostra il messaggio di
  nessun materiale, senza errori.
- **Tutti i vocaboli tolti:** la schermata mostra il messaggio "tutti
  tolti", senza errori e senza modo di recuperarli.
- **Uscita a metà:** l'esito si registra alla conferma. Se Sara cambia
  schermata o chiude la pagina prima di confermare, per quel vocabolo non si
  registra nulla; se lo fa dopo, l'esito resta registrato. Un'importanza già
  scelta resta registrata, e una rimozione non confermata non avviene.
- **Progressi non salvabili** (`localStorage` assente o pieno): li gestisce
  l'archivio della ripetizione degli errori, e l'allenamento funziona senza
  differenze visibili.
- **Vocabolo senza frase d'esempio o senza trucco** (materiale non ancora
  completato): l'esito li omette, senza spazi vuoti; senza frase d'esempio
  manca anche il suo pulsante di pronuncia.
- **Sintesi vocale assente** o senza voci inglesi: i pulsanti della
  pronuncia non compaiono. Una lettura che fallisce non mostra errori.
- **Uscita durante la riscrittura:** l'esito sbagliato resta registrato; al
  rientro arriva un vocabolo nuovo dalla sessione.
- **Parola iniziale sconosciuta, eliminata o tolta** (importanza 0):
  l'allenamento parte con il prossimo elemento, senza messaggi.
- **Lezione del vocabolo non trovata** (non dovrebbe accadere, perché il
  catalogo è coerente per costruzione): l'esito si mostra senza il titolo
  della lezione.

## Dependencies

- **[scheletro-e-pubblicazione](./scheletro-e-pubblicazione.md):** la rotta
  `#/vocaboli`, la barra di navigazione, lo stile di base, l'edizione del
  sito e il progetto Vitest.
- **[aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md):** i campi
  dei vocaboli e il titolo della lezione dal catalogo dei contenuti.
- **[ripetizione-errori](./ripetizione-errori.md):** la sessione di ripasso,
  che sceglie il vocabolo successivo e salva esiti e importanza.

Nessuna dipendenza esterna oltre allo stack: la sintesi vocale è del
browser.
