import { describe, it, expect } from 'vitest'
import { costruisciCatalogo, catalogo } from '../src/contenuti/catalogo'
import type { Lezione } from '../src/contenuti/schema'

const essere: Lezione = {
  id: '01-to-be',
  title: 'Il verbo essere',
  sentences: [
    { id: 'f01', it: 'Io sono stanco.', en: 'I am tired.', alternatives: ["I'm tired."] },
    { id: 'f02', it: 'Lei è a casa?', en: 'Is she at home?', alternatives: [] },
  ],
  vocabulary: [{ id: 'v01', it: 'stanco', en: ['tired'] }],
  grammar: [{ id: 'g01', title: 'Il verbo to be', body: 'Testo **Markdown**.' }],
}

const progressivo: Lezione = {
  id: '02-present-continuous',
  title: 'Il presente progressivo',
  sentences: [{ id: 'f01', it: 'Sto mangiando una mela.', en: 'I am eating an apple.', alternatives: [] }],
  vocabulary: [
    { id: 'v01', it: 'mela', en: ['apple'] },
    { id: 'v02', it: 'mangiare', en: ['to eat', 'eat'] },
  ],
  grammar: [],
}

const passato: Lezione = {
  id: '10-past-simple',
  title: 'Il passato semplice',
  sentences: [],
  vocabulary: [{ id: 'v01', it: 'ieri', en: ['yesterday'] }],
  grammar: [],
}

// Le chiavi sono percorsi come quelli di import.meta.glob, in un ordine che non è quello degli id.
function moduli(...lezioni: Lezione[]): Record<string, Lezione> {
  return Object.fromEntries(lezioni.map((l) => [`../../contenuti/lezioni/${l.id}.json`, l]))
}

const pieno = () => costruisciCatalogo(moduli(passato, essere, progressivo))

describe('costruisciCatalogo — lezioni', () => {
  it('restituisce le lezioni in ordine di id, con titolo ed elementi', () => {
    const c = pieno()
    expect(c.lezioni.map((l) => l.id)).toEqual(['01-to-be', '02-present-continuous', '10-past-simple'])
    expect(c.lezioni[0].title).toBe('Il verbo essere')
    expect(c.lezioni[0].sentences.map((f) => f.it)).toEqual(['Io sono stanco.', 'Lei è a casa?'])
    expect(c.lezioni[0].grammar).toEqual([essere.grammar[0]])
  })

  it('ordina per id della lezione e non per nome del modulo', () => {
    const c = costruisciCatalogo({ 'z.json': essere, 'a.json': passato })
    expect(c.lezioni.map((l) => l.id)).toEqual(['01-to-be', '10-past-simple'])
  })

  it('trova una lezione per id', () => {
    expect(pieno().lezione('02-present-continuous')?.title).toBe('Il presente progressivo')
  })

  it('per un id di lezione sconosciuto non trova nessuna lezione', () => {
    expect(pieno().lezione('99-nessuna')).toBeUndefined()
  })
})

describe('costruisciCatalogo — frasi e vocaboli', () => {
  it('elenca tutte le frasi con id globale e id della lezione', () => {
    expect(pieno().frasi.map((f) => [f.idGlobale, f.idLezione, f.it])).toEqual([
      ['01-to-be/f01', '01-to-be', 'Io sono stanco.'],
      ['01-to-be/f02', '01-to-be', 'Lei è a casa?'],
      ['02-present-continuous/f01', '02-present-continuous', 'Sto mangiando una mela.'],
    ])
  })

  it('elenca tutti i vocaboli con id globale e id della lezione', () => {
    expect(pieno().vocaboli.map((v) => [v.idGlobale, v.idLezione, v.it])).toEqual([
      ['01-to-be/v01', '01-to-be', 'stanco'],
      ['02-present-continuous/v01', '02-present-continuous', 'mela'],
      ['02-present-continuous/v02', '02-present-continuous', 'mangiare'],
      ['10-past-simple/v01', '10-past-simple', 'ieri'],
    ])
  })

  it('conserva i dati di ogni elemento', () => {
    const c = pieno()
    expect(c.frasi[0]).toMatchObject(essere.sentences[0])
    expect(c.vocaboli[2]).toMatchObject(progressivo.vocabulary[1])
  })

  it('dà alle frasi di una lezione lo stesso id globale della lista di tutte le frasi', () => {
    const c = pieno()
    expect(c.lezione('01-to-be')?.sentences.map((f) => f.idGlobale)).toEqual([
      '01-to-be/f01',
      '01-to-be/f02',
    ])
    expect(c.lezione('02-present-continuous')?.vocabulary.map((v) => v.idGlobale)).toEqual([
      '02-present-continuous/v01',
      '02-present-continuous/v02',
    ])
  })
})

