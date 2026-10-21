# maies

maies è un'applicazione personale per ripassare l'inglese studiato in un
corso a scuola. Raccoglie il materiale delle lezioni — i PDF e le foto
distribuiti a scuola — trasformato in tre strumenti di ripasso: esercizi di
traduzione di frasi dall'italiano all'inglese, una lista di vocaboli su cui
allenarsi scrivendo la traduzione inglese, e schede di grammatica che
riassumono le regole viste a lezione. Le cose sbagliate tornano più spesso,
finché non sono consolidate.

Technical foundations (stack, architecture, hosting) are recorded in
[technical-direction.md](./technical-direction.md), not here.

## Target users

Una sola utente: Sara, che frequenta un corso di inglese a scuola. Riceve a
lezione PDF e fogli con nozioni, vocaboli e regole di grammatica, e vuole
ripassarli nei momenti liberi, dal telefono o dal computer, con sessioni di
lunghezza variabile a seconda del tempo che ha quel giorno. Oggi ripassa
direttamente sul materiale ricevuto, che non la mette alla prova e non le
ricorda cosa ha sbagliato.

## User experience and key flows

### Arriva una nuova lezione

1. Sara riceve a scuola un PDF o un foglio (che fotografa).
2. Lo passa a Claude nella chat di sviluppo del progetto.
3. Claude ne ricava frasi da tradurre, vocaboli e una scheda di grammatica
   per gli argomenti trattati, e li aggiunge al repository.
4. Alla pubblicazione successiva, Sara trova il nuovo materiale nell'app,
   su qualsiasi dispositivo. Allo stesso modo, un vocabolo che Sara vuole
   aggiungere a mano lo passa a Claude in chat: finisce nella lezione che
   lei indica o, se non ne indica nessuna, nell'ultima arrivata.

### Ripasso con gli esercizi

1. Sara apre l'app e avvia una sessione di esercizi.
2. L'app le propone una frase in italiano, scelta tra tutte le lezioni,
   privilegiando le frasi sbagliate in passato.
3. Sara scrive la traduzione inglese e la conferma.
4. L'app mostra la traduzione corretta, con le eventuali varianti
   accettabili; Sara segna da sola se la sua risposta era giusta o
   sbagliata.
5. Si passa alla frase successiva; la sessione continua finché Sara non
   decide di fermarsi.

### Ripasso dei vocaboli

1. Sara avvia una sessione sui vocaboli.
2. L'app mostra una parola in italiano, privilegiando quelle sbagliate in
   passato; Sara scrive la traduzione inglese.
3. L'app controlla da sola la risposta, ignorando maiuscole, spazi
   superflui, apostrofi tipografici e punteggiatura finale, e accettando ogni
   traduzione prevista per quella parola; poi mostra le traduzioni corrette.
4. La sessione continua finché Sara non si ferma.

Fuori dall'allenamento, Sara può consultare la lista completa dei vocaboli
con le loro traduzioni, come un piccolo dizionario.

### Ripasso della grammatica

1. Sara apre la sezione di grammatica, organizzata per lezione/PDF.
2. Sceglie una lezione e legge le schede degli argomenti trattati in quella
   lezione — per esempio cos'è il present continuous e quando si usa.

## Design decisions

- **Uso personale.** Una sola utente: niente account, login, condivisione o
  gestione di più persone.
- **Sito statico, senza intelligenza artificiale nell'app.** maies gira su
  GitHub Pages. Il materiale di ripasso non viene generato dall'app: lo
  scrive Claude nel repository a partire da ciò che Sara gli passa in chat.
  Vincolo: hosting statico su GitHub Pages, nessun server.
- **Il materiale è uguale ovunque, i progressi no.** Esercizi, vocaboli e
  grammatica sono identici su ogni dispositivo; i progressi (cosa è stato
  sbagliato e va riproposto) restano sul dispositivo su cui sono stati
  fatti, senza sincronizzazione.
- **Un solo tipo di esercizio: traduzione dall'italiano all'inglese.**
  Correzione per autovalutazione dopo aver visto la risposta corretta; non
  sono previste spiegazioni dell'errore.
- **Vocaboli verificati automaticamente**, nella direzione italiano →
  inglese.
- **Esercizi e vocaboli mescolati tra tutte le lezioni; grammatica divisa
  per lezione.**
- **La grammatica copre solo gli argomenti del materiale ricevuto**, non un
  programma generale.
- **Ripetizione degli errori.** Ciò che è stato sbagliato viene riproposto
  più spesso.
- **Sessioni aperte.** Una sessione di ripasso non ha una lunghezza fissa:
  continua finché Sara non si ferma.
- **Funziona su telefono e computer**, adattandosi allo schermo.
- **Semplicità di realizzazione prima di tutto.** Il prodotto deve essere
  rapido da implementare; ciò che non serve al ripasso resta fuori.

## High-level features

### Aggiunta del materiale da una lezione

Quando Sara passa in chat un PDF, una foto o un elenco di vocaboli, Claude
ne ricava il materiale di ripasso e lo aggiunge al repository nel formato
che l'app legge: frasi italiane da tradurre con la traduzione inglese
corretta e le varianti accettabili, vocaboli con le loro traduzioni, e una
scheda di grammatica per ogni argomento trattato. Il materiale resta
associato alla lezione da cui viene. Serve il flusso "Arriva una nuova
lezione"; non è una schermata dell'app, ma il modo in cui l'app riceve
contenuti nuovi.

### Esercizi di traduzione

Una sessione aperta di frasi in italiano da tradurre in inglese, mescolate
tra tutte le lezioni. Sara scrive la sua traduzione, la conferma, vede la
traduzione corretta con le varianti accettabili e segna da sola se era
giusta o sbagliata; poi arriva la frase successiva, finché non decide di
fermarsi. Serve il flusso "Ripasso con gli esercizi".

### Allenamento vocaboli

Una sessione aperta sui vocaboli di tutte le lezioni: l'app mostra una
parola in italiano, Sara scrive la traduzione inglese e l'app la verifica
da sola, accettando ogni traduzione prevista e ignorando maiuscole, spazi
superflui, apostrofi tipografici e punteggiatura finale; poi mostra le
traduzioni corrette. Continua finché Sara non si ferma. Serve il flusso "Ripasso dei vocaboli".

### Dizionario dei vocaboli

La lista completa dei vocaboli con le loro traduzioni, da consultare fuori
dall'allenamento. Serve il flusso "Ripasso dei vocaboli".

### Schede di grammatica

Le schede degli argomenti di grammatica, organizzate per lezione/PDF: Sara
sceglie una lezione e legge le regole viste in quella lezione. Solo
consultazione, senza esercizi propri. Serve il flusso "Ripasso della
grammatica".

### Ripetizione degli errori

Su ogni dispositivo, l'app ricorda quali frasi e quali vocaboli Sara ha
sbagliato e li ripropone più spesso negli esercizi di traduzione e
nell'allenamento vocaboli, finché non li risponde correttamente. È
condivisa dalle due sessioni di allenamento, che le chiedono cosa
proporre dopo.
