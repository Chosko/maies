# Ripetizione degli errori

Il modulo che decide cosa proporre a Sara durante il ripasso. Per ogni tipo
di elemento tiene sul dispositivo un gruppo di lavoro ristretto, su cui Sara
si allena finché ogni elemento non è imparato, e ripropone gli elementi
imparati per un controllo dopo intervalli di giorni via via più lunghi.
Tiene conto dell'importanza che Sara ha dato a ciascun elemento e non
propone più quelli con importanza 0. Non ha schermate: le due sessioni di
allenamento adottano l'interfaccia definita qui.

## Purpose

Serve la funzionalità "Ripetizione degli errori" e le decisioni "Gruppo di
lavoro e ripasso a intervalli" e "Importanza degli elementi" di
[product-design.md](../product-design.md). I flussi "Ripasso con gli
esercizi" e "Ripasso dei vocaboli" chiedono entrambi a questo modulo quale
elemento mostrare e gli comunicano l'esito di ogni risposta, così la logica
di ripetizione esiste in un solo punto ed è uguale per le due sessioni.

## Scope and non-goals

In:

- L'archivio dei progressi nel browser, indicizzato per id globale, con lo
  stato di apprendimento e l'importanza di ogni elemento.
- Il gruppo di lavoro di ogni tipo: chi ne fa parte, quando un elemento è
  imparato, chi entra al suo posto.
- I controlli a intervalli di giorni degli elementi imparati e il ripasso
  libero quando non resta altro.
- La scelta del prossimo elemento fra gruppo, controlli e ripasso libero.
- La sessione di ripasso: l'interfaccia "prossimo elemento / registra esito
  / registra importanza" usata da esercizi di traduzione e allenamento
  vocaboli.
- La conversione dei progressi salvati nel formato a tre livelli.

Fuori:

- **Le schermate e il controllo delle risposte:** mostrare l'elemento e
  stabilire se la risposta è giusta spetta agli esercizi di traduzione
  (autovalutazione) e all'allenamento vocaboli (verifica automatica). Questo
  modulo riceve solo l'esito.
- **Algoritmi con intervalli calcolati sulla difficoltà** (tipo SM-2): gli
  intervalli sono una scala fissa.
- **Statistiche, cronologia delle risposte, azzeramento dei progressi** e
  qualunque indicazione a schermo del gruppo o dei controlli in attesa.
- **La dimensione del gruppo o la scala degli intervalli scelte da Sara:**
  sono fisse.
- **Il recupero di un elemento con importanza 0:** una volta tolto,
  l'elemento non torna negli allenamenti. Un recupero dal dizionario per i
  vocaboli resta un'idea per il futuro.
- **I pulsanti dell'importanza:** li mostrano le schermate degli esercizi e
  dei vocaboli, che chiamano "registra importanza".
- **Sincronizzazione tra dispositivi:** decisione aperta in
  [technical-direction.md](../technical-direction.md).
- **La scelta della lezione su cui allenarsi:** il gruppo prende per primi
  gli elementi della lezione più recente.
- **Schede di grammatica e dizionario:** sono di sola consultazione e non
  hanno progressi.

## Architecture

Costruito sullo stack di [technical-direction.md](../technical-direction.md):
TypeScript e Vitest, logica pura senza componenti Vue. È la parte
"Progressi e ripetizione" della sua topologia.

- **Archivio dei progressi:** legge e scrive lo stato di ogni elemento in
  `localStorage`. È l'unico punto che tocca il salvataggio del browser.
- **Regole di apprendimento:** funzioni pure che, dato lo stato di un
  elemento, l'esito e la data di oggi, danno il nuovo stato (vedi
  *Transizioni*), e che calcolano l'intervallo di un controllo dalla scala e
  dall'importanza.
- **Pianificatore:** una funzione pura che, dati i candidati con il loro
  stato e la loro importanza, la data di oggi, gli ultimi elementi proposti
  e una sorgente di casualità, completa il gruppo di lavoro e sceglie il
  prossimo elemento (vedi *Scelta del prossimo elemento*). Data e casualità
  sono parametri, così i test sono deterministici.
- **Sessione di ripasso:** unisce le parti precedenti per un tipo di
  elemento (frasi o vocaboli). Prende i candidati dal catalogo dei contenuti
  di [aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md), chiede
  al pianificatore il prossimo elemento, registra esiti e importanza
  nell'archivio e tiene in memoria gli ultimi elementi proposti.

## Data and state

### Stati di un elemento

| Stato | Significato |
| --- | --- |
| nuovo | mai entrato nel gruppo; ogni elemento senza stato salvato |
| da riprendere | sbagliato in passato e non nel gruppo; nasce solo dalla conversione dei progressi a tre livelli |
| nel gruppo | nel gruppo di lavoro, con la serie di risposte giuste di fila (0, 1 o 2) |
| imparato | uscito dal gruppo, con il gradino della scala, la data del prossimo controllo e la data in cui è stato visto l'ultima volta |

