import { describe, it, expect } from 'vitest'
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

  it('avvio con frasi tutti tolti passa a nessun materiale', () => {
    const archivio = creaArchivio(null)
    archivio.salvaImportanza('01-a/f1', 0)
    archivio.salvaImportanza('01-a/f2', 0)
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)), archivio)

    ciclo.avvio()

    expect(ciclo.stato.fase).toBe('nessun-materiale')
    expect(ciclo.stato.frase).toBeNull()
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
