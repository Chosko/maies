# Progresso /architect — importanza degli elementi

Riprogettazione di ripetizione-errori, esercizi-traduzione e
allenamento-vocaboli per aggiungere l'importanza 0–3 di frasi e vocaboli.

Coperto: forma proposta (dati, selettore, sessione, schermate). Mancano le
risposte alle domande aperte e la conferma dell'architettura.

Decisioni prese (dall'utente):
- Importanza 0–3, 2 iniziale; moltiplica il peso del livello: 0 esclude,
  1 ×0,5, 2 ×1, 3 ×2.
- Pulsanti 0–3 nella soluzione (esercizi) e nell'esito (vocaboli), in una riga
  secondaria; non avanzano e non registrano esiti. 1–3 subito, 0 con conferma
  dentro l'app. Nessun recupero degli elementi tolti.
- Salvata nel browser, per dispositivo, nello stesso archivio dei progressi,
  per id globale. Dizionario e grammatica invariati.

Forma proposta:
- Archivio: ogni id salva livello e importanza; nuova lettura/scrittura
  dell'importanza.
- Selettore: peso = peso del livello × fattore d'importanza; importanza 0 fuori
  dai candidati; finestra di esclusione calcolata sui candidati rimasti.
- Sessione: nuova funzione "registra importanza(id, valore)"; "prossimo
  elemento" distingue "nessun materiale" da "tutti tolti".

Domande aperte:
- Cosa succede alla conferma dello 0 (proposta: elemento successivo senza
  esito; nei vocaboli l'esito è già registrato alla conferma).
- Messaggio quando tutti gli elementi di un tipo sono tolti.
- Quali id si salvano: con almeno un esito o importanza diversa da 2.
- Progressi già salvati sui dispositivi (formato versione 1): convertirli o
  ripartire da zero.
- Edizione kids: i pulsanti compaiono anche lì?
