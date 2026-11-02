import { describe, it, expect, vi } from 'vitest'
import { isReactive, isReadonly, watchEffect } from 'vue'
import { costruisciCatalogo } from '../src/contenuti/catalogo'
import type { Catalogo } from '../src/contenuti/catalogo'
import type { Lezione } from '../src/contenuti/schema'
import { creaArchivio } from '../src/ripasso/archivio'
import type { ArchivioProgressi } from '../src/ripasso/archivio'
import { creaSessione } from '../src/ripasso/sessione'
import { creaCiclo } from '../src/esercizi/ciclo'

const fissa = (valore: number) => () => valore

function lezione(id: string, frasi: number): Lezione {
  return {
    id,
    title: `Lezione ${id}`,
    sentences: Array.from({ length: frasi }, (_, i) => ({
      id: `f${i + 1}`,
      it: `Frase ${i + 1}.`,
      en: `Sentence ${i + 1}.`,
      alternatives: i === 0 ? [`Alternative ${i + 1}.`] : [],
    })),
    vocabulary: [{ id: 'v1', it: 'parola', en: ['word'] }],
    grammar: [],
  }
}

// La lezione con l'aiuto `hint` sulle frasi indicate per id.
function conAiuti(base: Lezione, aiuti: Record<string, string>): Lezione {
  return {
    ...base,
    sentences: base.sentences.map((f) => (f.id in aiuti ? { ...f, hint: aiuti[f.id] } : f)),
  }
}

function catalogoDi(...lezioni: Lezione[]): Catalogo {
  return costruisciCatalogo(
    Object.fromEntries(lezioni.map((l) => [`../../contenuti/lezioni/${l.id}.json`, l])),
  )
}

// Con casualità 0 la sessione propone il primo candidato ammesso: f1, poi f2, poi di nuovo f1.
function preparaCiclo(catalogo: Catalogo, archivio: ArchivioProgressi = creaArchivio(null)) {
  let sessioniCreate = 0
  const ciclo = creaCiclo({
    catalogo,
    creaSessione: (tipo) => {
      sessioniCreate++
      return creaSessione(tipo, { catalogo, archivio, casualita: fissa(0) })
    },
  })
  return { ciclo, archivio, sessioniCreate: () => sessioniCreate }
}

