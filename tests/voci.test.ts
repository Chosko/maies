import { describe, it, expect } from 'vitest'
import { voci } from '../src/dizionario/voci'
import type { VocaboloCatalogo } from '../src/contenuti/catalogo'

function vocabolo(idGlobale: string, it: string, en: string[]): VocaboloCatalogo {
  const [idLezione, id] = idGlobale.split('/')
  return { id, idLezione, idGlobale, it, en }
}

const parole = (elenco: ReturnType<typeof voci>) => elenco.map((voce) => voce.it)

describe('voci del dizionario', () => {
  it('ordina alfabeticamente per parola italiana', () => {
    const risultato = voci([
      vocabolo('l1/a', 'zaino', ['backpack']),
      vocabolo('l1/b', 'albero', ['tree']),
      vocabolo('l2/a', 'mela', ['apple']),
    ])
    expect(parole(risultato)).toEqual(['albero', 'mela', 'zaino'])
  })

  it('non lascia che maiuscole e accenti alterino l’ordine', () => {
    const risultato = voci([
      vocabolo('l1/a', 'Zucca', ['pumpkin']),
      vocabolo('l1/b', 'èra', ['era']),
      vocabolo('l1/c', 'Bello', ['beautiful']),
      vocabolo('l1/d', 'ape', ['bee']),
      vocabolo('l1/e', 'fine', ['end']),
    ])
    expect(parole(risultato)).toEqual(['ape', 'Bello', 'èra', 'fine', 'Zucca'])
  })

  it('ordina le parentesi come parte della parola', () => {
    const risultato = voci([
      vocabolo('l1/a', 'pesca (sport)', ['fishing']),
      vocabolo('l1/b', 'pera', ['pear']),
      vocabolo('l1/c', 'pesca (frutto)', ['peach']),
    ])
    expect(parole(risultato)).toEqual(['pera', 'pesca (frutto)', 'pesca (sport)'])
  })

  it('a parità di parola conserva l’ordine in ingresso', () => {
    const risultato = voci([
      vocabolo('l2/a', 'casa', ['house']),
      vocabolo('l1/a', 'albero', ['tree']),
      vocabolo('l1/b', 'Casa', ['home']),
      vocabolo('l3/a', 'casa', ['dwelling']),
    ])
    expect(risultato.map((voce) => voce.idGlobale)).toEqual(['l1/a', 'l2/a', 'l1/b', 'l3/a'])
  })

  it('riporta id globale, parola e traduzioni nell’ordine di en', () => {
    const risultato = voci([vocabolo('l1/a', 'casa', ['house', 'home', 'dwelling'])])
    expect(risultato).toEqual([{ idGlobale: 'l1/a', it: 'casa', en: ['house', 'home', 'dwelling'] }])
  })

  it('con una lista vuota restituisce una lista vuota', () => {
    expect(voci([])).toEqual([])
  })
})
