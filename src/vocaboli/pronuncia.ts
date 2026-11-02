// La pronuncia inglese letta dalla sintesi vocale del browser: preferisce una voce
// inglese britannica, altrimenti una qualunque voce inglese. Senza sintesi o senza voci
// inglesi la lettura non è disponibile; una lettura che fallisce non solleva errori.

/** Le parti di `SpeechSynthesisVoice` che il modulo legge. */
export interface Voce {
  readonly name: string
  readonly lang: string
}

/** Le parti di `SpeechSynthesisUtterance` che il modulo imposta. */
export interface Enunciato {
  voice: Voce | null
  lang: string
  onerror: ((evento: never) => void) | null
}

export type CostruttoreEnunciato = new (testo: string) => Enunciato

/** Le parti di `speechSynthesis` che il modulo usa. */
export interface SintesiVocale {
  getVoices(): readonly Voce[]
  cancel(): void
  speak(enunciato: Enunciato): void
  addEventListener(tipo: 'voiceschanged', ascoltatore: () => void): void
  removeEventListener(tipo: 'voiceschanged', ascoltatore: () => void): void
}

export interface Pronuncia {
  /** Se c'è una voce inglese con cui leggere. */
  disponibile(): boolean
  /** Legge il testo, interrompendo la lettura in corso. Non solleva mai errori. */
  leggi(testo: string): void
  /** Avvisa quando le voci del browser cambiano; restituisce la funzione per smettere. */
  quandoCambia(ascoltatore: () => void): () => void
}

export interface OpzioniPronuncia {
  sintesi?: SintesiVocale | undefined
  Enunciato?: CostruttoreEnunciato | undefined
}

// "en", "en-GB", "en_US": la lingua è l'inglese quando il codice è "en" da solo o seguito
// da una regione; "en-GB" e "en_GB" sono il britannico.
const INGLESE = /^en(?:[-_]|$)/i
const BRITANNICO = /^en[-_]GB(?:[-_]|$)/i

function scegliVoce(voci: readonly Voce[]): Voce | undefined {
  return voci.find((v) => BRITANNICO.test(v.lang)) ?? voci.find((v) => INGLESE.test(v.lang))
}

export function creaPronuncia(opzioni: OpzioniPronuncia = {}): Pronuncia {
  const sintesi =
    'sintesi' in opzioni
      ? opzioni.sintesi
      : (globalThis.speechSynthesis as unknown as SintesiVocale | undefined)
  const Costruttore =
    'Enunciato' in opzioni
      ? opzioni.Enunciato
      : (globalThis.SpeechSynthesisUtterance as unknown as CostruttoreEnunciato | undefined)

  // Le voci si chiedono a ogni uso: il browser può caricarle dopo l'apertura della pagina.
  function voce(): Voce | undefined {
    if (!sintesi || !Costruttore) return undefined
    try {
      return scegliVoce(sintesi.getVoices())
    } catch {
      return undefined
    }
  }

  return {
    disponibile: () => voce() !== undefined,

    leggi(testo) {
      const scelta = voce()
      if (!sintesi || !Costruttore || !scelta) return
      try {
        sintesi.cancel()
        const enunciato = new Costruttore(testo)
        enunciato.voice = scelta
        enunciato.lang = scelta.lang
        enunciato.onerror = () => {}
        sintesi.speak(enunciato)
      } catch {
        // Una lettura fallita non mostra errori: semplicemente non si sente nulla.
      }
    },

    quandoCambia(ascoltatore) {
      if (!sintesi) return () => {}
      try {
        sintesi.addEventListener('voiceschanged', ascoltatore)
      } catch {
        return () => {}
      }
      return () => {
        try {
          sintesi.removeEventListener('voiceschanged', ascoltatore)
        } catch {
          // Niente da fare: la schermata si sta chiudendo.
        }
      }
    },
  }
}
