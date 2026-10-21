# Ripetizione degli errori

Il modulo che decide cosa proporre a Sara durante il ripasso. Ricorda, sul
dispositivo, come ha risposto a ogni frase e a ogni vocabolo, e quando una
sessione di esercizi o di allenamento vocaboli chiede l'elemento successivo
ne estrae uno a caso, privilegiando quelli sbagliati e poi quelli mai visti
rispetto a quelli già consolidati. Non ha schermate: le due sessioni di
allenamento adottano l'interfaccia definita qui.

## Purpose

Serve la funzionalità "Ripetizione degli errori" e la decisione omonima di
[product-design.md](../product-design.md): ciò che è stato sbagliato viene
riproposto più spesso, finché Sara non lo risponde correttamente. I flussi
"Ripasso con gli esercizi" e "Ripasso dei vocaboli" chiedono entrambi a
questo modulo quale elemento mostrare e gli comunicano l'esito di ogni
risposta, così la logica di ripetizione esiste in un solo punto ed è uguale
per le due sessioni.

## Scope and non-goals

In:

- L'archivio dei progressi nel browser, indicizzato per id globale.
- L'algoritmo a tre livelli che sceglie il prossimo elemento.
- La sessione di ripasso: l'interfaccia "prossimo elemento / registra esito"
  usata da esercizi di traduzione e allenamento vocaboli.

Fuori:

- **Le schermate e il controllo delle risposte:** mostrare l'elemento e
  stabilire se la risposta è giusta spetta agli esercizi di traduzione
  (autovalutazione) e all'allenamento vocaboli (verifica automatica). Questo
  modulo riceve solo l'esito.
- **Ripetizione spaziata per date o intervalli** (tipo SM-2): le sessioni
  sono aperte e l'obiettivo è la semplicità di realizzazione.
- **Statistiche, cronologia delle risposte e azzeramento dei progressi.**
- **Sincronizzazione tra dispositivi:** decisione aperta in
  [technical-direction.md](../technical-direction.md).
- **Filtri per lezione:** le sessioni pescano tra tutte le lezioni.
- **Schede di grammatica e dizionario:** sono di sola consultazione e non
  hanno progressi.

## Architecture

Costruito sullo stack di [technical-direction.md](../technical-direction.md):
TypeScript e Vitest, logica pura senza componenti Vue. È la parte
"Progressi e ripetizione" della sua topologia.

- **Archivio dei progressi:** legge e scrive lo stato di ogni elemento in
  `localStorage`. È l'unico punto che tocca il salvataggio del browser.
- **Selettore:** una funzione pura che, dati i candidati, il loro livello e
  gli elementi da escludere, ne estrae uno con probabilità proporzionale al
  peso del livello. La sorgente di casualità è un parametro, così i test
  sono deterministici.
- **Sessione di ripasso:** unisce le due parti precedenti per un tipo di
  elemento (frasi o vocaboli). Prende i candidati dal catalogo dei contenuti
  di [aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md), chiede al
  selettore il prossimo elemento, registra gli esiti nell'archivio e tiene in
  memoria gli ultimi elementi proposti.

## Data and state

### Livelli

Ogni elemento ha uno di tre livelli, ognuno con un peso di estrazione:

| Livello | Peso | Significato |
| --- | --- | --- |
| da ripassare | 6 | l'ultima risposta era sbagliata |
| normale | 3 | mai visto, oppure giusto una volta dopo un errore |
| consolidato | 1 | risposto giusto stando già a livello normale |

Transizioni:

- Un esito **sbagliato** porta l'elemento a "da ripassare", da qualunque
  livello.
- Un esito **giusto** lo fa salire di un livello: da "da ripassare" a
  "normale", da "normale" a "consolidato". Un elemento consolidato resta tale.
- Un elemento senza stato salvato è "normale".

Dopo un errore servono quindi due risposte giuste di fila perché l'elemento
torni consolidato, e gli elementi nuovi di una lezione appena arrivata
escono più spesso di quelli già saputi.

### Progressi salvati

- Una sola chiave di `localStorage` contiene un oggetto con un numero di
  versione del formato e una mappa da id globale (per esempio
  `03-present-continuous/v07`) al livello dell'elemento. Frasi e vocaboli
  condividono la mappa, perché i loro id non si sovrappongono.
- Si salvano solo gli elementi che hanno ricevuto almeno un esito.
- La mappa viene riscritta a ogni esito registrato, così chiudere la
  pagina in qualsiasi momento non perde risposte.
- Un id della mappa che il catalogo non conosce più (elemento eliminato)
  resta salvato ma è ignorato.

### Stato della sessione

In memoria e non salvati: il tipo di elemento della sessione e gli ultimi
elementi proposti. La finestra di esclusione è di 3 elementi, ridotta al
numero di candidati meno uno quando i candidati sono pochi, così con un solo
elemento questo si ripropone.

## Interfaces and contracts

### Sessione di ripasso

Esposta a esercizi di traduzione e allenamento vocaboli:

- **crea sessione(tipo)** con tipo "frasi" o "vocaboli", con sorgente di
  casualità e archivio sostituibili nei test.
- **prossimo elemento()**: restituisce un elemento del catalogo del tipo
  della sessione, con il suo id globale, scelto dal selettore escludendo gli
  ultimi proposti. Se il catalogo non ha elementi di quel tipo restituisce
  "nessuno" e la schermata mostra che non c'è materiale.
- **registra esito(id globale, giusto | sbagliato)**: aggiorna il livello
  secondo le transizioni e salva. Un id sconosciuto al catalogo viene
  ignorato.

Una sessione non ha fine né lunghezza: la schermata chiede il prossimo
elemento finché Sara non si ferma.

### Selettore

- **scegli(candidati con livello, esclusi, casualità)**: restituisce un
  candidato non escluso con probabilità proporzionale al peso del suo
  livello, oppure "nessuno" se non ci sono candidati.

### Archivio dei progressi

- **leggi livello(id globale)**, con "normale" per un id mai registrato.
- **salva livello(id globale, livello)**.

### Contratto di errore

- `localStorage` non disponibile (navigazione privata, accesso negato) o
  pieno: l'archivio lavora in memoria per la durata della pagina, senza
  errori visibili. Il ripasso funziona, i progressi non sopravvivono alla
  chiusura.
- Contenuto della chiave illeggibile o di una versione sconosciuta: si
  riparte da progressi vuoti e la chiave viene riscritta al primo esito.
- Un livello sconosciuto per un singolo id vale "normale".

## Dependencies

- **[aggiunta-materiale-lezione](./aggiunta-materiale-lezione.md):** il
  catalogo dei contenuti (tutte le frasi, tutti i vocaboli, la ricerca per
  id globale) e gli id globali stabili su cui si indicizzano i progressi.
- **[scheletro-e-pubblicazione](./scheletro-e-pubblicazione.md):** il
  progetto TypeScript e Vitest.
- **Usata da:** esercizi di traduzione e allenamento vocaboli, che adottano
  la sessione di ripasso.

Nessuna dipendenza esterna: `localStorage` e la casualità sono del browser.