### Gruppo di lavoro

- Un gruppo per tipo: **5 frasi**, **8 vocaboli**. Si salva con i
  progressi, quindi resta lo stesso fra una sessione e l'altra.
- Quando il gruppo ha meno elementi della sua dimensione, si completa con i
  candidati in quest'ordine: prima i "da riprendere", poi i "nuovi". A
  parità di stato, prima l'importanza più alta, poi la lezione più recente
  (numero di lezione più alto), poi l'ordine nel file della lezione.
- Un elemento che passa a importanza 0, o che il catalogo non conosce più,
  lascia il gruppo e libera il posto.
- Il gruppo può superare la sua dimensione quando vi rientra un elemento
  dopo un controllo sbagliato; non si completa finché non torna sotto la
  dimensione.

### Scala dei controlli

- Gradini: **1, 3, 7, 14, 30 giorni**. Dopo l'ultimo gradino l'intervallo
  resta di 30 giorni.
- L'importanza moltiplica l'intervallo: 1 → ×2, 2 → ×1, 3 → ×0,5,
  arrotondato per difetto e mai sotto un giorno.
- Le date sono giorni di calendario dell'ora locale del dispositivo, senza
  orario. Un controllo è scaduto quando la sua data è oggi o passata.

### Transizioni

- **Nel gruppo, giusto:** la serie sale di uno; alla terza risposta giusta
  di fila l'elemento è imparato, al primo gradino, con il controllo fra un
  intervallo da oggi. Il posto liberato si completa alla prossima scelta.
- **Nel gruppo, sbagliato:** la serie torna a 0; l'elemento resta nel gruppo.
- **Imparato, controllo scaduto, giusto:** sale di un gradino e il prossimo
  controllo è fra l'intervallo di quel gradino da oggi.
- **Imparato, controllo scaduto, sbagliato:** rientra subito nel gruppo, con
  serie 0, anche se il gruppo è pieno.
- **Imparato, ripasso libero (controllo non ancora scaduto):** giusto non
  cambia gradino né data del controllo; sbagliato rientra nel gruppo come
  dopo un controllo sbagliato.
- A ogni esito di un elemento imparato si aggiorna la data in cui è stato
  visto l'ultima volta.
- Un esito per un elemento "nuovo" o "da riprendere" (che non dovrebbe
  arrivare, perché la sessione propone solo elementi del gruppo o imparati)
  lo fa entrare nel gruppo e poi si applica come sopra.

### Scelta del prossimo elemento

Prima si completa il gruppo, poi:

1. Se ci sono controlli scaduti e il gruppo non è vuoto, si alternano: un
   controllo ogni due elementi proposti dalla sessione, cominciando con un
   controllo. Con il gruppo vuoto si propongono solo controlli. Il ripasso
   libero non fa avanzare l'alternanza.
2. Un elemento del gruppo si sceglie a caso, con la stessa probabilità, fra
   quelli che non sono fra gli ultimi proposti.
3. Un controllo si sceglie fra quelli scaduti, dal più vecchio; a parità di
   data, dall'importanza più alta.
4. Se il gruppo è vuoto e non ci sono controlli scaduti (tutto imparato),
   è ripasso libero: si propone l'elemento imparato visto meno di recente,
   fra quelli che non sono fra gli ultimi proposti.

La finestra degli ultimi proposti è di 3 elementi, ridotta al numero di
elementi disponibili meno uno quando sono pochi, così con un solo elemento
questo si ripropone. Gli elementi disponibili sono quelli del gruppo più gli
imparati, sempre con importanza diversa da 0, e la finestra vale per il
gruppo, per i controlli e per il ripasso libero. Se la finestra esclude
tutto il gruppo, si passa al controllo o al ripasso libero; se esclude
tutto, si ignora.

Il numero di lezione che ordina l'ingresso nel gruppo è la posizione della
lezione nel catalogo, che le ordina per id.

### Importanza

Ogni elemento ha un'importanza da 0 a 3, scelta da Sara e indipendente dagli
esiti: 2 è il valore iniziale, 0 lo toglie dagli allenamenti. Un elemento con
importanza 0 non è un candidato, qualunque sia il suo stato. Le altre
importanze decidono l'ordine di ingresso nel gruppo e l'intervallo dei
controlli, come descritto sopra.

### Progressi salvati

