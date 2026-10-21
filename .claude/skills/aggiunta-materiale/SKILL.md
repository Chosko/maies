---
name: aggiunta-materiale
description: Trasforma il materiale di una lezione d'inglese passato in chat da Sara — un PDF, una foto, un vocabolo — o la correzione di un elemento già scritto in file di lezione sotto contenuti/lezioni/, con frasi da tradurre, vocaboli e schede di grammatica, poi esegue il test di validità e fa commit. Usala quando in chat arriva un PDF o una foto di una lezione, un vocabolo da aggiungere o una correzione di una frase, di un vocabolo o di una scheda.
---

# Aggiunta del materiale di una lezione

Questa skill esegue il procedimento di
`.claude/domain/features/aggiunta-materiale-lezione.md` § *Procedimento di
Claude*. Quel documento è l'unica fonte del formato dei file di lezione
(§ *Data and state* → *La lezione*), delle regole degli identificatori
(§ *Identificatori*) e dei vincoli del test di validità (§ *Interfaces and
contracts* → *Test di validità*): leggili lì prima di scrivere un file, e non
ricopiarli altrove.

Con Sara si parla in italiano. I file di lezione stanno in
`contenuti/lezioni/`, uno per lezione; il test di validità è `npm test`, che
rilegge la cartella a ogni esecuzione.

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
