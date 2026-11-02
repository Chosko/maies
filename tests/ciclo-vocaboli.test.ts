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

const NUOVO = { stato: 'nuovo' }

const serie = (valore: 0 | 1 | 2) => ({ stato: 'nel-gruppo' as const, serie: valore })

// v1 a un passo dall'essere imparato: un esito sbagliato riporta la serie a 0.
function conSerie2(): ArchivioProgressi {
  const archivio = creaArchivio(null)
  archivio.salvaStato('01-a/v1', serie(2))
  return archivio
}

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
    expect(ciclo.stato.riscrittura).toBe('')
    expect(ciclo.stato.riscritturaRespinta).toBe(false)
  })

  it('avvio senza vocaboli passa a nessun materiale', () => {
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 0)))

    ciclo.avvio()

    expect(ciclo.stato.fase).toBe('nessun-materiale')
    expect(ciclo.stato.vocabolo).toBeNull()
    expect(ciclo.stato.esito).toBeNull()
    expect(ciclo.stato.titoloLezione).toBeUndefined()
  })

  it('avvio con vocaboli tutti tolti passa a tutti tolti', () => {
    const archivio = creaArchivio(null)
    archivio.salvaImportanza('01-a/v1', 0)
    archivio.salvaImportanza('01-a/v2', 0)
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)), archivio)

    ciclo.avvio()

    expect(ciclo.stato.fase).toBe('tutti-tolti')
    expect(ciclo.stato.vocabolo).toBeNull()
    expect(ciclo.stato.esito).toBeNull()
    expect(ciclo.stato.importanza).toBeNull()
    expect(ciclo.stato.confermaRimozioneAperta).toBe(false)
    expect(ciclo.stato.titoloLezione).toBeUndefined()
  })

  it("lo stato porta l'importanza attuale del vocabolo proposto", () => {
    const archivio = creaArchivio(null)
    archivio.salvaImportanza('01-a/v1', 3)
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)), archivio)

    ciclo.avvio()
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('01-a/v1')
    expect(ciclo.stato.importanza).toBe(3)
    expect(ciclo.stato.confermaRimozioneAperta).toBe(false)

    ciclo.conferma('word 1')
    ciclo.avanti()
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('01-a/v2')
    expect(ciclo.stato.importanza).toBe(2)
  })

  it("imposta importanza registra l'importanza e aggiorna lo stato senza cambiare fase", () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('wrong')

    ciclo.impostaImportanza(3)
    expect(archivio.leggiImportanza('01-a/v1')).toBe(3)
    expect(ciclo.stato.importanza).toBe(3)
    expect(ciclo.stato.fase).toBe('riscrittura')
    expect(ciclo.stato.esito).toBe('sbagliato')
    expect(ciclo.stato.testo).toBe('wrong')

    ciclo.impostaImportanza(1)
    expect(archivio.leggiImportanza('01-a/v1')).toBe(1)
    expect(ciclo.stato.importanza).toBe(1)
    // Cambiare importanza non registra un altro esito.
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))
  })

  it('imposta importanza fuori da esito mostrato non fa nulla', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))

    ciclo.impostaImportanza(3)
    expect(ciclo.stato.importanza).toBeNull()

    ciclo.avvio()
    ciclo.impostaImportanza(3)
    expect(archivio.leggiImportanza('01-a/v1')).toBe(2)
    expect(ciclo.stato.importanza).toBe(2)
    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
  })

  it('chiedi rimozione apre la conferma e annulla la chiude senza altri effetti', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('word 1')

    ciclo.chiediRimozione()
    expect(ciclo.stato.confermaRimozioneAperta).toBe(true)
    expect(ciclo.stato.fase).toBe('esito-mostrato')

    ciclo.annullaRimozione()
    expect(ciclo.stato.confermaRimozioneAperta).toBe(false)
    expect(ciclo.stato.fase).toBe('esito-mostrato')
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('01-a/v1')
    expect(ciclo.stato.esito).toBe('giusto')
    expect(ciclo.stato.importanza).toBe(2)
    expect(archivio.leggiImportanza('01-a/v1')).toBe(2)
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(1))
  })

  it('imposta importanza e chiedi rimozione non fanno nulla mentre la conferma della rimozione è aperta', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('word 1')
    ciclo.chiediRimozione()

    ciclo.impostaImportanza(3)
    ciclo.chiediRimozione()

    expect(archivio.leggiImportanza('01-a/v1')).toBe(2)
    expect(ciclo.stato.importanza).toBe(2)
    expect(ciclo.stato.fase).toBe('esito-mostrato')
    expect(ciclo.stato.confermaRimozioneAperta).toBe(true)
  })

  it('chiedi e annulla rimozione fuori fase non fanno nulla', () => {
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)))

    ciclo.chiediRimozione()
    expect(ciclo.stato.confermaRimozioneAperta).toBe(false)

    ciclo.avvio()
    ciclo.chiediRimozione()
    expect(ciclo.stato.confermaRimozioneAperta).toBe(false)
    ciclo.annullaRimozione()
    expect(ciclo.stato.confermaRimozioneAperta).toBe(false)
    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
  })

  it("conferma rimozione registra l'importanza 0 e passa al vocabolo successivo senza un secondo esito", () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 3)))
    ciclo.avvio()
    ciclo.conferma('wrong')
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))
    ciclo.chiediRimozione()

    ciclo.confermaRimozione()

    expect(archivio.leggiImportanza('01-a/v1')).toBe(0)
    // Un secondo esito sbagliato non cambierebbe lo stato: lo verifica il vocabolo successivo.
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))
    expect(ciclo.stato.confermaRimozioneAperta).toBe(false)
    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('01-a/v2')
    expect(ciclo.stato.testo).toBe('')
    expect(ciclo.stato.esito).toBeNull()
    expect(ciclo.stato.importanza).toBe(2)
  })

  it('conferma rimozione dopo una risposta giusta non registra un secondo esito', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('word 1')
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(1))
    archivio.salvaStato('01-a/v1', serie(0))
    ciclo.chiediRimozione()

    ciclo.confermaRimozione()

    // Un secondo esito giusto riporterebbe la serie a 1.
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))
    expect(archivio.leggiImportanza('01-a/v1')).toBe(0)
  })

  it('conferma rimozione senza la conferma aperta non fa nulla', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.confermaRimozione()
    expect(ciclo.stato.fase).toBe('nessun-materiale')

    ciclo.avvio()
    ciclo.conferma('word 1')
    ciclo.confermaRimozione()
    expect(archivio.leggiImportanza('01-a/v1')).toBe(2)
    expect(ciclo.stato.fase).toBe('esito-mostrato')
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('01-a/v1')

    ciclo.chiediRimozione()
    ciclo.annullaRimozione()
    ciclo.confermaRimozione()
    expect(archivio.leggiImportanza('01-a/v1')).toBe(2)
    expect(ciclo.stato.fase).toBe('esito-mostrato')
  })

  it("togliere l'ultimo vocabolo rimasto porta a tutti tolti", () => {
    const archivio = creaArchivio(null)
    archivio.salvaImportanza('01-a/v2', 0)
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)), archivio)
    ciclo.avvio()
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('01-a/v1')
    ciclo.conferma('word 1')
    ciclo.chiediRimozione()

    ciclo.confermaRimozione()

    expect(archivio.leggiImportanza('01-a/v1')).toBe(0)
    expect(ciclo.stato.fase).toBe('tutti-tolti')
    expect(ciclo.stato.vocabolo).toBeNull()
    expect(ciclo.stato.importanza).toBeNull()
    expect(ciclo.stato.confermaRimozioneAperta).toBe(false)
    expect(ciclo.stato.titoloLezione).toBeUndefined()
  })

  it('avanti non fa nulla mentre la conferma della rimozione è aperta', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('word 1')
    ciclo.chiediRimozione()

    ciclo.avanti()

    expect(ciclo.stato.fase).toBe('esito-mostrato')
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('01-a/v1')
    expect(ciclo.stato.confermaRimozioneAperta).toBe(true)
    expect(archivio.leggiImportanza('01-a/v1')).toBe(2)

    ciclo.annullaRimozione()
    ciclo.avanti()
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('01-a/v2')
  })

  it('nella fase tutti tolti ogni azione non ha effetto', () => {
    const archivio = creaArchivio(null)
    archivio.salvaImportanza('01-a/v1', 0)
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 1)), archivio)
    ciclo.avvio()
    expect(ciclo.stato.fase).toBe('tutti-tolti')

    expect(() => {
      ciclo.conferma('word 1')
      ciclo.riscrivi('word 1')
      ciclo.avanti()
      ciclo.impostaImportanza(3)
      ciclo.chiediRimozione()
      ciclo.confermaRimozione()
      ciclo.annullaRimozione()
    }).not.toThrow()
    expect(ciclo.stato.fase).toBe('tutti-tolti')
    expect(ciclo.stato.confermaRimozioneAperta).toBe(false)
    expect(archivio.leggiImportanza('01-a/v1')).toBe(0)
    expect(archivio.leggiStato('01-a/v1')).toEqual(NUOVO)
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
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(1))
  })

  it("conferma sbagliata registra l'esito e passa alla riscrittura con il testo", () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)), conSerie2())
    ciclo.avvio()

    ciclo.conferma('wrong')

    expect(ciclo.stato.fase).toBe('riscrittura')
    expect(ciclo.stato.riscrittura).toBe('')
    expect(ciclo.stato.riscritturaRespinta).toBe(false)
    expect(ciclo.stato.esito).toBe('sbagliato')
    expect(ciclo.stato.testo).toBe('wrong')
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))
    expect(archivio.leggiStato('01-a/v2')).toEqual(serie(0))
  })

  it('conferma con testo vuoto vale sbagliato', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)), conSerie2())
    ciclo.avvio()

    ciclo.conferma('')

    expect(ciclo.stato.fase).toBe('riscrittura')
    expect(ciclo.stato.esito).toBe('sbagliato')
    expect(ciclo.stato.testo).toBe('')
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))
  })

  it('una doppia conferma registra un solo esito', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)), conSerie2())
    ciclo.avvio()
    ciclo.conferma('wrong')
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))

    ciclo.conferma('word 1')

    // Un secondo esito giusto porterebbe la serie a 1.
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))
    expect(ciclo.stato.fase).toBe('riscrittura')
    expect(ciclo.stato.esito).toBe('sbagliato')
    expect(ciclo.stato.testo).toBe('wrong')
  })

  it('conferma fuori fase non fa nulla', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))

    ciclo.conferma('word 1')
    expect(ciclo.stato.fase).toBe('nessun-materiale')
    expect(ciclo.stato.testo).toBe('')
    expect(ciclo.stato.esito).toBeNull()
    expect(archivio.leggiStato('01-a/v1')).toEqual(NUOVO)

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
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))

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
    ciclo.riscrivi('word 1')
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
    ciclo.riscrivi('word 1')
    ciclo.avanti()
    ferma()
    expect(fasi).toEqual([
      'nessun-materiale',
      'in-attesa-di-risposta',
      'riscrittura',
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

describe("ciclo dell'allenamento vocaboli: la riscrittura dopo un errore", () => {
  it('una riscrittura che passa la verifica mostra l’esito, che resta sbagliato, senza un altro esito', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)), conSerie2())
    ciclo.avvio()
    ciclo.conferma('wrong')
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))

    ciclo.riscrivi('word 1')

    expect(ciclo.stato.fase).toBe('esito-mostrato')
    expect(ciclo.stato.esito).toBe('sbagliato')
    expect(ciclo.stato.testo).toBe('wrong')
    expect(ciclo.stato.riscrittura).toBe('word 1')
    expect(ciclo.stato.riscritturaRespinta).toBe(false)
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('01-a/v1')
    // Un esito giusto registrato porterebbe la serie a 1.
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))
  })

  it('la riscrittura usa la stessa regola della risposta e ogni traduzione accettata', () => {
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('wrong')

    ciclo.riscrivi('  Term 1. ')

    expect(ciclo.stato.fase).toBe('esito-mostrato')
  })

  it('una riscrittura che non passa resta in riscrittura e la segna respinta, senza registrare esiti', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)), conSerie2())
    ciclo.avvio()
    ciclo.conferma('wrong')

    ciclo.riscrivi('wrd 1')

    expect(ciclo.stato.fase).toBe('riscrittura')
    expect(ciclo.stato.riscrittura).toBe('wrd 1')
    expect(ciclo.stato.riscritturaRespinta).toBe(true)
    expect(ciclo.stato.esito).toBe('sbagliato')
    expect(ciclo.stato.testo).toBe('wrong')
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))
    expect(archivio.leggiStato('01-a/v2')).toEqual(serie(0))

    ciclo.riscrivi('')
    expect(ciclo.stato.fase).toBe('riscrittura')
    expect(ciclo.stato.riscritturaRespinta).toBe(true)

    ciclo.riscrivi('word 1')
    expect(ciclo.stato.fase).toBe('esito-mostrato')
    expect(ciclo.stato.riscritturaRespinta).toBe(false)
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))
  })

  it('in riscrittura avanti e conferma non fanno nulla', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)), conSerie2())
    ciclo.avvio()
    ciclo.conferma('wrong')

    ciclo.avanti()
    ciclo.conferma('word 1')

    expect(ciclo.stato.fase).toBe('riscrittura')
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('01-a/v1')
    expect(ciclo.stato.testo).toBe('wrong')
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))
  })

  it('riscrivi fuori dalla riscrittura non fa nulla', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.riscrivi('word 1')
    expect(ciclo.stato.fase).toBe('nessun-materiale')
    expect(ciclo.stato.riscrittura).toBe('')

    ciclo.avvio()
    ciclo.riscrivi('word 1')
    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
    expect(ciclo.stato.riscrittura).toBe('')
    // Proposto entra nel gruppo di lavoro; nessun esito lo ha spostato da lì.
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))

    ciclo.conferma('word 1')
    ciclo.riscrivi('nope')
    expect(ciclo.stato.fase).toBe('esito-mostrato')
    expect(ciclo.stato.riscritturaRespinta).toBe(false)
    expect(ciclo.stato.riscrittura).toBe('')

    const vuoto = preparaCiclo(catalogoDi(lezione('01-a', 0))).ciclo
    vuoto.avvio()
    expect(() => vuoto.riscrivi('word')).not.toThrow()
    expect(vuoto.stato.fase).toBe('nessun-materiale')
  })

  it('riscrivi non fa nulla mentre la conferma della rimozione è aperta', () => {
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('wrong')
    ciclo.chiediRimozione()

    ciclo.riscrivi('word 1')
    ciclo.riscrivi('nope')

    expect(ciclo.stato.fase).toBe('riscrittura')
    expect(ciclo.stato.riscritturaRespinta).toBe(false)
    expect(ciclo.stato.confermaRimozioneAperta).toBe(true)

    ciclo.annullaRimozione()
    ciclo.riscrivi('word 1')
    expect(ciclo.stato.fase).toBe('esito-mostrato')
  })

  it("in riscrittura si sceglie l'importanza senza cambiare fase", () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('wrong')
    ciclo.riscrivi('nope')

    ciclo.impostaImportanza(1)

    expect(archivio.leggiImportanza('01-a/v1')).toBe(1)
    expect(ciclo.stato.importanza).toBe(1)
    expect(ciclo.stato.fase).toBe('riscrittura')
    expect(ciclo.stato.riscritturaRespinta).toBe(true)

    ciclo.chiediRimozione()
    ciclo.annullaRimozione()
    expect(ciclo.stato.fase).toBe('riscrittura')
    expect(ciclo.stato.importanza).toBe(1)
  })

  it('in riscrittura la rimozione confermata passa al vocabolo successivo, con la riscrittura azzerata', () => {
    const { ciclo, archivio } = preparaCiclo(catalogoDi(lezione('01-a', 2)), conSerie2())
    ciclo.avvio()
    ciclo.conferma('wrong')
    ciclo.riscrivi('nope')
    ciclo.chiediRimozione()

    ciclo.confermaRimozione()

    expect(archivio.leggiImportanza('01-a/v1')).toBe(0)
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))
    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('01-a/v2')
    expect(ciclo.stato.testo).toBe('')
    expect(ciclo.stato.esito).toBeNull()
    expect(ciclo.stato.riscrittura).toBe('')
    expect(ciclo.stato.riscritturaRespinta).toBe(false)
    expect(ciclo.stato.confermaRimozioneAperta).toBe(false)
  })

  it('dopo la riscrittura passata avanti propone il vocabolo successivo con la riscrittura azzerata', () => {
    const { ciclo } = preparaCiclo(catalogoDi(lezione('01-a', 2)))
    ciclo.avvio()
    ciclo.conferma('wrong')
    ciclo.riscrivi('nope')
    ciclo.riscrivi('word 1')

    ciclo.avanti()

    expect(ciclo.stato.fase).toBe('in-attesa-di-risposta')
    expect(ciclo.stato.vocabolo?.idGlobale).toBe('01-a/v2')
    expect(ciclo.stato.riscrittura).toBe('')
    expect(ciclo.stato.riscritturaRespinta).toBe(false)
  })
})
