# Schede di grammatica

La sezione in cui Sara legge le regole di grammatica viste a lezione. La
schermata Grammatica elenca le lezioni che hanno schede, nell'ordine di
arrivo. Scelta una lezione, Sara ne legge tutte le schede di seguito in
un'unica pagina, ognuna con il proprio titolo. Il testo delle schede è
scritto in Markdown nei file di lezione e diventa pagina nel browser.

## Purpose

Serve la funzionalità "Schede di grammatica" e il flusso "Ripasso della
grammatica" di [product-design.md](../product-design.md). La grammatica è
divisa per lezione, a differenza di esercizi e vocaboli, e copre solo gli
argomenti del materiale ricevuto. È solo consultazione: la sezione legge le
schede dal catalogo dei contenuti e non registra nulla.

## Scope and non-goals

In:

- La schermata Grammatica al posto del segnaposto dello scheletro, con
  l'elenco delle lezioni.
- La pagina di una lezione con tutte le sue schede, sulla sottorotta
  `#/grammatica/<id-lezione>`.
- La conversione del Markdown delle schede in HTML.
- I casi in cui non c'è materiale, la lezione non esiste o non ha schede.

Fuori:

- **Esercizi propri della grammatica** e qualunque progresso: le schede non
  usano [ripetizione-errori](./ripetizione-errori.md) e leggerle non conta
  come ripasso.
- **Il formato delle schede:** `title` e `body` in Markdown standard, senza
  HTML né immagini, così come li fissa
  [aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md). Questa
  funzionalità non lo estende.
- **La modifica delle schede dall'app:** il materiale lo scrive Claude nel
  repository.
- **La ricerca dentro le schede** e un elenco di argomenti mescolato fra
  lezioni.
- **Una pagina per singola scheda** e i collegamenti fra schede di lezioni
  diverse.
- **Immagini, audio ed evidenziazione del codice.**

## Architecture

Costruito sullo stack di [technical-direction.md](../technical-direction.md):
TypeScript, Vue 3 con Composition API e single-file components, Vue Router in
modalità hash, Vitest con Vue Test Utils. È la schermata di grammatica della
parte "Interfaccia" della topologia.

- **Elenco della grammatica:** una funzione pura che, date le lezioni del
  catalogo, restituisce quelle con almeno una scheda, nell'ordine del
  catalogo, ognuna con id, titolo e titoli delle schede.
- **Conversione del Markdown:** una funzione pura che, dato il `body` di una
  scheda, restituisce l'HTML da mostrare. È l'unico punto dell'app in cui il
  Markdown diventa HTML e l'unico che usa la libreria Markdown.
- **Schermata Grammatica:** il componente registrato sulla rotta
  `#/grammatica` dello scheletro, che sostituisce il segnaposto. Mostra
  l'elenco: per ogni lezione il titolo e, sotto, i titoli delle sue schede.
  Toccare una lezione apre la sua pagina.
- **Pagina della lezione:** il componente sulla sottorotta
  `#/grammatica/<id-lezione>`. Mostra il titolo della lezione e poi tutte le
  sue schede in ordine di id, ognuna con il titolo come intestazione e il
  testo convertito. In cima c'è un collegamento all'elenco. All'ingresso la
  pagina parte dall'inizio.
- **Stile del testo delle schede:** regole CSS per gli elementi che il
  Markdown standard produce (intestazioni, paragrafi, elenchi, enfasi,
  citazioni, codice in linea), costruite sulle variabili di stile dello
  scheletro e leggibili su telefono e computer.

La barra di navigazione evidenzia Grammatica anche sulla pagina di una
lezione.

## Data and state

Nessun dato salvato. Lezioni e schede vengono dal catalogo dei contenuti,
che è la loro unica fonte.

In memoria:

- l'elenco della grammatica, calcolato all'ingresso nella schermata;
- sulla pagina della lezione, l'id della lezione, che vive nell'indirizzo:
  la pagina si può ricaricare e condividere.

L'HTML delle schede deriva dal loro `body` e non è uno stato a sé.

## Interfaces and contracts

### Elenco della grammatica

- **elenco(lezioni)** → le lezioni con almeno una scheda, nell'ordine di id
  del catalogo, cioè di arrivo, ognuna con id, titolo e i titoli delle sue
  schede in ordine di id.
- Una lezione senza schede non compare.

### Conversione del Markdown

- **html(body)** → l'HTML del Markdown standard (CommonMark).
- L'HTML grezzo scritto nel `body` non viene interpretato: compare come
  testo. Così la regola "senza HTML" del formato vale anche per un file che
  la viola per errore, e nessun file può inserire codice nella pagina.
- Le tabelle e le altre estensioni non standard non vengono interpretate,
  come il formato prescrive.

### Contratto con le altre funzionalità

- **Rotte:** occupa `#/grammatica`, fissato da
  [scheletro-e-pubblicazione](./scheletro-e-pubblicazione.md), e aggiunge
  la sottorotta `#/grammatica/<id-lezione>`, registrata nel router dello
  scheletro.
- **Catalogo:** legge "le lezioni" e "una lezione per id", con le schede
  (`id`, `title`, `body`) così come le definisce
  [aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md).

### Contratto di errore

- **Nessuna lezione con schede:** la schermata Grammatica mostra un
  messaggio che dice che non ci sono ancora schede, senza errori.
- **Id di lezione sconosciuto** nell'indirizzo: la pagina mostra un
  messaggio che la lezione non esiste e il collegamento all'elenco.
- **Lezione esistente senza schede**, aperta da un indirizzo diretto: la
  pagina mostra il titolo della lezione, un messaggio che non ha schede e il
  collegamento all'elenco.

## Dependencies

- **[scheletro-e-pubblicazione](./scheletro-e-pubblicazione.md):** la rotta
  `#/grammatica` e il router in cui registrare la sottorotta, la barra di
  navigazione, lo stile di base e il progetto Vitest.
- **[aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md):** le
  lezioni e le loro schede, lette dal catalogo dei contenuti.

Dipendenze esterne:

- **markdown-it**, con l'HTML grezzo disattivato e le sole regole
  CommonMark: la libreria Markdown leggera prevista dalla direzione tecnica,
  scelta perché ignora da sola l'HTML scritto nei file.

## Open questions

- **Tabelle nelle schede**, per esempio quelle di coniugazione: il formato
  ammette solo Markdown standard, che non le prevede. Per mostrarle va prima
  esteso il formato in
  [aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md); la
  conversione dovrebbe poi attivare le tabelle.
