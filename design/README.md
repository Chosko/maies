# Design di maies

Copia nel repository del design approvato, da cui l'implementazione legge
l'aspetto dell'interfaccia senza aprire gli artifact originali:

- `design-system.md` e `tokens.json`: il design system "maies"
  (https://claude.ai/artifact/YQrPUSfie5TD46Qd6Kbavu).
- `schermate/*.dc.html`: le schermate confermate della canvas "maies UI"
  (https://claude.ai/artifact/VDTMJ6aAJBEhdUhAT2JxTQ), righe "Esercizi e
  vocaboli" e "Dizionario, grammatica e computer". Sono markup di
  riferimento in formato Claude Design: si leggono, non si eseguono.

| Schermata | File |
| --- | --- |
| Esercizi, domanda | `schermate/EserciziDomanda.dc.html` |
| Esercizi, nessun materiale | `schermate/EserciziVuoto.dc.html` |
| Esercizi su computer (soluzione mostrata) | `schermate/EserciziComputer.dc.html` |
| Vocaboli, domanda | `schermate/VocaboliDomanda.dc.html` |
| Vocaboli, esito giusto | `schermate/VocaboliGiusta.dc.html` |
| Vocaboli, esito sbagliato | `schermate/VocaboliSbagliata.dc.html` |
| Dizionario | `schermate/Dizionario.dc.html` |
| Dizionario, nessun risultato | `schermate/DizionarioRicerca.dc.html` |
| Grammatica, elenco | `schermate/GrammaticaElenco.dc.html` |
| Grammatica, lezione | `schermate/GrammaticaLezione.dc.html` |

Quando il design cambia negli artifact, questa cartella si aggiorna copiando
di nuovo i file.
