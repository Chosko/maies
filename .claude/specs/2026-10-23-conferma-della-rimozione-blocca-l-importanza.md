# Conferma della rimozione blocca l'importanza

## Goal
Negli esercizi di traduzione e nell'allenamento vocaboli, mentre la conferma
della rimozione (importanza 0) è aperta, Sara può solo rispondere "Togli" o
"Annulla": i pulsanti dell'importanza non hanno effetto, come già "Giusta",
"Sbagliata" e "Avanti". Decisione dell'utente.

## Acceptance criteria
- Nel ciclo degli esercizi, `impostaImportanza(1 | 2 | 3)` e
  `chiediRimozione()` non hanno effetto con la conferma della rimozione
  aperta: nessuna importanza registrata, valore nello stato invariato.
- Nel ciclo dei vocaboli vale lo stesso.
- `RigaImportanza` disabilita i pulsanti 0–3 mentre la conferma è aperta,
  così il blocco si vede; "Togli" e "Annulla" restano attivi.
- I test dei due cicli e del componente coprono questi casi; `npm test`,
  `npm run typecheck` e `npm run build` riescono.

## Decisions
- **I pulsanti sono disabilitati, non nascosti:** la riga resta visibile con
  il valore attuale, e il blocco vive anche nei cicli, così vale senza DOM.

## Hints
- src/esercizi/ciclo.ts, tests/ciclo-esercizi.test.ts
- src/vocaboli/ciclo.ts, tests/ciclo-vocaboli.test.ts
- src/components/RigaImportanza.vue, tests/riga-importanza.test.ts
- .claude/domain/features/esercizi-traduzione.md, .claude/domain/features/allenamento-vocaboli.md (§ Interfaces and contracts)

## Drift
- `.claude/domain/features/esercizi-traduzione.md` § Interfaces and contracts, Ciclo dell'esercizio — settles: "imposta importanza" e "chiedi rimozione" non hanno effetto con la conferma aperta (il documento blocca solo "segna").
- `.claude/domain/features/allenamento-vocaboli.md` § Interfaces and contracts, Ciclo dell'allenamento — settles: lo stesso per i vocaboli (il documento blocca solo "avanti").
- `.claude/context/schermate.md` § Public API — settles: le azioni sull'importanza sono inattive a conferma aperta; `RigaImportanza` disabilita i pulsanti.
