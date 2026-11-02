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
| `npm run domanda-a-sorpresa` | Invia una domanda a sorpresa al canale ntfy della variabile `NTFY_TOPIC`; senza la variabile non invia nulla. |

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

Oltre alla traduzione, ogni elemento può portare un aiuto per chi ripassa,
facoltativo: una frase ha `hint`, l'aiuto in italiano mostrato prima di
rispondere, con le parole chiave o il tempo verbale ma mai la traduzione
intera (il test di validità rifiuta un `hint` uguale a `en` o a una delle
`alternatives`); un vocabolo ha `example`, una breve frase d'esempio in inglese, e
per le parole difficili `mnemonic`, un trucco in italiano per ricordarlo.
Chiesta in chat, la skill completa con questi campi le frasi e i vocaboli
delle lezioni già scritte che non li hanno, senza cambiarne gli id.

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

Frasi e vocaboli si ripassano con un gruppo di lavoro per tipo: **5 frasi**
e **8 vocaboli**, su cui Sara si allena finché ogni elemento non è
imparato. Un elemento del gruppo è imparato alla terza risposta giusta di
fila; una risposta sbagliata riporta la serie a zero. Il posto liberato si
riempie prima con gli elementi da riprendere, poi con i nuovi; a parità,
prima quelli d'importanza più alta, poi della lezione più recente, poi
nell'ordine del file della lezione.

Un elemento imparato torna per un controllo dopo un intervallo di giorni
che cresce a ogni controllo giusto — 1, 3, 7, 14 e poi 30 giorni —
moltiplicato dall'importanza (1 raddoppia l'intervallo, 3 lo dimezza); un
controllo sbagliato lo fa rientrare subito nel gruppo. Quando ci sono
controlli scaduti, la sessione ne alterna uno a un elemento del gruppo;
quando tutto è imparato e nessun controllo è scaduto, ripropone l'elemento
imparato visto meno di recente. La sessione non ripropone uno degli
ultimi tre elementi proposti, se c'è altro da proporre. L'importanza 0 toglie l'elemento dal
ripasso.

I progressi stanno nel `localStorage` del dispositivo, sotto la chiave
dell'edizione (`maies.progressi` o `maies.kids.progressi`), nel formato
`{ versione: 3, elementi: { [idGlobale]: { stato?, importanza? } } }`:
`stato` è lo stato di apprendimento con i suoi dati (la serie nel gruppo,
oppure gradino, data del prossimo controllo e data dell'ultima volta per un
imparato), e ogni campo manca quando vale il valore iniziale ("nuovo",
importanza 2). I progressi salvati nel formato precedente a tre livelli si
convertono alla lettura — "da ripassare" diventa da riprendere,
"consolidato" diventa imparato con il controllo oggi, "normale" diventa
nuovo — e la prima registrazione li riscrive nel formato nuovo. I progressi
non si sincronizzano tra dispositivi e in navigazione privata vanno persi
alla chiusura; se il browser non permette di leggerli, l'app lavora solo in
memoria.

Esercizi e vocaboli scelgono il prossimo elemento dalla sessione di ripasso
in `src/ripasso/`: `creaSessione('frasi')` o `creaSessione('vocaboli')`
propone un elemento con `prossimoElemento()`, ne registra l'esito con
`registraEsito(idGlobale, esito)` e l'importanza con
`registraImportanza(idGlobale, importanza)`. Gli stati e le transizioni
sono in `apprendimento.ts`, il gruppo e la scelta del prossimo elemento in
`pianificatore.ts`, il formato salvato e la conversione in `archivio.ts`.
Tutte le sessioni dell'app condividono un solo archivio dei progressi.

Il gruppo di lavoro, i controlli, l'importanza e il perché sono nel
documento di feature
[`.claude/domain/features/ripetizione-errori.md`](.claude/domain/features/ripetizione-errori.md).

## Esercizi

La schermata Esercizi propone frasi italiane, mescolate tra tutte le
lezioni, da tradurre in inglese. Prima di rispondere, per una frase che ha
un aiuto, Sara può toccare il pulsante "Aiuto" sotto la frase: il pulsante
lascia il posto al testo dell'aiuto, il fuoco torna nel campo e l'esito non
cambia; ogni frase nuova riparte con l'aiuto nascosto, e per una frase senza
aiuto il pulsante non compare. Sara scrive la traduzione e la conferma,
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
vede l'esito, la sua risposta, la traduzione principale, le altre accettate,
il titolo della lezione e, quando il vocabolo li ha, la frase d'esempio
("Esempio") e il trucco per ricordarlo ("Trucco per ricordare"), in un testo
secondario; un vocabolo che non li ha li omette, senza spazi vuoti.

Accanto alla traduzione principale e alla frase d'esempio un pulsante con
l'altoparlante ne fa sentire la pronuncia, letta dalla sintesi vocale del
browser con una voce inglese britannica o, se manca, con un'altra voce
inglese; ogni lettura interrompe quella in corso. Senza sintesi vocale o
senza voci inglesi i pulsanti non compaiono, e compaiono da soli quando il
browser carica le voci dopo l'apertura della pagina; una lettura che
fallisce non mostra errori.

Dopo una risposta giusta Sara passa al vocabolo successivo con "Avanti".
Dopo una risposta sbagliata, sotto le traduzioni, deve prima riscrivere la
traduzione nel campo "Riscrivi la traduzione" e premere "Controlla", che
prende il posto di "Avanti": la riscrittura passa con la stessa verifica
della risposta; se non passa il campo resta com'è, con l'avviso "Non è
ancora giusta: riprova.", e se passa compare "Avanti". La riscrittura è solo
un esercizio di memoria: l'esito registrato resta quello della risposta.

