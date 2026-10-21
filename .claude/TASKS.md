# Tasks

Last task number: 9

---

## 1. Creare il progetto Vue con router e schermate segnaposto

Status: [MISSING]
Target: claude
Files: package.json, package-lock.json, .gitignore, index.html, vite.config.ts, tsconfig.json, src/main.ts, src/App.vue, src/router/index.ts, src/views/EserciziView.vue, src/views/VocaboliView.vue, src/views/DizionarioView.vue, src/views/GrammaticaView.vue, tests/router.test.ts
Preconditions: none
Feature: scheletro-e-pubblicazione

---

## 2. Stile di base generato dai token del design

Status: [MISSING]
Target: claude
Files: src/styles/, src/main.ts, index.html, src/views/*.vue, tests/tokens.test.ts
Preconditions: 1
Feature: scheletro-e-pubblicazione

---

## 3. Barra di navigazione e layout responsivo del guscio

Status: [MISSING]
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
