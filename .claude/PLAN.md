# Plan

Roadmap: none
Last reconciled: 2026-10-21

---

## Unscheduled

Features: scheletro-e-pubblicazione, aggiunta-materiale-lezione, ripetizione-errori, esercizi-traduzione, allenamento-vocaboli, dizionario-vocaboli, schede-grammatica

## Dependencies

- aggiunta-materiale-lezione: depends on scheletro-e-pubblicazione
- ripetizione-errori: depends on aggiunta-materiale-lezione, scheletro-e-pubblicazione
- esercizi-traduzione: depends on scheletro-e-pubblicazione, aggiunta-materiale-lezione, ripetizione-errori
- allenamento-vocaboli: depends on scheletro-e-pubblicazione, aggiunta-materiale-lezione, ripetizione-errori
- dizionario-vocaboli: depends on scheletro-e-pubblicazione, aggiunta-materiale-lezione
- schede-grammatica: depends on scheletro-e-pubblicazione, aggiunta-materiale-lezione
