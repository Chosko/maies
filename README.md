# maies

maies è un'applicazione personale per ripassare l'inglese studiato in un
corso a scuola: esercizi di traduzione, allenamento sui vocaboli, un
dizionario e schede di grammatica ricavati dal materiale delle lezioni. È
un sito statico in Vue, pubblicato su <https://maies.chosko.com>.

Lo stesso codice si compila in due edizioni:

| Edizione | Indirizzo | Lezioni | Sezioni | Chiave dei progressi |
| --- | --- | --- | --- | --- |
| principale | <https://maies.chosko.com> | `contenuti/lezioni/` | Esercizi, Vocaboli, Dizionario, Grammatica | `maies.progressi` |
| kids | <https://maies.chosko.com/kids/> | `contenuti/kids/` | Vocaboli, Dizionario | `maies.kids.progressi` |

L'edizione kids è la modalità `kids` di Vite (`src/edizione.ts`): base
`/kids/`, uscita in `dist/kids/` e alias `@lezioni` sulla sua cartella. Non
ha login: ognuna apre il proprio indirizzo sul proprio dispositivo.

## Comandi

Dopo `npm install`:

| Comando | Cosa fa |
| --- | --- |
| `npm run dev` | Avvia il server di sviluppo di Vite; `npm run dev -- --mode kids` avvia l'edizione kids. |
| `npm test` | Esegue i test con Vitest. |
| `npm run typecheck` | Controlla i tipi con `vue-tsc`. |
| `npm run build` | Compila le due edizioni: la principale in `dist/`, la kids in `dist/kids/`. |

## Contenuti

Il materiale di ripasso sta in `contenuti/lezioni/` per l'edizione
principale e in `contenuti/kids/` per quella kids, un file JSON per lezione;
le lezioni kids hanno solo vocaboli. Lo scrive solo Claude, con la skill di
progetto [`aggiunta-materiale`](.claude/skills/aggiunta-materiale/SKILL.md),
quando in chat arriva un PDF, una foto, un vocabolo o una lista per i kids. I PDF e le foto originali non
entrano mai nel repository, che è pubblico.

L'app legge le lezioni alla compilazione dal catalogo in sola lettura
`src/contenuti/catalogo.ts`. Lo schema zod `src/contenuti/schema.ts` è
l'unica definizione del formato: zod è una dipendenza di sviluppo e l'app
importa dallo schema solo tipi, cosa che un test verifica.

Il test di validità (`tests/contenuti.test.ts`) fa parte di `npm test`:
rilegge le due cartelle con `node:fs` a ogni esecuzione, ognuna per conto
suo, quindi controlla subito
un file appena scritto, e un file malformato ferma la pubblicazione. I test
che leggono i file girano nell'ambiente `node` di Vitest, con i tipi di
`@types/node`.

Il formato dei file, gli identificatori stabili e il perché sono nel
documento di feature
[`.claude/domain/features/aggiunta-materiale-lezione.md`](.claude/domain/features/aggiunta-materiale-lezione.md).

## Progressi e ripasso

I progressi stanno nel `localStorage` del dispositivo, sotto la chiave
dell'edizione (`maies.progressi` o `maies.kids.progressi`): per ogni frase e
vocabolo si salvano livello e importanza, indicizzati per id globale. Non si sincronizzano tra dispositivi e in navigazione privata vanno
persi alla chiusura; se il browser non permette di leggerli, l'app lavora
solo in memoria.

Esercizi e vocaboli scelgono il prossimo elemento dalla sessione di ripasso
in `src/ripasso/`: `creaSessione('frasi')` o `creaSessione('vocaboli')`
propone un elemento con `prossimoElemento()`, ne registra l'esito con
`registraEsito(idGlobale, esito)` e l'importanza con
`registraImportanza(idGlobale, importanza)`. Tutte le sessioni dell'app condividono un
solo archivio dei progressi.

L'algoritmo a tre livelli, l'importanza e il perché sono nel documento di feature
[`.claude/domain/features/ripetizione-errori.md`](.claude/domain/features/ripetizione-errori.md).

## Esercizi

La schermata Esercizi propone frasi italiane, mescolate tra tutte le
lezioni, da tradurre in inglese. Sara scrive la traduzione e la conferma,
poi vede la traduzione corretta, le varianti accettabili e il titolo della
lezione, e segna da sola se la risposta era giusta o sbagliata: l'app non
confronta la risposta con le traduzioni. Nella soluzione Sara sceglie anche
l'importanza della frase, da 0 a 3, partendo da quella attuale: 1, 2 e 3 si
registrano subito, mentre lo 0 chiede prima una conferma ("Togli" o
"Annulla") e, confermato, toglie la frase dagli esercizi senza registrare un
esito e passa alla successiva. Ogni frase la sceglie la sessione di ripasso
di tipo `'frasi'`, che registra anche l'esito e l'importanza; a ogni
ingresso nella schermata si apre una sessione nuova. Senza frasi nel
catalogo la schermata mostra un messaggio al posto dell'esercizio; quando
invece le frasi ci sono ma Sara le ha tolte tutte, il messaggio dice che
sono state tolte tutte dagli esercizi.

