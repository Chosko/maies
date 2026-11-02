import { describe, it, expect } from 'vitest'
import { creaPronuncia } from '../src/vocaboli/pronuncia'
import type { SintesiVocale, Voce } from '../src/vocaboli/pronuncia'

// Sostituto dell'enunciato del browser: conserva testo, voce e lingua.
class EnunciatoFinto {
  voice: Voce | null = null
  lang = ''
  onerror: (() => void) | null = null
  constructor(public text: string) {}
}

// Sostituto della sintesi vocale: registra letture e interruzioni.
function sintesiFinta(voci: Voce[]) {
  const registro: { evento: 'cancel' | 'speak'; enunciato?: EnunciatoFinto }[] = []
  const ascoltatori: (() => void)[] = []
  let elenco = voci
  const sintesi: SintesiVocale = {
    getVoices: () => elenco,
    cancel: () => {
      registro.push({ evento: 'cancel' })
    },
    speak: (enunciato) => {
      registro.push({ evento: 'speak', enunciato: enunciato as unknown as EnunciatoFinto })
    },
    addEventListener: (_tipo, ascoltatore) => {
      ascoltatori.push(ascoltatore)
    },
    removeEventListener: (_tipo, ascoltatore) => {
      const i = ascoltatori.indexOf(ascoltatore)
      if (i >= 0) ascoltatori.splice(i, 1)
    },
  }
  const cambiaVoci = (nuove: Voce[]) => {
    elenco = nuove
    for (const a of [...ascoltatori]) a()
  }
  return { sintesi, registro, cambiaVoci, ascoltatori }
}

const voce = (name: string, lang: string): Voce => ({ name, lang })
const letture = (registro: ReturnType<typeof sintesiFinta>['registro']) =>
  registro.filter((r) => r.evento === 'speak').map((r) => r.enunciato!)

