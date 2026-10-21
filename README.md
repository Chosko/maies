# maies

maies è un'applicazione personale per ripassare l'inglese studiato in un
corso a scuola: esercizi di traduzione, allenamento sui vocaboli, un
dizionario e schede di grammatica ricavati dal materiale delle lezioni. È
un sito statico in Vue, pubblicato su <https://maies.chosko.com>.

## Comandi

Dopo `npm install`:

| Comando | Cosa fa |
| --- | --- |
| `npm run dev` | Avvia il server di sviluppo di Vite. |
| `npm test` | Esegue i test con Vitest. |
| `npm run typecheck` | Controlla i tipi con `vue-tsc`. |
| `npm run build` | Compila il sito statico in `dist/`. |

## Contenuti

Il materiale di ripasso sta in `contenuti/lezioni/`, un file JSON per
lezione. Lo scrive solo Claude, con la skill di progetto
[`aggiunta-materiale`](.claude/skills/aggiunta-materiale/SKILL.md), quando
in chat arriva un PDF, una foto o un vocabolo. I PDF e le foto originali non
entrano mai nel repository, che è pubblico.

L'app legge le lezioni alla compilazione dal catalogo in sola lettura
`src/contenuti/catalogo.ts`. Lo schema zod `src/contenuti/schema.ts` è
l'unica definizione del formato: zod è una dipendenza di sviluppo e l'app
importa dallo schema solo tipi, cosa che un test verifica.

Il test di validità (`tests/contenuti.test.ts`) fa parte di `npm test`:
rilegge la cartella con `node:fs` a ogni esecuzione, quindi controlla subito
un file appena scritto, e un file malformato ferma la pubblicazione. I test
che leggono i file girano nell'ambiente `node` di Vitest, con i tipi di
`@types/node`.

Il formato dei file, gli identificatori stabili e il perché sono nel
documento di feature
[`.claude/domain/features/aggiunta-materiale-lezione.md`](.claude/domain/features/aggiunta-materiale-lezione.md).

## Progressi e ripasso

I progressi stanno nel `localStorage` del dispositivo, sotto la chiave
`maies.progressi`: un livello per ogni frase e vocabolo, indicizzato per id
globale. Non si sincronizzano tra dispositivi e in navigazione privata vanno
persi alla chiusura; se il browser non permette di leggerli, l'app lavora
solo in memoria.

Esercizi e vocaboli scelgono il prossimo elemento dalla sessione di ripasso
in `src/ripasso/`: `creaSessione('frasi')` o `creaSessione('vocaboli')`
propone un elemento con `prossimoElemento()` e ne registra l'esito con
`registraEsito(idGlobale, esito)`. Tutte le sessioni dell'app condividono un
solo archivio dei progressi.

L'algoritmo a tre livelli e il perché sono nel documento di feature
[`.claude/domain/features/ripetizione-errori.md`](.claude/domain/features/ripetizione-errori.md).

## Esercizi

La schermata Esercizi propone frasi italiane, mescolate tra tutte le
lezioni, da tradurre in inglese. Sara scrive la traduzione e la conferma,
poi vede la traduzione corretta, le varianti accettabili e il titolo della
lezione, e segna da sola se la risposta era giusta o sbagliata: l'app non
confronta la risposta con le traduzioni. Ogni frase la sceglie la sessione
di ripasso di tipo `'frasi'`, che registra anche l'esito; a ogni ingresso
nella schermata si apre una sessione nuova. Senza frasi nel catalogo la
schermata mostra un messaggio al posto dell'esercizio.

La logica del ciclo, senza interfaccia, è `creaCiclo()` in
`src/esercizi/ciclo.ts`; il componente della rotta `#/esercizi` è
`src/views/EserciziView.vue`, che mostra la fase corrente del ciclo e gli
inoltra le azioni.

Il perché di queste scelte è nel documento di feature
[`.claude/domain/features/esercizi-traduzione.md`](.claude/domain/features/esercizi-traduzione.md).

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

## Pubblicazione

Ogni push su `main` avvia la GitHub Action `.github/workflows/deploy.yml`,
che controlla i tipi, esegue i test, compila e pubblica `dist/` su GitHub
Pages. Se uno di questi passaggi fallisce, il sito resta alla versione
precedente.

La pubblicazione richiede una configurazione manuale, una volta sola, nelle
impostazioni Pages del repository:

- sorgente: **GitHub Actions**;
- dominio personalizzato: `maies.chosko.com` (il record DNS CNAME punta già
  a GitHub Pages);
- **Enforce HTTPS** attivo.

Il perché di queste scelte è nel documento di feature
[`.claude/domain/features/scheletro-e-pubblicazione.md`](.claude/domain/features/scheletro-e-pubblicazione.md).