Nell'edizione principale l'esito mostra anche, sotto il pulsante,
l'importanza del vocabolo, da 0 a 3, partendo da quella attuale, già durante
la riscrittura: 1, 2 e 3 si registrano subito, mentre lo 0 chiede prima una
conferma ("Togli" o "Annulla"), durante la quale "Avanti" non ha effetto, e,
confermato, toglie il vocabolo dall'allenamento e passa al successivo, anche
senza riscrittura; l'esito della risposta resta quello già registrato.
L'edizione kids non mostra l'importanza. Ogni vocabolo lo sceglie la
sessione di ripasso di tipo `'vocaboli'`, che registra anche l'esito e
l'importanza; a ogni ingresso nella schermata si apre una sessione nuova.
Senza vocaboli nel catalogo la schermata mostra un messaggio al posto
dell'allenamento; quando invece i vocaboli ci sono ma Sara li ha tolti
tutti, il messaggio dice che sono stati tolti tutti dall'allenamento.

L'indirizzo `#/vocaboli?parola=<id globale>` apre l'allenamento con quel
vocabolo come prima domanda, in entrambe le edizioni; dopo la prima domanda
l'allenamento continua come sempre. È l'indirizzo che apre la
[domanda a sorpresa](#domanda-a-sorpresa). La schermata legge il parametro
una volta all'ingresso e lo toglie dall'indirizzo senza aggiungere una voce
alla cronologia, così ricaricare la pagina non ripropone la stessa parola.
Un id sconosciuto, di un vocabolo eliminato o di uno tolto dall'allenamento
non è un errore: l'allenamento parte dal vocabolo che sceglie la sessione,
senza messaggi.

La logica sta in `src/vocaboli/`: la verifica con la normalizzazione è
`verifica()` in `src/vocaboli/verifica.ts`, unico punto in cui vive la
regola di confronto, usata sia per la risposta sia per la riscrittura; il
ciclo senza interfaccia, con la fase di riscrittura, è `creaCiclo()` in
`src/vocaboli/ciclo.ts`; la lettura della pronuncia e la scelta della voce
sono `creaPronuncia()` in `src/vocaboli/pronuncia.ts`. Il componente della
rotta `#/vocaboli` è `src/views/VocaboliView.vue`, che passa il parametro
`parola` all'avvio del ciclo come parola iniziale, mostra la fase corrente
del ciclo e gli inoltra le azioni, mostra i pulsanti della
pronuncia solo quando c'è una voce inglese, e mostra la riga
dell'importanza — il componente `src/components/RigaImportanza.vue`,
condiviso con la schermata Esercizi — solo quando l'edizione
(`src/edizione.ts`) è la principale.

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

## Domanda a sorpresa

Tre volte al giorno una notifica sul telefono di Sara le chiede come si dice
in inglese un vocabolo italiano: "Come si dice «cane»?". Toccandola si apre
l'allenamento vocaboli con quella parola come prima domanda, all'indirizzo
`https://maies.chosko.com/#/vocaboli?parola=<id globale>`. Il vocabolo viene
dalle lezioni dell'edizione principale: quelli delle tre lezioni più recenti
pesano 3, gli altri 1. Nessuno stato passa da una domanda all'altra e i
progressi non contano, perché restano nel browser; l'edizione kids non ha
notifiche.

Lo script `scripts/domanda-a-sorpresa.mjs`, avviato con
`npm run domanda-a-sorpresa`, legge i file di `contenuti/lezioni/` con
`node:fs`, sceglie il vocabolo e pubblica la notifica con una sola richiesta
a `https://ntfy.sh/<canale>`, dove il canale è la variabile d'ambiente
`NTFY_TOPIC`. Senza la variabile o senza vocaboli non pubblica nulla e
termina senza errore, scrivendo il motivo nel log; se ntfy.sh risponde con
un errore o non risponde, termina con errore. Il nome del canale non
compare mai nel log né nel repository. Lo script esporta le funzioni pure
della scelta e dell'invio, provate da `tests/domanda-a-sorpresa.test.ts`.

Lo esegue una GitHub Action separata dalla pubblicazione, alle 09:17, 13:47
e 18:23 UTC — fra le 9 e le 21 in Italia sia con l'ora solare sia con quella
legale — e anche a mano; ha permessi di sola lettura, non pubblica il sito e
gira solo sul branch principale. GitHub può ritardare un'esecuzione
pianificata di qualche minuto, e una domanda non inviata per un errore di
ntfy.sh si perde, mentre le successive partono normalmente. Il repository
ne tiene il modello in `scripts/domanda-a-sorpresa.workflow.yml`, verificato
da `tests/domanda-a-sorpresa-workflow.test.ts`: il file attivo
`.github/workflows/domanda-a-sorpresa.yml` lo crea a mano una persona,
perché Claude non può scrivere in `.github/workflows/`.

L'attivazione richiede tre passi manuali, una volta sola, dopo che il
modello è sul branch principale:

1. Dalla pagina web del repository, creare sul branch principale il file
   `.github/workflows/domanda-a-sorpresa.yml` con il contenuto di
   `scripts/domanda-a-sorpresa.workflow.yml`. Ogni modifica successiva del
   modello va copiata allo stesso modo.
2. Nelle impostazioni del repository, creare il segreto `NTFY_TOPIC` con un
   nome di canale lungo e casuale.
3. Sul telefono di Sara, installare l'app ntfy e iscriversi a quel canale
   sul server `ntfy.sh`.

Un'esecuzione manuale della GitHub Action, dalla scheda Actions, verifica
che la notifica arrivi.

Il perché di queste scelte è nel documento di feature
[`.claude/domain/features/domanda-a-sorpresa.md`](.claude/domain/features/domanda-a-sorpresa.md).
