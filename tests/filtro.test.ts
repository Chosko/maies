import { describe, it, expect } from 'vitest'
import { filtra } from '../src/dizionario/filtro'
import type { Voce } from '../src/dizionario/voci'

const elenco: Voce[] = [
  { idGlobale: 'l1/a', it: 'casa', en: ['house', 'home'] },
  { idGlobale: 'l1/b', it: 'perché', en: ['why', 'because'] },
  { idGlobale: 'l1/c', it: 'pesca (frutto)', en: ['peach'] },
  { idGlobale: 'l1/d', it: 'pesca (sport)', en: ['fishing'] },
  { idGlobale: 'l1/e', it: 'l’albero', en: ['the tree'] },
  { idGlobale: 'l1/f', it: "dov'è", en: ['where is'] },
  { idGlobale: 'l1/g', it: 'buon  giorno', en: ['good morning'] },
  { idGlobale: 'l1/h', it: 'perche', en: ['why (informal)'] },
]

const ids = (risultato: readonly Voce[]) => risultato.map((voce) => voce.idGlobale)

describe('filtro di ricerca del dizionario', () => {
  it('trova una parte della parola italiana', () => {
    expect(ids(filtra(elenco, 'as'))).toEqual(['l1/a'])
  })

  it('trova una parte della prima traduzione', () => {
    expect(ids(filtra(elenco, 'hous'))).toEqual(['l1/a'])
  })

  it('trova una parte di una traduzione successiva', () => {
    expect(ids(filtra(elenco, 'becau'))).toEqual(['l1/b'])
  })

  it('ignora le maiuscole', () => {
    expect(ids(filtra(elenco, 'CASA'))).toEqual(['l1/a'])
    expect(ids(filtra(elenco, 'HoMe'))).toEqual(['l1/a'])
  })

  it('"perche" trova "perché" e viceversa', () => {
    expect(ids(filtra(elenco, 'perche'))).toEqual(['l1/b', 'l1/h'])
    expect(ids(filtra(elenco, 'perché'))).toEqual(['l1/b', 'l1/h'])
  })

  it('toglie gli spazi iniziali e finali e riduce quelli interni ripetuti', () => {
    expect(ids(filtra(elenco, '   casa  '))).toEqual(['l1/a'])
    expect(ids(filtra(elenco, 'good    morning'))).toEqual(['l1/g'])
    expect(ids(filtra(elenco, 'buon giorno'))).toEqual(['l1/g'])
  })

  it.each(['’', '‘', 'ʼ'])('tratta l’apostrofo %s come quello semplice', (apostrofo) => {
    expect(ids(filtra(elenco, `l${apostrofo}alb`))).toEqual(['l1/e'])
    expect(ids(filtra(elenco, `dov${apostrofo}e`))).toEqual(['l1/f'])
    expect(ids(filtra([{ idGlobale: 'x/a', it: `c${apostrofo}era`, en: ['there was'] }], "c'era"))).toEqual([
      'x/a',
    ])
  })

  it('trova il testo dentro le parentesi', () => {
    expect(ids(filtra(elenco, 'frutto'))).toEqual(['l1/c'])
    expect(ids(filtra(elenco, '(sp'))).toEqual(['l1/d'])
  })

  it('con un testo vuoto o di soli spazi restituisce tutte le voci', () => {
    expect(filtra(elenco, '')).toEqual(elenco)
    expect(filtra(elenco, '    ')).toEqual(elenco)
  })

  it('senza corrispondenze restituisce una lista vuota', () => {
    expect(filtra(elenco, 'xyz')).toEqual([])
  })

  it('non tollera i refusi', () => {
    expect(filtra(elenco, 'csa')).toEqual([])
  })

  it('conserva l’ordine delle voci', () => {
    expect(ids(filtra(elenco, 'pesca'))).toEqual(['l1/c', 'l1/d'])
    expect(ids(filtra(elenco, 'h'))).toEqual(['l1/a', 'l1/b', 'l1/c', 'l1/d', 'l1/e', 'l1/f', 'l1/h'])
  })
})
