import { describe, it, expect } from 'vitest'
import { isReactive, isReadonly, watchEffect } from 'vue'
import { costruisciCatalogo } from '../src/contenuti/catalogo'
import type { Catalogo } from '../src/contenuti/catalogo'
import type { Lezione } from '../src/contenuti/schema'
import { creaArchivio } from '../src/ripasso/archivio'
import type { ArchivioProgressi } from '../src/ripasso/archivio'
import { creaSessione } from '../src/ripasso/sessione'
import { creaCiclo } from '../src/vocaboli/ciclo'

const fissa = (valore: number) => () => valore

function lezione(id: string, vocaboli: number): Lezione {
  return {
    id,
    title: `Lezione ${id}`,
    sentences: [{ id: 'f1', it: 'Frase.', en: 'Sentence.', alternatives: [] }],
    vocabulary: Array.from({ length: vocaboli }, (_, i) => ({
      id: `v${i + 1}`,
      it: `parola ${i + 1}`,
      en: i === 0 ? [`word ${i + 1}`, `term ${i + 1}`] : [`word ${i + 1}`],
    })),
    grammar: [],
  }
}

function catalogoDi(...lezioni: Lezione[]): Catalogo {
  return costruisciCatalogo(
    Object.fromEntries(lezioni.map((l) => [`../../contenuti/lezioni/${l.id}.json`, l])),
  )
}

// Con casualità 0 la sessione propone il primo candidato ammesso: v1, poi v2, poi di nuovo v1.
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

