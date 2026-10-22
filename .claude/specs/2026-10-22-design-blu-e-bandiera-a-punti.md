# Design blu e bandiera a punti

## Goal
Allineare l'app al design aggiornato negli artifact "maies" (design system) e
"maies UI" (canvas): palette blu della bandiera, carte di elenco con un
gradiente più quieto, carta rossa per l'esito Sbagliata dei vocaboli, la
bandiera a punti in basso a destra di ogni schermata e l'icona dell'app come
favicon e icona della schermata home. La copia del design in `design/` torna
identica agli artifact.

## Acceptance criteria
- `design/tokens.json`, `design/design-system.md` e le dieci
  `design/schermate/*.dc.html` sono le copie degli artifact; `design/README.md`
  non dice più che la copia toglie la bandiera e nomina i file dell'icona.
- I colori arrivano tutti dai token: nessun colore scritto a mano nei fogli di
  stile, come oggi.
- La lista del dizionario usa il gradiente a 180° da `card-list-top` a `peek`
  (40%) a `card-end`; le carte dell'elenco di grammatica il gradiente a 165°
  da `card-list-top` a `peek` (55%) a `card-end`.
- La carta dell'esito Sbagliata dei vocaboli ha il gradiente a 165° da
  `wrong-top` a `wrong-mid` (45%) a `wrong-end`, bordo `wrong-line`, divisore
  `wrong-divider`, etichette `wrong-label` e titolo della lezione
  `wrong-lesson`; l'esito Giusta resta sulla carta blu.
- Ogni schermata ha dentro `.fondo` un solo `svg.bandiera` decorativo
  (`aria-hidden`), sotto il contenuto e senza intercettare il puntatore: tre
  tracciati di puntini — fondo `flag-blue` al 35%, diagonali `flag-white` al
  40%, croce `flag-red` al 60% — con la geometria delle schermate (griglia di
  8px, raggio fino a 2,2px al centro del frammento, che rimpiccioliscono
  verso il centro dello schermo). Sul telefono copre la schermata da 390×844
  ancorata in basso a destra; su computer sta nell'angolo in basso a destra,
  alta il 75% della pagina.
- `index.html` dichiara `maies-icona.svg` come favicon e
  `maies-icona-512.png` come `apple-touch-icon`; i due file sono in `public/`
  e la build li serve in tutte e due le edizioni.

## Decisions
- **La bandiera torna, a puntini:** il nuovo design la reintroduce
  ("sfondo a punti" nell'ultima modifica del design system) e supera la
  rimozione della bandiera a linee; il test che la vietava diventa il test
  che la richiede.
- **I puntini si calcolano una volta**, in un componente come il vecchio
  `FondoBandiera`, con lo stesso algoritmo delle schermate `.dc.html`.

## Hints
- Artifact già scaricati in
  `/tmp/claude-0/-home-user-maies/9cd5f9be-c7e8-5056-86ba-08993a33c638/scratchpad/ds`
  e `.../canvas`; asset dell'icona: blob `c197e07444e46be862a9d84cf3db2548`
  (svg) e `005775cfb7226a0d40f670cf8c889f25` (png) del design system.
- `design/` (tutti i file), `public/maies-icona.svg`, `public/maies-icona-512.png`, `index.html`
- `src/App.vue`, `src/components/FondoBandiera.vue` (nuovo; il vecchio è in `git show 3644d4d^:src/components/FondoBandiera.vue`)
- `src/styles/elements.css`, `src/styles/computer.css`
- `tests/tokens.test.ts`, `tests/navbar.test.ts`, `tests/fondo-bandiera.test.ts` (nuovo), `tests/vocaboli.test.ts`

## Drift
- `design/README.md` — diverges: dice che `design-system.md` e `tokens.json`
  sono senza la bandiera e i token `flag-*`; aggiornato in questa modifica.
- `.claude/context/styles-tokens.md` § Internal patterns («No background
  flag») — diverges: i fogli di stile tornano a usare `.bandiera` e
  `--color-flag-*`.
- `.claude/context/app-shell.md` § Overview («with no flag») — diverges: il
  fondo contiene la bandiera a punti.
- `.claude/context/build-test-deploy.md` § Overview (`index.html`) — settles:
  `index.html` carica anche favicon e icona della schermata home da `public/`.
