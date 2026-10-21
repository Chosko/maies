# Titolo della schermata su computer

## Goal
Sul layout da computer (≥768px) il titolo condiviso delle schermate,
`.titolo-schermata`, segue la tavola `EserciziComputer.dc.html`: 24px su
32px, peso 500, allineato a sinistra. Vale per ogni schermata che usa la
classe; il telefono resta 19px su 28px, centrato.

## Acceptance criteria
- `src/styles/computer.css`, dentro l'unico blocco `@media (min-width: 768px)`,
  ha una regola `.titolo-schermata` con `text-align: left`.
- Quella regola dà un `font-size` che, risolti i token, vale 24px e un
  `line-height` che vale 32px, scritti solo con variabili dei token.
- La regola di telefono in `src/styles/base.css` resta invariata (centrata,
  stile `screen-title`).
- Un test in `tests/tokens.test.ts` verifica i tre punti sopra; la suite
  intera passa, comprese le regole sui valori scritti a mano.

## Decisions
- Nessun token vale 24px come dimensione di testo: si deriva il valore esatto
  dallo stile `screen-title`, `calc(var(--type-screen-title-size) * 24 / 19)`
  e `calc(var(--type-screen-title-line) + var(--space-1))`, come già fa
  `.esercizio-frase` su computer, invece di approssimarlo con `sentence`
  (25px/34px).
- Le altre tavole in `design/schermate/` sono da telefono; l'unica tavola da
  computer è `EserciziComputer.dc.html`, quindi non ci sono tavole in
  disaccordo.

## Hints
- `src/styles/computer.css` (blocco degli elementi condivisi)
- `src/styles/base.css` (`.titolo-schermata`, regola di telefono)
- `tests/tokens.test.ts` (blocco "stylesheets")
- `design/schermate/EserciziComputer.dc.html` (l'`h1` "Esercizi")

## Drift
- `design/design-system.md` § Tipografia — diverges: dice che il titolo della
  schermata fa eccezione all'allineamento a sinistra, senza distinguere
  telefono e computer; su computer il titolo è ora a sinistra come nella
  tavola (le tavole prevalgono sul design system).
- `design/tokens.json` § type `screen-title` — diverges: l'uso dice "centrato
  in cima" senza la variante da computer, che è 24px/32px a sinistra.
