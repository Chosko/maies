# Tasks

Last task number: 27

---

## 1. Creare il progetto Vue con router e schermate segnaposto

Status: [DONE]
Target: claude
Files: package.json, package-lock.json, .gitignore, index.html, vite.config.ts, tsconfig.json, src/main.ts, src/App.vue, src/router/index.ts, src/views/EserciziView.vue, src/views/VocaboliView.vue, src/views/DizionarioView.vue, src/views/GrammaticaView.vue, tests/router.test.ts
Preconditions: none
Feature: scheletro-e-pubblicazione

---

## 2. Stile di base generato dai token del design

Status: [DONE]
Target: claude
Files: src/styles/, src/main.ts, index.html, src/views/*.vue, tests/tokens.test.ts
Preconditions: 1
Feature: scheletro-e-pubblicazione

---

## 3. Barra di navigazione e layout responsivo del guscio

Status: [DONE]
Target: claude
Files: src/App.vue, src/components/NavBar.vue, src/styles/, tests/navbar.test.ts
Preconditions: 1, 2
Feature: scheletro-e-pubblicazione

---

## 4. Pubblicazione automatica su GitHub Pages

Status: [MISSING]
Target: claude+human
Files: .github/workflows/deploy.yml, package.json
Preconditions: 1
Feature: scheletro-e-pubblicazione

---

## 5. Update documentation for feature `scheletro-e-pubblicazione`

Status: [MISSING]
Target: claude
Files: README.md
Preconditions: 1, 2, 3, 4
Feature: scheletro-e-pubblicazione

---

## 6. Schema delle lezioni e test di validità dei contenuti

Status: [MISSING]
Target: claude
Files: package.json, package-lock.json, src/contenuti/schema.ts, src/contenuti/validazione.ts, tests/validazione.test.ts, tests/contenuti.test.ts
Preconditions: 1
Feature: aggiunta-materiale-lezione

---

## 7. Catalogo dei contenuti in sola lettura

Status: [MISSING]
Target: claude
Files: src/contenuti/catalogo.ts, tests/catalogo.test.ts
Preconditions: 1, 6
Feature: aggiunta-materiale-lezione

---

## 8. Skill di progetto per aggiungere il materiale di una lezione

Status: [MISSING]
Target: claude
Files: .claude/skills/aggiunta-materiale/SKILL.md
Preconditions: 6
Feature: aggiunta-materiale-lezione

---

## 9. Update documentation for feature `aggiunta-materiale-lezione`

Status: [MISSING]
Target: claude
Files: README.md
Preconditions: 6, 7, 8
Feature: aggiunta-materiale-lezione

---

## 10. Livelli e archivio dei progressi nel browser

Status: [MISSING]
Target: claude
Files: src/ripasso/livelli.ts, src/ripasso/archivio.ts, tests/livelli.test.ts, tests/archivio.test.ts
Preconditions: 1
Feature: ripetizione-errori

---

## 11. Selettore pesato del prossimo elemento

Status: [MISSING]
Target: claude
Files: src/ripasso/selettore.ts, tests/selettore.test.ts
Preconditions: 10
Feature: ripetizione-errori

---

## 12. Sessione di ripasso per frasi e vocaboli

Status: [MISSING]
Target: claude
Files: src/ripasso/sessione.ts, tests/sessione.test.ts
Preconditions: 7, 10, 11
Feature: ripetizione-errori

---

## 13. Update documentation for feature `ripetizione-errori`

Status: [MISSING]
Target: claude
Files: README.md
Preconditions: 10, 11, 12
Feature: ripetizione-errori

---

## 14. Ciclo dell'esercizio di traduzione

Status: [MISSING]
Target: claude
Files: src/esercizi/ciclo.ts, tests/ciclo-esercizi.test.ts
Preconditions: 7, 12
Feature: esercizi-traduzione

---

## 15. Schermata Esercizi al posto del segnaposto

Status: [MISSING]
Target: claude
Files: src/views/EserciziView.vue, tests/esercizi.test.ts, tests/router.test.ts
Preconditions: 2, 3, 14
Feature: esercizi-traduzione

---

## 16. Update documentation for feature `esercizi-traduzione`

Status: [MISSING]
Target: claude
Files: README.md
Preconditions: 14, 15
Feature: esercizi-traduzione

---

## 17. Verifica della risposta con normalizzazione

Status: [MISSING]
Target: claude
Files: src/vocaboli/verifica.ts, tests/verifica.test.ts
Preconditions: 1
Feature: allenamento-vocaboli

---

## 18. Ciclo dell'allenamento vocaboli

Status: [MISSING]
Target: claude
Files: src/vocaboli/ciclo.ts, tests/ciclo-vocaboli.test.ts
Preconditions: 7, 12, 14, 17
Feature: allenamento-vocaboli

---

## 19. Schermata Vocaboli al posto del segnaposto

Status: [MISSING]
Target: claude
Files: src/views/VocaboliView.vue, tests/vocaboli.test.ts, tests/router.test.ts
Preconditions: 2, 3, 15, 18
Feature: allenamento-vocaboli

---

## 20. Update documentation for feature `allenamento-vocaboli`

Status: [MISSING]
Target: claude
Files: README.md
Preconditions: 17, 18, 19
Feature: allenamento-vocaboli

---

## 21. Voci ordinate e filtro di ricerca del dizionario

Status: [MISSING]
Target: claude
Files: src/dizionario/voci.ts, src/dizionario/filtro.ts, tests/voci.test.ts, tests/filtro.test.ts
Preconditions: 1, 7
Feature: dizionario-vocaboli

---

## 22. Schermata Dizionario al posto del segnaposto

Status: [MISSING]
Target: claude
Files: src/views/DizionarioView.vue, tests/dizionario.test.ts, tests/router.test.ts
Preconditions: 2, 3, 7, 15, 21
Feature: dizionario-vocaboli

---

## 23. Update documentation for feature `dizionario-vocaboli`

Status: [MISSING]
Target: claude
Files: README.md
Preconditions: 21, 22
Feature: dizionario-vocaboli

---

## 24. Elenco della grammatica e conversione del Markdown delle schede

Status: [MISSING]
Target: claude
Files: package.json, package-lock.json, src/grammatica/elenco.ts, src/grammatica/markdown.ts, tests/elenco-grammatica.test.ts, tests/markdown.test.ts
Preconditions: 1, 7
Feature: schede-grammatica

---

## 25. Schermata Grammatica con l'elenco delle lezioni al posto del segnaposto

Status: [MISSING]
Target: claude
Files: src/views/GrammaticaView.vue, tests/grammatica.test.ts, tests/router.test.ts
Preconditions: 2, 3, 7, 15, 24
Feature: schede-grammatica

---

## 26. Pagina della lezione con le schede e stile del testo

Status: [MISSING]
Target: claude
Files: src/views/GrammaticaLezioneView.vue, src/router/index.ts, src/styles/, tests/grammatica-lezione.test.ts, tests/router.test.ts
Preconditions: 2, 3, 7, 24, 25
Feature: schede-grammatica

---

## 27. Update documentation for feature `schede-grammatica`

Status: [MISSING]
Target: claude
Files: README.md
Preconditions: 24, 25, 26
Feature: schede-grammatica

---
