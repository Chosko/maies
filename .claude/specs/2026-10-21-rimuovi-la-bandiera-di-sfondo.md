# Rimuovi la bandiera di sfondo

## Goal
Togliere la bandiera di sfondo — la Union Jack disegnata a linee sottili
dietro la metà bassa di ogni schermata, con il suo bagliore `flag-glow` — su
telefono e su computer, come chiesto da Sara in chat. Il fondo con il
bagliore radiale dall'alto (`glow`, `glow-mid`, `ground`) e tutto il resto
restano come sono.

## Acceptance criteria
- Nessuna schermata, su nessuna rotta, rende un `svg.bandiera`: l'app mostra
  la barra di navigazione e la schermata dentro un solo `div.fondo`, senza
  bandiera.
- `src/components/FondoBandiera.vue` non esiste più; `src/App.vue` avvolge
  `NavBar` e `RouterView` direttamente in `<div class="fondo">`.
- `src/styles/elements.css` e `src/styles/computer.css` non hanno più regole
  `.bandiera*` né riferimenti a `--color-flag-*`; le regole di `.fondo`
  (gradiente radiale compreso, su telefono e su computer) restano invariate,
  tranne il commento che parlava della bandiera.
- I test "placeholder screens" di `tests/tokens.test.ts` e "application
  shell" di `tests/navbar.test.ts` verificano che la bandiera sia assente e
  che la schermata stia nel fondo dentro una `main .carta` / con la barra.
- Suite completa, `npm run typecheck` e `npm run build` passano.

## Decisions
- **Richiesta esplicita contro il design (decisione di Sara, 2026-10-21):**
  le schermate di `design/schermate/*.dc.html`, `design/design-system.md`
  § Fondamenta visive "La bandiera a linee" e i token `flag-*` di
  `design/tokens.json` mostrano ancora la bandiera; la richiesta li supera.
  `design/` è la copia di un artifact esterno e non si tocca qui: verrà
  aggiornato l'artifact e ricopiato.
- Le variabili `--color-flag-red|white|blue|glow` restano generate da
  `src/styles/tokens.ts`, perché nascono da `design/tokens.json` e il test
  "declares every token of design/tokens.json" richiede una variabile per
  ogni token; nessun foglio di stile le usa più. Spariscono da sole quando la
  copia del design non avrà più quei token.
- `.fondo` diventa markup diretto in `App.vue`, senza un componente
  dedicato: senza bandiera il componente non avrebbe altro che un `div`.

## Hints
- `src/components/FondoBandiera.vue` (da eliminare)
- `src/App.vue` (radice dell'app)
- `src/styles/elements.css` (blocchi `.fondo` e `.bandiera*`)
- `src/styles/computer.css` (`.bandiera` nel blocco 768px)
- `tests/tokens.test.ts` ("placeholder screens")
- `tests/navbar.test.ts` ("application shell")

## Drift
- `.claude/domain/features/scheletro-e-pubblicazione.md` § Architecture
  (Stile di base) — diverges: elenca fra gli elementi comuni il "fondo con
  bagliore e bandiera a linee"; il fondo resta con il solo bagliore.
- `.claude/context/app-shell.md` § Overview, § Public API, § Internal
  patterns, § Cross-references, § When to read the source — diverges:
  descrive `FondoBandiera.vue`, `svg.bandiera`, `generaBandiera()` e i test
  che controllano la bandiera; il componente non esiste più.
- `.claude/context/styles-tokens.md` § Overview — diverges: elenca
  `.bandiera*` (flag) fra le classi di `elements.css`.
- `.claude/context/INDEX.md` § Context files — diverges: la riga di
  `app-shell.md` cita il "flag background".
- `design/design-system.md` § Fondamenta visive "La bandiera a linee",
  `design/tokens.json` (`flag-*`), `design/schermate/*.dc.html` — diverges:
  mostrano la bandiera; non si modificano qui (decisione sopra), si
  aggiornano ricopiando l'artifact del design.