describe('pronuncia', () => {
  describe('disponibilità', () => {
    it('è disponibile con una voce inglese', () => {
      const { sintesi } = sintesiFinta([voce('Alice', 'it-IT'), voce('Samantha', 'en-US')])
      expect(creaPronuncia({ sintesi, Enunciato: EnunciatoFinto }).disponibile()).toBe(true)
    })

    it('non è disponibile senza sintesi vocale', () => {
      expect(creaPronuncia({ sintesi: undefined, Enunciato: EnunciatoFinto }).disponibile()).toBe(false)
    })

    it("non è disponibile senza il costruttore dell'enunciato", () => {
      const { sintesi } = sintesiFinta([voce('Daniel', 'en-GB')])
      expect(creaPronuncia({ sintesi, Enunciato: undefined }).disponibile()).toBe(false)
    })

    it('non è disponibile senza voci inglesi', () => {
      const { sintesi } = sintesiFinta([voce('Alice', 'it-IT'), voce('Amélie', 'fr-CA')])
      expect(creaPronuncia({ sintesi, Enunciato: EnunciatoFinto }).disponibile()).toBe(false)
    })

    it('non è disponibile senza alcuna voce', () => {
      const { sintesi } = sintesiFinta([])
      expect(creaPronuncia({ sintesi, Enunciato: EnunciatoFinto }).disponibile()).toBe(false)
    })

    it('non scambia per inglese una lingua che comincia per "en" senza esserlo', () => {
      const { sintesi } = sintesiFinta([voce('Altro', 'enx')])
      expect(creaPronuncia({ sintesi, Enunciato: EnunciatoFinto }).disponibile()).toBe(false)
    })

    it('non è disponibile quando la lettura delle voci fallisce', () => {
      const { sintesi } = sintesiFinta([])
      sintesi.getVoices = () => {
        throw new Error('rotto')
      }
      expect(creaPronuncia({ sintesi, Enunciato: EnunciatoFinto }).disponibile()).toBe(false)
    })

    it('avvisa quando le voci cambiano, finché non si smette di ascoltare', () => {
      const { sintesi, cambiaVoci, ascoltatori } = sintesiFinta([])
      const pronuncia = creaPronuncia({ sintesi, Enunciato: EnunciatoFinto })
      expect(pronuncia.disponibile()).toBe(false)

      const avvisi: boolean[] = []
      const smetti = pronuncia.quandoCambia(() => avvisi.push(pronuncia.disponibile()))
      cambiaVoci([voce('Daniel', 'en-GB')])
      expect(avvisi).toEqual([true])

      smetti()
      expect(ascoltatori).toHaveLength(0)
      cambiaVoci([])
      expect(avvisi).toEqual([true])
    })

    it('senza sintesi vocale ascoltare i cambi non fa nulla', () => {
      const pronuncia = creaPronuncia({ sintesi: undefined, Enunciato: EnunciatoFinto })
      expect(() => pronuncia.quandoCambia(() => {})()).not.toThrow()
    })
  })

  describe('lettura', () => {
    it('preferisce una voce inglese britannica', () => {
      const { sintesi, registro } = sintesiFinta([
        voce('Samantha', 'en-US'),
        voce('Daniel', 'en-GB'),
        voce('Karen', 'en-AU'),
      ])
      creaPronuncia({ sintesi, Enunciato: EnunciatoFinto }).leggi('venue')

      const [enunciato] = letture(registro)
      expect(enunciato.text).toBe('venue')
      expect(enunciato.voice?.name).toBe('Daniel')
      expect(enunciato.lang).toBe('en-GB')
    })

    it('riconosce la voce britannica anche scritta con il trattino basso', () => {
      const { sintesi, registro } = sintesiFinta([voce('Samantha', 'en_US'), voce('Daniel', 'en_GB')])
      creaPronuncia({ sintesi, Enunciato: EnunciatoFinto }).leggi('venue')
      expect(letture(registro)[0].voice?.name).toBe('Daniel')
    })

    it('senza voce britannica usa una qualunque voce inglese', () => {
      const { sintesi, registro } = sintesiFinta([voce('Alice', 'it-IT'), voce('Samantha', 'en-US')])
      creaPronuncia({ sintesi, Enunciato: EnunciatoFinto }).leggi('venue')

      const [enunciato] = letture(registro)
      expect(enunciato.voice?.name).toBe('Samantha')
      expect(enunciato.lang).toBe('en-US')
    })

    it('interrompe la lettura in corso prima di cominciare la nuova', () => {
      const { sintesi, registro } = sintesiFinta([voce('Daniel', 'en-GB')])
      const pronuncia = creaPronuncia({ sintesi, Enunciato: EnunciatoFinto })
      pronuncia.leggi('venue')
      pronuncia.leggi('This venue is perfect.')

      expect(registro.map((r) => r.evento)).toEqual(['cancel', 'speak', 'cancel', 'speak'])
      expect(letture(registro).map((e) => e.text)).toEqual(['venue', 'This venue is perfect.'])
    })

    it('usa le voci arrivate dopo la creazione', () => {
      const { sintesi, registro, cambiaVoci } = sintesiFinta([])
      const pronuncia = creaPronuncia({ sintesi, Enunciato: EnunciatoFinto })
      cambiaVoci([voce('Daniel', 'en-GB')])
      pronuncia.leggi('venue')
      expect(letture(registro)[0].voice?.name).toBe('Daniel')
    })

    it('senza voci inglesi non legge nulla', () => {
      const { sintesi, registro } = sintesiFinta([voce('Alice', 'it-IT')])
      creaPronuncia({ sintesi, Enunciato: EnunciatoFinto }).leggi('venue')
      expect(registro).toEqual([])
    })

    it('senza sintesi vocale non legge nulla e non solleva errori', () => {
      expect(() => creaPronuncia({ sintesi: undefined, Enunciato: EnunciatoFinto }).leggi('venue')).not.toThrow()
    })

    it('una lettura che fallisce non solleva errori', () => {
      const { sintesi } = sintesiFinta([voce('Daniel', 'en-GB')])
      sintesi.speak = () => {
        throw new Error('rotto')
      }
      expect(() => creaPronuncia({ sintesi, Enunciato: EnunciatoFinto }).leggi('venue')).not.toThrow()
    })

    it('un errore segnalato dalla lettura viene ignorato', () => {
      const { sintesi, registro } = sintesiFinta([voce('Daniel', 'en-GB')])
      creaPronuncia({ sintesi, Enunciato: EnunciatoFinto }).leggi('venue')
      const [enunciato] = letture(registro)
      expect(enunciato.onerror).toBeTypeOf('function')
      expect(() => enunciato.onerror!()).not.toThrow()
    })
  })

  it('senza opzioni usa la sintesi del browser, assente nei test', () => {
    const pronuncia = creaPronuncia()
    expect(pronuncia.disponibile()).toBe(false)
    expect(() => pronuncia.leggi('venue')).not.toThrow()
  })
})