describe("ciclo dell'esercizio di traduzione", () => {
  it('avvio con frasi propone la prima frase in attesa di risposta', () => {
    const catalogo = catalogoDi(lezione('01-a', 2))
    const { ciclo } = preparaCiclo(catalogo)

    ciclo.avvio()

    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
    expect(ciclo.stato.frase).toBe(catalogo.frasi[0])
    expect(ciclo.stato.frase).toMatchObject({
      idGlobale: '01-a/f1',
      it: 'Frase 1.',
      en: 'Sentence 1.',
      alternatives: ['Alternative 1.'],
      idLezione: '01-a',
    })
    expect(ciclo.stato.testo).toBe('')
  })

  it('avvio senza frasi passa a nessun materiale', () => {
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 0)))

    ciclo.avvio()

    expect(ciclo.stato.fase).toBe('nessun-materiale')
    expect(ciclo.stato.frase).toBeNull()
    expect(ciclo.stato.titoloLezione).toBeUndefined()
  })

  it('avvio con tutte le frasi già tolte passa a tutti tolti', () => {
    const archivio = creaArchivio(null)
    archivio.salvaImportanza('01-a/f1', 0)
    archivio.salvaImportanza('01-a/f2', 0)
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)), archivio)

    ciclo.avvio()

    expect(ciclo.stato.fase).toBe('tutti-tolti')
    expect(ciclo.stato.frase).toBeNull()
    expect(ciclo.stato.importanza).toBeNull()
    expect(ciclo.stato.titoloLezione).toBeUndefined()
  })

  it('ogni avvio crea una sessione nuova', () => {
    const catalogo = catalogoDi(lezione('01-a', 2))
    const { ciclo, sessioniCreate } = preparaCiclo(catalogo)

    ciclo.avvio()
    expect(sessioniCreate()).toBe(1)
    ciclo.avvio()
    expect(sessioniCreate()).toBe(2)
    // Una sessione nuova ha la finestra degli ultimi proposti vuota: riparte da f1.
    expect(ciclo.stato.frase?.idGlobale).toBe('01-a/f1')
    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
  })

  it('conferma con testo mostra la soluzione e conserva il testo', () => {
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()

    ciclo.conferma('My answer.')

    expect(ciclo.stato.fase).toBe('soluzione-mostrata')
    expect(ciclo.stato.testo).toBe('My answer.')
    expect(ciclo.stato.frase?.idGlobale).toBe('01-a/f1')
  })

  it('conferma con testo vuoto mostra comunque la soluzione', () => {
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()

    ciclo.conferma('')

    expect(ciclo.stato.fase).toBe('soluzione-mostrata')
    expect(ciclo.stato.testo).toBe('')
  })

  it('conferma fuori fase non fa nulla', () => {
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('Prima.')

    ciclo.conferma('Seconda.')
    expect(ciclo.stato.fase).toBe('soluzione-mostrata')
    expect(ciclo.stato.testo).toBe('Prima.')

    const vuoto = preparaCiclo(catalogoDi(lezione('01-a', 0))).ciclo
    vuoto.avvio()
    vuoto.conferma('Testo.')
    expect(vuoto.stato.fase).toBe('nessun-materiale')
    expect(vuoto.stato.testo).toBe('')
  })

  it("segna giusta registra l'esito e propone la frase successiva", () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('Sentence 1.')

    ciclo.segna('giusta')

    expect(archivio.leggiLivello('01-a/f1')).toBe('consolidato')
    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
    expect(ciclo.stato.frase?.idGlobale).toBe('01-a/f2')
    expect(ciclo.stato.testo).toBe('')
  })

  it("segna sbagliata registra l'esito e propone la frase successiva", () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('Wrong.')

    ciclo.segna('sbagliata')

    expect(archivio.leggiLivello('01-a/f1')).toBe('da-ripassare')
    expect(archivio.leggiLivello('01-a/f2')).toBe('normale')
    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
    expect(ciclo.stato.frase?.idGlobale).toBe('01-a/f2')
    expect(ciclo.stato.testo).toBe('')
  })

  it('un doppio segna registra un solo esito', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('Wrong.')

    ciclo.segna('giusta')
    ciclo.segna('giusta')

    expect(archivio.leggiLivello('01-a/f1')).toBe('consolidato')
    // Il secondo segna, fuori fase, non registra nulla per la frase appena proposta.
    expect(archivio.leggiLivello('01-a/f2')).toBe('normale')
    expect(ciclo.stato.frase?.idGlobale).toBe('01-a/f2')
    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
  })

  it('segna fuori fase non fa nulla', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))

    ciclo.segna('sbagliata')
    expect(ciclo.stato.fase).toBe('nessun-materiale')

    ciclo.avvio()
    ciclo.segna('sbagliata')
    expect(archivio.leggiLivello('01-a/f1')).toBe('normale')
    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
    expect(ciclo.stato.frase?.idGlobale).toBe('01-a/f1')

    const vuoto = preparaCiclo(catalogoDi(lezione('01-a', 0))).ciclo
    vuoto.avvio()
    expect(() => vuoto.segna('giusta')).not.toThrow()
    expect(vuoto.stato.fase).toBe('nessun-materiale')
  })

  it("espone l'importanza attuale della frase proposta", () => {
    const archivio = creaArchivio(null)
    archivio.salvaImportanza('01-a/f1', 3)
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)), archivio)

    ciclo.avvio()

    expect(ciclo.stato.frase?.idGlobale).toBe('01-a/f1')
    expect(ciclo.stato.importanza).toBe(3)
    expect(ciclo.stato.confermaRimozioneAperta).toBe(false)
    ciclo.conferma('')
    ciclo.segna('giusta')
    expect(ciclo.stato.frase?.idGlobale).toBe('01-a/f2')
    expect(ciclo.stato.importanza).toBe(2)
  })

  it("imposta importanza registra il valore e lo aggiorna nello stato, senza esiti né cambio di fase", () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('Risposta.')

    ciclo.impostaImportanza(3)
    expect(archivio.leggiImportanza('01-a/f1')).toBe(3)
    expect(ciclo.stato.importanza).toBe(3)

    ciclo.impostaImportanza(1)
    expect(archivio.leggiImportanza('01-a/f1')).toBe(1)
    expect(ciclo.stato.importanza).toBe(1)

    expect(archivio.leggiLivello('01-a/f1')).toBe('normale')
    expect(ciclo.stato.fase).toBe('soluzione-mostrata')
    expect(ciclo.stato.frase?.idGlobale).toBe('01-a/f1')
    expect(ciclo.stato.testo).toBe('Risposta.')
  })

  it('imposta importanza fuori fase non fa nulla', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))

    ciclo.impostaImportanza(3)
    expect(ciclo.stato.importanza).toBeNull()

    ciclo.avvio()
    ciclo.impostaImportanza(3)
    expect(archivio.leggiImportanza('01-a/f1')).toBe(2)
    expect(ciclo.stato.importanza).toBe(2)
    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
  })

  it('imposta importanza non accetta lo 0, che passa dalla conferma della rimozione', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('')

    ciclo.impostaImportanza(0 as unknown as 1)

    expect(archivio.leggiImportanza('01-a/f1')).toBe(2)
    expect(ciclo.stato.importanza).toBe(2)
    expect(ciclo.stato.fase).toBe('soluzione-mostrata')
  })

  it('chiedi rimozione apre la conferma solo dalla soluzione mostrata', () => {
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)))

    ciclo.chiediRimozione()
    expect(ciclo.stato.confermaRimozioneAperta).toBe(false)

    ciclo.avvio()
    ciclo.chiediRimozione()
    expect(ciclo.stato.confermaRimozioneAperta).toBe(false)

    ciclo.conferma('')
    ciclo.chiediRimozione()
    expect(ciclo.stato.confermaRimozioneAperta).toBe(true)
    expect(ciclo.stato.fase).toBe('soluzione-mostrata')
  })

  it('annulla rimozione chiude la conferma senza altri effetti', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('Risposta.')
    ciclo.chiediRimozione()

    ciclo.annullaRimozione()

    expect(ciclo.stato.confermaRimozioneAperta).toBe(false)
    expect(archivio.leggiImportanza('01-a/f1')).toBe(2)
    expect(archivio.leggiLivello('01-a/f1')).toBe('normale')
    expect(ciclo.stato.importanza).toBe(2)
    expect(ciclo.stato.fase).toBe('soluzione-mostrata')
    expect(ciclo.stato.frase?.idGlobale).toBe('01-a/f1')
    expect(ciclo.stato.testo).toBe('Risposta.')

    // Dopo l'annullamento la soluzione si segna come sempre.
    ciclo.segna('giusta')
    expect(archivio.leggiLivello('01-a/f1')).toBe('consolidato')
  })

  it('conferma rimozione registra importanza 0 senza esito e propone la frase successiva', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('Wrong.')
    ciclo.chiediRimozione()

    ciclo.confermaRimozione()

    expect(archivio.leggiImportanza('01-a/f1')).toBe(0)
    expect(archivio.leggiLivello('01-a/f1')).toBe('normale')
    expect(ciclo.stato.confermaRimozioneAperta).toBe(false)
    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
    expect(ciclo.stato.frase?.idGlobale).toBe('01-a/f2')
    expect(ciclo.stato.importanza).toBe(2)
    expect(ciclo.stato.testo).toBe('')
  })

  it('conferma rimozione senza la conferma aperta non fa nulla', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))

    ciclo.confermaRimozione()
    expect(ciclo.stato.fase).toBe('nessun-materiale')

    ciclo.avvio()
    ciclo.conferma('')
    ciclo.confermaRimozione()

    expect(archivio.leggiImportanza('01-a/f1')).toBe(2)
    expect(ciclo.stato.fase).toBe('soluzione-mostrata')
    expect(ciclo.stato.frase?.idGlobale).toBe('01-a/f1')
  })

  it("togliere l'ultima frase rimasta porta a tutti tolti", () => {
    const archivio = creaArchivio(null)
    archivio.salvaImportanza('01-a/f2', 0)
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)), archivio)
    ciclo.avvio()
    expect(ciclo.stato.frase?.idGlobale).toBe('01-a/f1')
    ciclo.conferma('')
    ciclo.chiediRimozione()

    ciclo.confermaRimozione()

    expect(archivio.leggiImportanza('01-a/f1')).toBe(0)
    expect(ciclo.stato.fase).toBe('tutti-tolti')
    expect(ciclo.stato.frase).toBeNull()
    expect(ciclo.stato.importanza).toBeNull()
    expect(ciclo.stato.confermaRimozioneAperta).toBe(false)
    expect(ciclo.stato.titoloLezione).toBeUndefined()

    // In "tutti tolti" ogni azione è senza effetto.
    ciclo.conferma('x')
    ciclo.segna('giusta')
    ciclo.impostaImportanza(3)
    ciclo.chiediRimozione()
    expect(ciclo.stato.fase).toBe('tutti-tolti')
    expect(ciclo.stato.confermaRimozioneAperta).toBe(false)
  })

  it('segna non fa nulla mentre la conferma della rimozione è aperta', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('')
    ciclo.chiediRimozione()

    ciclo.segna('giusta')
    ciclo.segna('sbagliata')

    expect(archivio.leggiLivello('01-a/f1')).toBe('normale')
    expect(ciclo.stato.fase).toBe('soluzione-mostrata')
    expect(ciclo.stato.frase?.idGlobale).toBe('01-a/f1')
    expect(ciclo.stato.confermaRimozioneAperta).toBe(true)
  })

  it("imposta importanza e chiedi rimozione non fanno nulla mentre la conferma della rimozione è aperta", () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('')
    ciclo.chiediRimozione()

    ciclo.impostaImportanza(3)
    ciclo.chiediRimozione()

    expect(archivio.leggiImportanza('01-a/f1')).toBe(2)
    expect(ciclo.stato.importanza).toBe(2)
    expect(ciclo.stato.fase).toBe('soluzione-mostrata')
    expect(ciclo.stato.confermaRimozioneAperta).toBe(true)
  })

  it('ricava il titolo della lezione della frase dal catalogo', () => {
    const catalogo = catalogoDi(lezione('01-a', 1), lezione('02-b', 1))
    const { ciclo } = preparaCiclo(catalogo)

    ciclo.avvio()
    expect(ciclo.stato.frase?.idGlobale).toBe('01-a/f1')
    expect(ciclo.stato.titoloLezione).toBe('Lezione 01-a')

    ciclo.conferma('')
    expect(ciclo.stato.titoloLezione).toBe('Lezione 01-a')
    ciclo.segna('giusta')
    expect(ciclo.stato.frase?.idGlobale).toBe('02-b/f1')
    expect(ciclo.stato.titoloLezione).toBe('Lezione 02-b')
  })

  it('senza la lezione della frase nel catalogo il titolo è assente, senza errori', () => {
    const sessioni = catalogoDi(lezione('01-a', 1))
    const ciclo = creaCiclo({
      catalogo: catalogoDi(lezione('02-b', 1)),
      creaSessione: (tipo) =>
        creaSessione(tipo, { catalogo: sessioni, archivio: creaArchivio(null), casualita: fissa(0) }),
    })

    ciclo.avvio()

    expect(ciclo.stato.frase?.idGlobale).toBe('01-a/f1')
    expect(ciclo.stato.titoloLezione).toBeUndefined()
    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
  })

  it('espone uno stato reattivo in sola lettura', () => {
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    expect(isReactive(ciclo.stato)).toBe(true)
    expect(isReadonly(ciclo.stato)).toBe(true)

    const fasi: string[] = []
    const ferma = watchEffect(() => fasi.push(ciclo.stato.fase), { flush: 'sync' })
    ciclo.avvio()
    ciclo.conferma('x')
    ferma()
    expect(fasi).toEqual(['nessun-materiale', 'in-attesa-di-risposta', 'soluzione-mostrata'])
  })

  it("usa la sessione e il catalogo dell'app quando non sono indicati", () => {
    const ciclo = creaCiclo()
    expect(() => ciclo.avvio()).not.toThrow()
    expect(['in-attesa-di-risposta', 'nessun-materiale']).toContain(ciclo.stato.fase)
  })
})

