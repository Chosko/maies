import { describe, it, expect } from 'vitest'
import { elenco } from '../src/grammatica/elenco'
import type { LezioneCatalogo } from '../src/contenuti/catalogo'

function lezione(
  id: string,
  title: string,
  grammar: { id: string; title: string }[],
): LezioneCatalogo {
  return {
    id,
    title,
    sentences: [],
    vocabulary: [],
    grammar: grammar.map((scheda) => ({ ...scheda, body: 'Testo.' })),
  }
}

const essere = lezione('01-to-be', 'Il verbo essere', [
  { id: 'g01', title: 'Il verbo to be' },
  { id: 'g02', title: 'La forma negativa' },
])
const progressivo = lezione('02-present-continuous', 'Il presente progressivo', [])
const passato = lezione('10-past-simple', 'Il passato semplice', [
  { id: 'g02', title: 'I verbi irregolari' },
  { id: 'g01', title: 'I verbi regolari' },
])

describe('elenco della grammatica', () => {
  it('restituisce le lezioni con schede nell\'ordine di id del catalogo', () => {
    expect(elenco([essere, progressivo, passato]).map((voce) => voce.id)).toEqual([
      '01-to-be',
      '10-past-simple',
    ])
    expect(elenco([passato, essere]).map((voce) => voce.id)).toEqual([
      '01-to-be',
      '10-past-simple',
    ])
  })

  it('dà a ogni lezione id, titolo e i titoli delle schede in ordine di id', () => {
    expect(elenco([essere, passato])).toEqual([
      {
        id: '01-to-be',
        title: 'Il verbo essere',
        schede: ['Il verbo to be', 'La forma negativa'],
      },
      {
        id: '10-past-simple',
        title: 'Il passato semplice',
        schede: ['I verbi regolari', 'I verbi irregolari'],
      },
    ])
  })

  it('esclude una lezione senza schede', () => {
    expect(elenco([progressivo, essere]).map((voce) => voce.id)).toEqual(['01-to-be'])
  })

  it('è vuoto con zero lezioni', () => {
    expect(elenco([])).toEqual([])
  })

  it('è vuoto con sole lezioni senza schede', () => {
    expect(elenco([progressivo, lezione('03-plurals', 'I plurali', [])])).toEqual([])
  })
})