describe('costruisciCatalogo — ricerca per id globale', () => {
  it('trova una frase esistente', () => {
    expect(pieno().frase('02-present-continuous/f01')?.en).toBe('I am eating an apple.')
  })

  it('trova un vocabolo esistente', () => {
    expect(pieno().vocabolo('02-present-continuous/v02')?.en).toEqual(['to eat', 'eat'])
  })

  it.each(['01-to-be/f09', '99-nessuna/f01', 'f01', ''])(
    'per l’id sconosciuto "%s" non trova nessuna frase né vocabolo',
    (id) => {
      const c = pieno()
      expect(c.frase(id)).toBeUndefined()
      expect(c.vocabolo(id)).toBeUndefined()
    },
  )

  it('non trova una frase cercandola fra i vocaboli, né il contrario', () => {
    const c = pieno()
    expect(c.vocabolo('01-to-be/f01')).toBeUndefined()
    expect(c.frase('01-to-be/v01')).toBeUndefined()
  })

  it('non trova una scheda di grammatica fra frasi e vocaboli', () => {
    const c = pieno()
    expect(c.frase('01-to-be/g01')).toBeUndefined()
    expect(c.vocabolo('01-to-be/g01')).toBeUndefined()
  })
})

describe('costruisciCatalogo — zero lezioni', () => {
  it('ha ogni lista vuota e ogni ricerca senza risultato', () => {
    const c = costruisciCatalogo({})
    expect(c.lezioni).toEqual([])
    expect(c.frasi).toEqual([])
    expect(c.vocaboli).toEqual([])
    expect(c.lezione('01-to-be')).toBeUndefined()
    expect(c.frase('01-to-be/f01')).toBeUndefined()
    expect(c.vocabolo('01-to-be/v01')).toBeUndefined()
  })
})

describe('costruisciCatalogo — sola lettura', () => {
  it('congela liste, lezioni ed elementi', () => {
    const c = pieno()
    expect(Object.isFrozen(c)).toBe(true)
    expect(Object.isFrozen(c.lezioni)).toBe(true)
    expect(Object.isFrozen(c.frasi)).toBe(true)
    expect(Object.isFrozen(c.vocaboli)).toBe(true)
    const lezione = c.lezioni[0]
    expect(Object.isFrozen(lezione)).toBe(true)
    expect(Object.isFrozen(lezione.sentences)).toBe(true)
    expect(Object.isFrozen(lezione.vocabulary)).toBe(true)
    expect(Object.isFrozen(lezione.grammar)).toBe(true)
    expect(Object.isFrozen(lezione.grammar[0])).toBe(true)
    expect(Object.isFrozen(c.frasi[0])).toBe(true)
    expect(Object.isFrozen(c.frasi[0].alternatives)).toBe(true)
    expect(Object.isFrozen(c.vocaboli[0])).toBe(true)
    expect(Object.isFrozen(c.vocaboli[0].en)).toBe(true)
  })

  it('non si lascia modificare', () => {
    const c = pieno()
    expect(() => (c.frasi as unknown as unknown[]).push({})).toThrow(TypeError)
    expect(() => {
      ;(c.vocaboli[0].en as string[])[0] = 'altro'
    }).toThrow(TypeError)
  })

  it('non congela né modifica le lezioni ricevute', () => {
    const originale = structuredClone(essere)
    costruisciCatalogo(moduli(originale))
    expect(Object.isFrozen(originale)).toBe(false)
    expect(Object.isFrozen(originale.sentences)).toBe(false)
    expect(originale).toEqual(essere)
  })

  it('dichiara i dati in sola lettura nei tipi', () => {
    const c = pieno()
    // @ts-expect-error — le liste del catalogo sono readonly
    expect(() => c.frasi.push(c.frasi[0])).toThrow(TypeError)
    // @ts-expect-error — gli elementi del catalogo sono readonly
    expect(() => (c.vocaboli[0].it = 'altro')).toThrow(TypeError)
    // @ts-expect-error — le traduzioni del catalogo sono readonly
    expect(() => c.vocaboli[0].en.push('altro')).toThrow(TypeError)
    // @ts-expect-error — le schede del catalogo sono readonly
    expect(() => (c.lezioni[0].grammar[0].title = 'altro')).toThrow(TypeError)
  })
})

describe('catalogo dell’app', () => {
  it('è il catalogo costruito sui file reali di contenuti/lezioni', () => {
    const reali = import.meta.glob<Lezione>('../contenuti/lezioni/*.json', {
      eager: true,
      import: 'default',
    })
    expect(catalogo.lezioni).toEqual(costruisciCatalogo(reali).lezioni)
    expect(catalogo.lezioni).toHaveLength(Object.keys(reali).length)
  })
})