La logica del ciclo, senza interfaccia, è `creaCiclo()` in
`src/esercizi/ciclo.ts`; il componente della rotta `#/esercizi` è
`src/views/EserciziView.vue`, che mostra la fase corrente del ciclo e gli
inoltra le azioni. La riga dell'importanza con la sua conferma è
il componente `src/components/RigaImportanza.vue`, condiviso con la
schermata Vocaboli, che mostra ed emette soltanto: l'importanza e la
conferma aperta le tiene il ciclo.

Il perché di queste scelte è nel documento di feature
[`.claude/domain/features/esercizi-traduzione.md`](.claude/domain/features/esercizi-traduzione.md).

## Vocaboli

La schermata Vocaboli propone parole italiane, mescolate tra tutte le
lezioni, da tradurre in inglese. Qui l'esito lo decide l'app: la risposta è
giusta se coincide con una delle traduzioni elencate in `en`, dopo aver
normalizzato entrambe le parti allo stesso modo — senza badare a maiuscole,
spazi superflui, apostrofi tipografici e punteggiatura finale. Poi Sara
vede l'esito, la sua risposta, la traduzione principale, le altre accettate
e il titolo della lezione, e con "Avanti" passa al vocabolo successivo. Ogni
vocabolo lo sceglie la sessione di ripasso di tipo `'vocaboli'`, che
registra anche l'esito; a ogni ingresso nella schermata si apre una sessione
nuova. Senza vocaboli nel catalogo la schermata mostra un messaggio al posto
dell'allenamento.

La logica sta in `src/vocaboli/`: la verifica con la normalizzazione è
`verifica()` in `src/vocaboli/verifica.ts`, unico punto in cui vive la
regola di confronto, e il ciclo senza interfaccia è `creaCiclo()` in
`src/vocaboli/ciclo.ts`. Il componente della rotta `#/vocaboli` è
`src/views/VocaboliView.vue`, che mostra la fase corrente del ciclo e gli
inoltra le azioni.

Il perché di queste scelte è nel documento di feature
[`.claude/domain/features/allenamento-vocaboli.md`](.claude/domain/features/allenamento-vocaboli.md).

## Dizionario

La schermata Dizionario elenca tutti i vocaboli di tutte le lezioni, in
ordine alfabetico italiano della parola `it`, ognuno con la traduzione
principale e le altre traduzioni accettate. Il campo di ricerca in cima
filtra la lista mentre Sara scrive, cercando sia nell'italiano sia nelle
traduzioni inglesi, senza distinguere maiuscole e accenti. È solo
consultazione: non usa i progressi e non registra nulla. Senza vocaboli nel
catalogo la schermata mostra un messaggio al posto di campo e lista; una
ricerca che non trova nulla lo dice sotto il campo.

La logica, senza interfaccia, sta in `src/dizionario/`: `voci()` in
`voci.ts` ordina i vocaboli del catalogo e `filtra()` in `filtro.ts` è
l'unico punto in cui vive la regola di ricerca, diversa dalla verifica della
risposta dell'allenamento vocaboli. Il componente della rotta `#/dizionario`
è `src/views/DizionarioView.vue`.

Il perché di queste scelte è nel documento di feature
[`.claude/domain/features/dizionario-vocaboli.md`](.claude/domain/features/dizionario-vocaboli.md).

## Grammatica

La schermata Grammatica, su `#/grammatica`, elenca le lezioni che hanno
schede, ognuna con i titoli delle sue schede; toccandone una si apre la
pagina della lezione su `#/grammatica/<id-lezione>`, con tutte le sue schede
una sotto l'altra. È solo lettura: non usa i progressi e non registra nulla.
Senza schede nel catalogo, o per una lezione che non esiste o non ne ha, la
schermata mostra un messaggio al posto delle schede.

Il testo di ogni scheda è Markdown, convertito in HTML con `markdown-it`
senza HTML grezzo: un tag scritto nel file resta testo. La logica, senza
interfaccia, sta in `src/grammatica/`: `elenco()` in `elenco.ts` sceglie e
ordina le lezioni con schede e `html()` in `markdown.ts` è l'unico punto in
cui il Markdown diventa HTML. I componenti delle due rotte sono
`src/views/GrammaticaView.vue` e `src/views/GrammaticaLezioneView.vue`.

Il perché di queste scelte è nel documento di feature
[`.claude/domain/features/schede-grammatica.md`](.claude/domain/features/schede-grammatica.md).

## Pubblicazione

Ogni push su `main` avvia la GitHub Action `.github/workflows/deploy.yml`,
che controlla i tipi, esegue i test, compila le due edizioni e pubblica
`dist/`, con l'edizione kids in `dist/kids/`, su GitHub Pages. Se uno di questi passaggi fallisce, il sito resta alla versione
precedente.

La pubblicazione richiede una configurazione manuale, una volta sola, nelle
impostazioni Pages del repository:

- sorgente: **GitHub Actions**;
- dominio personalizzato: `maies.chosko.com` (il record DNS CNAME punta già
  a GitHub Pages);
- **Enforce HTTPS** attivo.

Il perché di queste scelte è nel documento di feature
[`.claude/domain/features/scheletro-e-pubblicazione.md`](.claude/domain/features/scheletro-e-pubblicazione.md).