- Una chiave di `localStorage` per edizione del sito (`maies.progressi`, e
  `maies.kids.progressi` per l'edizione kids, che condivide il dominio e i
  cui id si sovrappongono a quelli della principale) contiene un oggetto con
  un numero di versione del formato e una mappa da id globale (per esempio
  `03-present-continuous/v07`) allo stato dell'elemento: lo stato con i suoi
  dati (serie, gradino, date) e l'importanza, ognuno assente quando vale il
  valore iniziale. Frasi e vocaboli condividono la mappa, perché i loro id
  non si sovrappongono; il gruppo di ogni tipo si ricava dagli elementi "nel
  gruppo".
- Si salvano solo gli elementi che non sono più "nuovi" o hanno
  un'importanza diversa da 2.
- La mappa viene riscritta a ogni esito, a ogni importanza registrata e a
  ogni completamento del gruppo, così chiudere la pagina in qualsiasi
  momento non perde nulla.
- I formati precedenti a tre livelli si convertono alla lettura: "da
  ripassare" diventa "da riprendere", "consolidato" diventa "imparato" al
  primo gradino con il controllo scaduto oggi, "normale" diventa "nuovo";
  l'importanza resta. La chiave si riscrive nel formato nuovo alla prima
  registrazione.
- Un id della mappa che il catalogo non conosce più (elemento eliminato)
  resta salvato ma è ignorato.

### Stato della sessione

In memoria e non salvati: il tipo di elemento della sessione, gli ultimi
elementi proposti e il turno dell'alternanza fra gruppo e controlli. I
candidati sono gli elementi del tipo con importanza diversa da 0.

## Interfaces and contracts

### Sessione di ripasso

Esposta a esercizi di traduzione e allenamento vocaboli:

- **crea sessione(tipo)** con tipo "frasi" o "vocaboli", con sorgente di
  casualità, data di oggi e archivio sostituibili nei test.
- **prossimo elemento()**: restituisce un elemento del catalogo del tipo
  della sessione, con il suo id globale e la sua importanza, scelto come in
  *Scelta del prossimo elemento*. Quando non c'è nulla da proporre
  restituisce uno di due casi vuoti, che la schermata mostra con messaggi
  diversi:
  - **nessun materiale:** il catalogo non ha elementi di quel tipo;
  - **tutti tolti:** il catalogo ne ha, ma tutti con importanza 0.
- **elemento per id(id globale)**: restituisce l'elemento del catalogo del
  tipo della sessione con quell'id e la sua importanza, e lo conta fra gli
  ultimi proposti; restituisce "nessuno" per un id sconosciuto, di un altro
  tipo o con importanza 0. Serve ad aprire l'allenamento su un elemento
  indicato da fuori, come la [domanda a sorpresa](./domanda-a-sorpresa.md).
- **registra esito(id globale, giusto | sbagliato)**: applica le
  transizioni con la data di oggi e salva. Un id sconosciuto al catalogo o
  con importanza 0 viene ignorato.
- **registra importanza(id globale, 0 | 1 | 2 | 3)**: salva l'importanza
  dell'elemento, che vale dalla prossima scelta; con 0 l'elemento lascia il
  gruppo. Non tocca lo stato di apprendimento. Un id sconosciuto al catalogo
  o un valore fuori da 0–3 vengono ignorati.

Una sessione non ha fine né lunghezza: la schermata chiede il prossimo
elemento finché Sara non si ferma. Le schermate non distinguono un elemento
del gruppo da un controllo.

### Archivio dei progressi

- **leggi stato(id globale)**, con "nuovo" per un id mai registrato.
- **salva stato(id globale, stato)**.
- **leggi importanza(id globale)**, con 2 per un id mai registrato.
- **salva importanza(id globale, importanza)**.

### Contratto di errore

- `localStorage` non disponibile (navigazione privata, accesso negato) o
  pieno: l'archivio lavora in memoria per la durata della pagina, senza
  errori visibili. Il ripasso funziona, i progressi non sopravvivono alla
  chiusura.
- Contenuto della chiave illeggibile o di una versione sconosciuta: si
  riparte da progressi vuoti e la chiave viene riscritta alla prima
  registrazione.
- Uno stato sconosciuto o incompleto per un singolo id vale "nuovo";
  un'importanza sconosciuta vale 2.
- Un orologio del dispositivo spostato indietro rende i controlli più
  lontani, senza errori.

## Dependencies

- **[aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md):** il
  catalogo dei contenuti (tutte le frasi, tutti i vocaboli con la loro
  lezione e il loro ordine, la ricerca per id globale) e gli id globali
  stabili su cui si indicizzano i progressi.
- **[scheletro-e-pubblicazione](./scheletro-e-pubblicazione.md):** il
  progetto TypeScript e Vitest.
- **Usata da:** esercizi di traduzione e allenamento vocaboli, che adottano
  la sessione di ripasso. Nell'edizione kids nessuna schermata registra
  l'importanza, quindi ogni elemento vale 2.

Nessuna dipendenza esterna: `localStorage`, la data e la casualità sono del
browser.
