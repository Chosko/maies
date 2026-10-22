# Versione kids del sito

## Goal
Una seconda copia del sito, per la figlia di Sara, all'indirizzo
`maies.chosko.com/kids/`. È lo stesso codice compilato una seconda volta in
modalità `kids`: legge le lezioni da `contenuti/kids/` (liste di soli
vocaboli), mostra solo Vocaboli e Dizionario e salva i progressi in una chiave
di `localStorage` separata, perché le due copie stanno sullo stesso dominio e
gli id delle lezioni si sovrappongono. Nessun login: ognuna usa il proprio
dispositivo e il proprio indirizzo.

## Acceptance criteria
- `src/edizione.ts` espone il tipo `Edizione` (`'principale' | 'kids'`),
  la costante `EDIZIONE`, che vale `'kids'` solo quando la modalità di Vite è
  `kids`, e `chiaveProgressi(edizione)`: `maies.progressi` per la principale,
  `maies.kids.progressi` per i kids.
- `creaArchivio()` accetta la chiave come secondo parametro, con predefinita
  `chiaveProgressi(EDIZIONE)`, e legge e scrive solo quella chiave.
- `createAppRouter(edizione = EDIZIONE)`: per la principale le rotte restano
  identiche; per i kids esistono solo `vocaboli` e `dizionario`, e `/`,
  `/esercizi`, `/grammatica` e ogni indirizzo sconosciuto portano a
  `/vocaboli`.
- La barra di navigazione mostra solo le voci che hanno una rotta nel router:
  quattro voci nella principale, Vocaboli e Dizionario nei kids.
- `vite.config.ts` in modalità `kids` usa `base: '/kids/'`, compila in
  `dist/kids` e risolve l'alias `@lezioni` in `contenuti/kids`; nelle altre
  modalità `@lezioni` è `contenuti/lezioni` e il resto è invariato.
- Il catalogo legge `@lezioni/*.json`; una cartella assente dà zero lezioni.
- `npm run build` compila tutte e due le versioni: la principale in `dist/` e
  la kids in `dist/kids/`. La pipeline di pubblicazione resta invariata e
  pubblica entrambe.
- Il test di validità controlla `contenuti/lezioni/` e `contenuti/kids/`, ogni
  cartella per conto suo: i vincoli tra file valgono dentro la cartella, non
  tra le due.
- La skill `aggiunta-materiale` dice che il materiale indicato come per i kids
  va in `contenuti/kids/`, con il procedimento del vocabolo e della lista di
  vocaboli applicato a quella cartella, e lo nomina nella descrizione.
- `README.md` descrive le due versioni: indirizzo, cartella dei contenuti,
  chiave dei progressi e comando di build.

## Decisions
- **Seconda copia, non profili né login:** dispositivi separati, quindi
  ognuna apre il proprio indirizzo; nessuna protezione del materiale.
- **Modalità di Vite `kids`** come unico interruttore: alias, base, cartella
  di uscita e `EDIZIONE` derivano tutti da quella.
- **Le voci della barra derivano dalle rotte**, così router e barra non
  possono divergere.
- **Lezioni kids di soli vocaboli**, nel formato esistente (frasi e schede
  vuote); direzione invariata, italiano → inglese.
- Il nome nella barra resta «maies» in tutte e due le versioni.

## Hints
- `src/edizione.ts` (nuovo), `tests/edizione.test.ts` (nuovo)
- `src/ripasso/archivio.ts`, `tests/archivio.test.ts`
- `src/router/index.ts`, `tests/router.test.ts`
- `src/components/NavBar.vue`, `tests/navbar.test.ts`
- `src/contenuti/catalogo.ts`
- `vite.config.ts`, `tests/vite-config.test.ts` (nuovo), `package.json`
- `tests/contenuti.test.ts`
- `.claude/skills/aggiunta-materiale/SKILL.md`, `tests/skill-aggiunta-materiale.test.ts`
- `README.md`

## Drift
- `.claude/domain/product-design.md` § Design decisions — diverges: «Uso
  personale. Una sola utente: niente account, login, condivisione o gestione
  di più persone»; la modifica aggiunge una seconda utente con una propria
  copia del sito (senza account né login). Owner: `/product-design`.
- `.claude/domain/product-design.md` § utenti (riga «Una sola utente: Sara») —
  diverges: c'è una seconda utente, la figlia, con solo vocaboli.
- `.claude/domain/features/scheletro-e-pubblicazione.md` § Architecture
  (barra «con le quattro voci») e § Interfaces and contracts (`#/` e ogni
  indirizzo sconosciuto agli Esercizi; sito alla radice `/` del dominio) —
  diverges: la versione kids ha due voci, porta a Vocaboli e sta sotto
  `/kids/`; la build produce due versioni. Owner: `/architect`.
- `.claude/domain/features/aggiunta-materiale-lezione.md` § Architecture
  (file di lezione in `contenuti/lezioni/`, unica fonte) e § Procedimento di
  Claude — diverges: c'è una seconda cartella `contenuti/kids/` con il suo
  catalogo e il suo test; settles: le lezioni kids usano il formato esistente
  con frasi e schede vuote. Owner: `/architect`.
- `.claude/domain/features/ripetizione-errori.md` § Data and state («Una sola
  chiave di `localStorage`») — diverges: la versione kids usa la chiave
  `maies.kids.progressi`. Owner: `/architect`.
- `.claude/context/contenuti.md`, `ripasso.md`, `app-shell.md`,
  `build-test-deploy.md` — diverges: descrivono una sola cartella, una sola
  chiave, quattro voci fisse e una sola build.
- `README.md` — aggiornato in questa modifica.