describe("ciclo dell'esercizio di traduzione: aiuto", () => {
  it("ogni frase proposta parte con l'aiuto nascosto", () => {
    const { ciclo } = preparaCiclo(catalogoDi(conAiuti(lezione('01-a', 2), { f1: 'Pensa al passato.' })))
    expect(ciclo.stato.aiutoMostrato).toBe(false)

    ciclo.avvio()

    expect(ciclo.stato.frase?.hint).toBe('Pensa al passato.')
    expect(ciclo.stato.aiutoMostrato).toBe(false)
  })

  it("mostra aiuto in attesa di risposta mostra l'aiuto e lascia fase e testo", () => {
    const { ciclo } = preparaCiclo(catalogoDi(conAiuti(lezione('01-a', 2), { f1: 'Pensa al passato.' })))
    ciclo.avvio()

    ciclo.mostraAiuto()

    expect(ciclo.stato.aiutoMostrato).toBe(true)
    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
    expect(ciclo.stato.frase?.idGlobale).toBe('01-a/f1')
    expect(ciclo.stato.testo).toBe('')
  })

  it('mostra aiuto non registra né esiti né importanza', () => {
    const catalogo = catalogoDi(conAiuti(lezione('01-a', 2), { f1: 'Pensa al passato.' }))
    const archivio = creaArchivio(null)
    const sessione = creaSessione('frasi', { catalogo, archivio, casualita: fissa(0) })
    const registraEsito = vi.spyOn(sessione, 'registraEsito')
    const registraImportanza = vi.spyOn(sessione, 'registraImportanza')
    const ciclo = creaCiclo({ catalogo, creaSessione: () => sessione })
    ciclo.avvio()
    const importanzaPrima = archivio.leggiImportanza('01-a/f1')

    ciclo.mostraAiuto()

    expect(registraEsito).not.toHaveBeenCalled()
    expect(registraImportanza).not.toHaveBeenCalled()
    expect(archivio.leggiImportanza('01-a/f1')).toBe(importanzaPrima)
  })

  it('mostra aiuto per una frase senza aiuto non fa nulla', () => {
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()

    ciclo.mostraAiuto()

    expect(ciclo.stato.aiutoMostrato).toBe(false)
  })

  it('mostra aiuto fuori dalla fase di attesa della risposta non fa nulla', () => {
    const { ciclo } = preparaCiclo(catalogoDi(conAiuti(lezione('01-a', 2), { f1: 'Pensa al passato.' })))
    ciclo.mostraAiuto()
    expect(ciclo.stato.aiutoMostrato).toBe(false)

    ciclo.avvio()
    ciclo.conferma('x')
    ciclo.mostraAiuto()

    expect(ciclo.stato.aiutoMostrato).toBe(false)
    expect(ciclo.stato.fase).toBe('soluzione-mostrata')
  })

  it("la soluzione dopo l'aiuto lo tiene mostrato e l'esito si registra come sempre", () => {
    const catalogo = catalogoDi(conAiuti(lezione('01-a', 2), { f1: 'Pensa al passato.' }))
    const archivio = creaArchivio(null)
    const sessione = creaSessione('frasi', { catalogo, archivio, casualita: fissa(0) })
    const registraEsito = vi.spyOn(sessione, 'registraEsito')
    const ciclo = creaCiclo({ catalogo, creaSessione: () => sessione })
    ciclo.avvio()
    ciclo.mostraAiuto()

    ciclo.conferma('I went.')
    expect(ciclo.stato.fase).toBe('soluzione-mostrata')
    expect(ciclo.stato.testo).toBe('I went.')
    ciclo.segna('giusta')

    expect(registraEsito).toHaveBeenCalledExactlyOnceWith('01-a/f1', 'giusto')
  })

  it("la frase successiva riparte con l'aiuto nascosto, dopo segna e dopo la rimozione", () => {
    const aiuti = { f1: 'Aiuto 1.', f2: 'Aiuto 2.' }
    const { ciclo } = preparaCiclo(catalogoDi(conAiuti(lezione('01-a', 3), aiuti)))
    ciclo.avvio()
    ciclo.mostraAiuto()
    ciclo.conferma('x')
    ciclo.segna('sbagliata')

    expect(ciclo.stato.frase?.idGlobale).toBe('01-a/f2')
    expect(ciclo.stato.aiutoMostrato).toBe(false)

    ciclo.mostraAiuto()
    ciclo.conferma('x')
    ciclo.chiediRimozione()
    ciclo.confermaRimozione()

    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
    expect(ciclo.stato.aiutoMostrato).toBe(false)
  })

  it("un nuovo avvio riparte con l'aiuto nascosto", () => {
    const { ciclo } = preparaCiclo(catalogoDi(conAiuti(lezione('01-a', 2), { f1: 'Pensa al passato.' })))
    ciclo.avvio()
    ciclo.mostraAiuto()

    ciclo.avvio()

    expect(ciclo.stato.aiutoMostrato).toBe(false)
  })
})