describe("ciclo dell'allenamento vocaboli", () => {
  it('avvio con vocaboli propone il primo vocabolo in attesa di risposta', () => {
    const catalogo = catalogoDi(lezione('01-a', 2))
    const { ciclo } = preparaCiclo(catalogo)

    ciclo.avvio()

    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
    expect(ciclo.stato.vocabolo).toBe(catalogo.vocaboli[0])
    expect(ciclo.stato.vocabolo).toMatchObject({
      idGlobale: '01-a/v1',
      it: 'parola 1',
      en: ['word 1', 'term 1'],
      idLezione: '01-a',
    })
    expect(ciclo.stato.testo).toBe('')
    expect(ciclo.stato.esito).toBeNull()
  })

  it('avvio senza vocaboli passa a nessun materiale', () => {
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 0)))

    ciclo.avvio()

    expect(ciclo.stato.fase).toBe('nessun-materiale')
    expect(ciclo.stato.vocabolo).toBeNull()
    expect(ciclo.stato.esito).toBeNull()
    expect(ciclo.stato.titoloLezione).toBeUndefined()
  })

  it('avvio con vocaboli tutti tolti passa a nessun materiale', () => {
    const archivio = creaArchivio(null)
    archivio.salvaImportanza('01-a/v1', 0)
    archivio.salvaImportanza('01-a/v2', 0)
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)), archivio)

    ciclo.avvio()

    expect(ciclo.stato.fase).toBe('nessun-materiale')
    expect(ciclo.stato.vocabolo).toBeNull()
    expect(ciclo.stato.esito).toBeNull()
    expect(ciclo.stato.titoloLezione).toBeUndefined()
  })

  it('ogni avvio crea una sessione nuova', () => {
    const { ciclo, sessioniCreate } = preparaCiclo(catalogoDi(lezione('01-a', 2)))

    ciclo.avvio()
    expect(sessioniCreate()).toBe(1)
    ciclo.avvio()
    expect(sessioniCreate()).toBe(2)
    // Una sessione nuova ha la finestra degli ultimi proposti vuota: riparte da v1.
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('01-a/v1')
    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
  })

  it("conferma giusta registra l'esito e mostra l'esito con il testo", () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()

    ciclo.conferma('  Term 1. ')

    expect(ciclo.stato.fase).toBe('esito-mostrato')
    expect(ciclo.stato.esito).toBe('giusto')
    expect(ciclo.stato.testo).toBe('  Term 1. ')
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('01-a/v1')
    expect(archivio.leggiLivello('01-a/v1')).toBe('consolidato')
  })

  it("conferma sbagliata registra l'esito e mostra l'esito con il testo", () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()

    ciclo.conferma('wrong')

    expect(ciclo.stato.fase).toBe('esito-mostrato')
    expect(ciclo.stato.esito).toBe('sbagliato')
    expect(ciclo.stato.testo).toBe('wrong')
    expect(archivio.leggiLivello('01-a/v1')).toBe('da-ripassare')
    expect(archivio.leggiLivello('01-a/v2')).toBe('normale')
  })

  it('conferma con testo vuoto vale sbagliato', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()

    ciclo.conferma('')

    expect(ciclo.stato.fase).toBe('esito-mostrato')
    expect(ciclo.stato.esito).toBe('sbagliato')
    expect(ciclo.stato.testo).toBe('')
    expect(archivio.leggiLivello('01-a/v1')).toBe('da-ripassare')
  })

  it('una doppia conferma registra un solo esito', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('wrong')
    expect(archivio.leggiLivello('01-a/v1')).toBe('da-ripassare')

    ciclo.conferma('word 1')

    // Un secondo esito giusto porterebbe da "da ripassare" a "normale".
    expect(archivio.leggiLivello('01-a/v1')).toBe('da-ripassare')
    expect(ciclo.stato.fase).toBe('esito-mostrato')
    expect(ciclo.stato.esito).toBe('sbagliato')
    expect(ciclo.stato.testo).toBe('wrong')
  })

  it('conferma fuori fase non fa nulla', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))

    ciclo.conferma('word 1')
    expect(ciclo.stato.fase).toBe('nessun-materiale')
    expect(ciclo.stato.testo).toBe('')
    expect(ciclo.stato.esito).toBeNull()
    expect(archivio.leggiLivello('01-a/v1')).toBe('normale')

    const vuoto = preparaCiclo(catalogoDi(lezione('01-a', 0))).ciclo
    vuoto.avvio()
    expect(() => vuoto.conferma('word')).not.toThrow()
    expect(vuoto.stato.fase).toBe('nessun-materiale')
    expect(vuoto.stato.testo).toBe('')
    expect(vuoto.stato.esito).toBeNull()
  })

  it('avanti propone il vocabolo successivo con testo ed esito vuoti', () => {
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('word 1')

    ciclo.avanti()

    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('01-a/v2')
    expect(ciclo.stato.testo).toBe('')
    expect(ciclo.stato.esito).toBeNull()
  })

  it('avanti fuori fase non fa nulla', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))

    ciclo.avanti()
    expect(ciclo.stato.fase).toBe('nessun-materiale')
    expect(ciclo.stato.vocabolo).toBeNull()

    ciclo.avvio()
    ciclo.avanti()
    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('01-a/v1')
    expect(archivio.leggiLivello('01-a/v1')).toBe('normale')

    const vuoto = preparaCiclo(catalogoDi(lezione('01-a', 0))).ciclo
    vuoto.avvio()
    expect(() => vuoto.avanti()).not.toThrow()
    expect(vuoto.stato.fase).toBe('nessun-materiale')
  })

  it('ricava il titolo della lezione del vocabolo dal catalogo', () => {
    const catalogo = catalogoDi(lezione('01-a', 1), lezione('02-b', 1))
    const { ciclo } = preparaCiclo(catalogo)

    ciclo.avvio()
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('01-a/v1')
    expect(ciclo.stato.titoloLezione).toBe('Lezione 01-a')

    ciclo.conferma('')
    expect(ciclo.stato.titoloLezione).toBe('Lezione 01-a')
    ciclo.avanti()
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('02-b/v1')
    expect(ciclo.stato.titoloLezione).toBe('Lezione 02-b')
  })

  it('senza la lezione del vocabolo nel catalogo il titolo è assente, senza errori', () => {
    const sessioni = catalogoDi(lezione('01-a', 1))
    const ciclo = creaCiclo({
      catalogo: catalogoDi(lezione('02-b', 1)),
      creaSessione: (tipo) =>
        creaSessione(tipo, { catalogo: sessioni, archivio: creaArchivio(null), casualita: fissa(0) }),
    })

    ciclo.avvio()
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('01-a/v1')
    expect(ciclo.stato.titoloLezione).toBeUndefined()

    ciclo.conferma('word 1')
    expect(ciclo.stato.fase).toBe('esito-mostrato')
    expect(ciclo.stato.titoloLezione).toBeUndefined()
  })

  it('espone uno stato reattivo in sola lettura', () => {
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    expect(isReactive(ciclo.stato)).toBe(true)
    expect(isReadonly(ciclo.stato)).toBe(true)

    const fasi: string[] = []
    const ferma = watchEffect(() => fasi.push(ciclo.stato.fase), { flush: 'sync' })
    ciclo.avvio()
    ciclo.conferma('x')
    ciclo.avanti()
    ferma()
    expect(fasi).toEqual([
      'nessun-materiale',
      'in-attesa-di-risposta',
      'esito-mostrato',
      'in-attesa-di-risposta',
    ])
  })

  it("usa la sessione e il catalogo dell'app quando non sono indicati", () => {
    const ciclo = creaCiclo()
    expect(() => ciclo.avvio()).not.toThrow()
    expect(['in-attesa-di-risposta', 'nessun-materiale']).toContain(ciclo.stato.fase)
  })
})
