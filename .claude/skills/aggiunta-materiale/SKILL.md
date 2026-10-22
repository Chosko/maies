---
name: aggiunta-materiale
description: Trasforma il materiale di una lezione d'inglese passato in chat da Sara — un PDF, una foto, un vocabolo — o la correzione di un elemento già scritto in file di lezione sotto contenuti/lezioni/, con frasi da tradurre, vocaboli e schede di grammatica, oppure una lista di vocaboli per i kids in contenuti/kids/, poi esegue il test di validità e fa commit. Usala quando in chat arriva un PDF o una foto di una lezione, una lista di vocaboli per i kids, un vocabolo da aggiungere o una correzione di una frase, di un vocabolo o di una scheda.
---

# Aggiunta del materiale di una lezione

Questa skill esegue il procedimento di
`.claude/domain/features/aggiunta-materiale-lezione.md` § *Procedimento di
Claude*. Quel documento è l'unica fonte del formato dei file di lezione
(§ *Data and state* → *La lezione*), delle regole degli identificatori
(§ *Identificatori*) e dei vincoli del test di validità (§ *Interfaces and
contracts* → *Test di validità*): leggili lì prima di scrivere un file, e non
ricopiarli altrove.

Con Sara si parla in italiano. Il sito ha due edizioni, ognuna con la sua
cartella di lezioni, un file per lezione:

- `contenuti/lezioni/` — l'edizione di Sara, la predefinita;
- `contenuti/kids/` — l'edizione della figlia, servita sotto `/kids/`, con
  sole liste di vocaboli. Ci va il materiale che Sara indica come per i kids.

Ogni procedimento qui sotto lavora dentro una sola cartella, quella
dell'edizione a cui va il materiale: numeri, duplicati e lezione più recente
si cercano lì e mai nell'altra. Il test di validità è `npm test`, che rilegge
le due cartelle a ogni esecuzione, ognuna per conto suo.

## L'originale non entra nel repository

Il repository è pubblico: il PDF o la foto non si salvano mai al suo
interno. Se l'originale è arrivato come file nella cartella di lavoro, resta
fuori da ogni commit. Si fa commit solo dei file di lezione scritti o
arricchiti, aggiunti per percorso esplicito, mai con `git add -A` o
`git add .`.

## Una lezione da PDF o foto

1. **Leggere il materiale.** Prima di scrivere qualunque file, chiedere a
   Sara in chat le parti illeggibili o incerte e aspettare la risposta.
2. **Numero e argomento.** Leggere tutte le lezioni esistenti in
   `contenuti/lezioni/`. La nuova prende il numero successivo al più alto e
   un argomento in kebab-case, nella forma d'id del documento di feature.
3. **Vocaboli.** Ricavare tutti quelli che il materiale presenta. Un
   vocabolo che esiste già in una lezione precedente non si duplica: le sue
   traduzioni nuove si aggiungono al vocabolo esistente, nella sua lezione,
   e quella lezione entra nel commit.
4. **Schede di grammatica.** Una per ogni argomento trattato. Un argomento
   già spiegato in una lezione precedente ha una scheda nuova solo se questa
   lezione aggiunge qualcosa, e la scheda tratta solo la parte nuova.
5. **Frasi da tradurre.** Scriverne fra 10 e 20, in proporzione a quanta
   grammatica e quanti vocaboli contiene la lezione: frasi italiane
   originali che esercitano la grammatica e i vocaboli della lezione, mai
   uguali a frasi già esistenti. Ognuna ha la traduzione corretta e le
   varianti accettabili — forme contratte e non contratte, sinonimi
   equivalenti, ordini alternativi ammessi.
6. **Scrivere e verificare.** Scrivere il file, eseguire `npm test` e
   correggere il file finché passa.
7. **Commit** del nuovo file di lezione più le lezioni precedenti arricchite
   al passo 3, e nient'altro.

## Una lista di vocaboli per i kids

Una foto o un elenco di vocaboli che Sara indica come per i kids diventa una
lezione nuova in `contenuti/kids/`, con i soli vocaboli:

1. **Leggere il materiale**, chiedendo le parti illeggibili o incerte come al
   passo 1 della lezione da PDF.
2. **Numero e argomento** come al passo 2, sulle lezioni di `contenuti/kids/`.
3. **Vocaboli** come al passo 3, cercando i duplicati in `contenuti/kids/`.
   Nessuna frase da tradurre e nessuna scheda di grammatica.
4. **Scrivere, verificare e fare commit** come ai passi 6 e 7.

## Un vocabolo singolo

1. Se il vocabolo esiste già in una lezione, aggiungere solo le traduzioni
   nuove al vocabolo esistente.
2. Altrimenti aggiungerlo alla lezione che Sara indica o, se non ne indica
   nessuna, all'ultima lezione arrivata, con il numero successivo dei
   vocaboli di quella lezione.
3. Eseguire `npm test`, correggere finché passa, poi fare commit del solo
   file di lezione modificato.

## Una correzione

Un refuso o una variante mancante in una frase, un vocabolo o una scheda si
corregge modificando l'elemento e mantenendone l'id, secondo le regole di
stabilità del documento di feature (§ *Identificatori* → *Stabilità*). Poi
`npm test` e commit del solo file corretto, come sopra.
