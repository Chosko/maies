# Dizionario dei vocaboli

La schermata in cui Sara consulta tutti i vocaboli di tutte le lezioni, fuori
dall'allenamento, come un piccolo dizionario. La lista è in ordine alfabetico
della parola italiana. Ogni voce mostra la parola e le sue traduzioni inglesi.
Un campo di ricerca in cima filtra la lista mentre Sara scrive, cercando sia
nell'italiano sia nell'inglese.

## Purpose

Serve la funzionalità "Dizionario dei vocaboli" e il flusso "Ripasso dei
vocaboli" di [product-design.md](../product-design.md). Sara può controllare
come si dice una parola, o che cosa significa una parola inglese, senza
avviare una sessione di allenamento. È solo consultazione: la schermata
legge i vocaboli dal catalogo dei contenuti e non registra nulla.

## Scope and non-goals

In:

- La schermata Dizionario al posto del segnaposto dello scheletro.
- L'ordinamento alfabetico delle voci.
- La ricerca per parola italiana e per traduzione inglese.
- I casi in cui non c'è materiale e in cui la ricerca non trova nulla.

Fuori:

- **I progressi:** il dizionario non usa
  [ripetizione-errori](./ripetizione-errori.md). Non evidenzia i vocaboli
  sbagliati e consultarlo non conta come risposta.
- **Il titolo della lezione** sulle voci, i filtri e il raggruppamento per
  lezione: le voci sono mescolate fra tutte le lezioni.
- **La modifica dei vocaboli dall'app:** il materiale lo scrive Claude nel
  repository, nel formato fissato da
  [aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md).
- **La direzione inglese → italiano** come lista separata: la ricerca trova
  anche le traduzioni inglesi, ma la lista resta ordinata per italiano.
- **Pronuncia, audio, preferiti** e il passaggio da una voce all'allenamento.
- **Il confronto approssimato** (tolleranza ai refusi): la ricerca trova
  solo il testo che compare davvero nella voce.
- **Sottorotte** per singolo vocabolo.

## Architecture

Costruito sullo stack di [technical-direction.md](../technical-direction.md):
TypeScript, Vue 3 con Composition API e single-file components, Vitest con
Vue Test Utils. È una schermata della parte "Interfaccia" della topologia.

- **Voci del dizionario:** una funzione pura che, dati i vocaboli del
  catalogo, restituisce le voci in ordine alfabetico della parola italiana.
- **Filtro di ricerca:** una funzione pura che, date le voci e il testo
  cercato, restituisce le voci che lo contengono, mantenendo l'ordine. È
  l'unico punto in cui vive la regola di ricerca.
- **Schermata Dizionario:** il componente registrato sulla rotta
  `#/dizionario` dello scheletro, che sostituisce il segnaposto. Mostra il
  campo di ricerca e la lista filtrata. Usa le variabili di stile e il
  layout responsivo dello scheletro.
  - **Campo di ricerca:** in cima alla lista. Filtra a ogni carattere
    scritto, senza un pulsante di conferma. Non applica correzioni o
    maiuscole automatiche della tastiera e si svuota con il comando di
    cancellazione nativo del campo.
  - **Voce:** la parola italiana, la traduzione principale (la prima di
    `en`) e, se ci sono, le altre traduzioni accettate.
  - **Nessun materiale:** un messaggio che dice che non ci sono ancora
    vocaboli, al posto di campo e lista.
  - **Nessun risultato:** un messaggio che dice che la ricerca non ha
    trovato vocaboli, sotto il campo.

## Data and state

Nessun dato salvato. I vocaboli vengono dal catalogo dei contenuti, che è la
loro unica fonte.

In memoria, per la durata della schermata:

- le voci ordinate, calcolate una volta all'ingresso;
- il testo cercato. Uscire e rientrare riparte con il campo vuoto.

La lista mostrata deriva da voci e testo cercato; non è uno stato a sé.

## Interfaces and contracts

### Voci del dizionario

- **voci(vocaboli)** → le voci, ognuna con id globale, parola italiana e
  traduzioni nell'ordine di `en`.
- **Ordine:** alfabetico italiano della parola `it`, senza distinguere
  maiuscole e accenti. Le parentesi che distinguono un significato ambiguo,
  come "pesca (frutto)", fanno parte della parola e si ordinano con essa.
- A parità di parola resta l'ordine del catalogo, cioè per lezione e per id.
  Il test di validità dei contenuti esclude però i vocaboli italiani
  duplicati.

### Filtro di ricerca

- **filtra(voci, testo cercato)** → le voci in cui il testo cercato compare
  come parte della parola italiana o di almeno una traduzione inglese.
- La normalizzazione, applicata al testo cercato e ai testi delle voci:
  - ignora le maiuscole;
  - ignora gli accenti, così "perche" trova "perché";
  - toglie gli spazi iniziali e finali e riduce a uno gli spazi interni
    ripetuti;
  - tratta gli apostrofi tipografici (’ ‘ ʼ) come l'apostrofo semplice.
- Un testo cercato vuoto dopo la normalizzazione restituisce tutte le voci.
- Questa regola è diversa dalla verifica della risposta di
  [allenamento-vocaboli](./allenamento-vocaboli.md), che confronta parole
  intere e non ignora gli accenti. Le due regole non si condividono.

### Contratto con le altre funzionalità

- **Rotta:** occupa `#/dizionario`, fissato da
  [scheletro-e-pubblicazione](./scheletro-e-pubblicazione.md). Non aggiunge
  sottorotte.
- **Catalogo:** legge "tutti i vocaboli" con id globale, `it` ed `en`, così
  come li definisce
  [aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md).

### Contratto di errore

- **Nessun vocabolo nel catalogo:** la schermata mostra il messaggio di
  nessun materiale, senza errori.
- **Ricerca senza risultati:** la schermata mostra il messaggio di nessun
  risultato, con il campo ancora modificabile.

## Dependencies

- **[scheletro-e-pubblicazione](./scheletro-e-pubblicazione.md):** la rotta
  `#/dizionario`, la barra di navigazione, lo stile di base e il progetto
  Vitest.
- **[aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md):** i campi
  dei vocaboli e la loro lettura dal catalogo dei contenuti.

Nessuna dipendenza esterna oltre allo stack: l'ordinamento alfabetico
italiano e la rimozione degli accenti usano le funzioni standard del
browser.
