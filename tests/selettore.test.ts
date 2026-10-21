import { describe, it, expect, vi, afterEach } from 'vitest'
import { scegli } from '../src/ripasso/selettore'
import type { Candidato } from '../src/ripasso/selettore'

const fissa = (valore: number) => () => valore

function conSeme(seme: number): () => number {
  let stato = seme >>> 0
  return () => {
    stato = (stato + 0x6d2b79f5) >>> 0
    let t = stato
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const candidati: Candidato[] = [
  { id: 'l/a', livello: 'da-ripassare' },
  { id: 'l/b', livello: 'normale' },
  { id: 'l/c', livello: 'consolidato' },
]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('selettore', () => {
  it.each([
    [0, 'l/a'],
    [0.599, 'l/a'],
    [0.6, 'l/b'],
    [0.899, 'l/b'],
    [0.9, 'l/c'],
    [0.99999, 'l/c'],
  ])('con casualità %f sceglie %s ai bordi degli intervalli di peso 6 : 3 : 1', (valore, atteso) => {
    expect(scegli(candidati, [], fissa(valore))?.id).toBe(atteso)
  })

  it('non sceglie mai un candidato escluso e ripartisce il peso sui restanti', () => {
    expect(scegli(candidati, ['l/a'], fissa(0))?.id).toBe('l/b')
    expect(scegli(candidati, ['l/a'], fissa(0.749))?.id).toBe('l/b')
    expect(scegli(candidati, ['l/a'], fissa(0.75))?.id).toBe('l/c')
    expect(scegli(candidati, ['l/a', 'l/b'], fissa(0))?.id).toBe('l/c')
    expect(scegli(candidati, ['l/a', 'l/b'], fissa(0.99999))?.id).toBe('l/c')
  })

  it('accetta gli esclusi come insieme', () => {
    expect(scegli(candidati, new Set(['l/a', 'l/c']), fissa(0.99999))?.id).toBe('l/b')
  })

  it('restituisce il candidato stesso, con i suoi altri campi', () => {
    const conDati = [{ id: 'l/x', livello: 'normale' as const, testo: 'ciao' }]
    expect(scegli(conDati, [], fissa(0.5))).toBe(conDati[0])
  })

  it('restituisce null senza candidati', () => {
    expect(scegli([], [], fissa(0))).toBeNull()
  })

  it('restituisce null se tutti i candidati sono esclusi', () => {
    expect(scegli(candidati, ['l/a', 'l/b', 'l/c'], fissa(0))).toBeNull()
  })

  it('non modifica gli argomenti e non tocca il salvataggio', () => {
    const lista = candidati.map((c) => Object.freeze({ ...c }))
    Object.freeze(lista)
    const esclusi = Object.freeze(['l/b'])
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const getItem = vi.spyOn(Storage.prototype, 'getItem')

    expect(scegli(lista, esclusi, fissa(0.5))?.id).toBe('l/a')

    expect(lista).toEqual(candidati)
    expect(esclusi).toEqual(['l/b'])
    expect(setItem).not.toHaveBeenCalled()
    expect(getItem).not.toHaveBeenCalled()
  })

  it('su molte estrazioni le frequenze seguono la proporzione 6 : 3 : 1', () => {
    const casualita = conSeme(42)
    const estrazioni = 60_000
    const conteggi: Record<string, number> = { 'l/a': 0, 'l/b': 0, 'l/c': 0 }
    for (let i = 0; i < estrazioni; i++) {
      const scelto = scegli(candidati, [], casualita)
      conteggi[scelto!.id]++
    }
    expect(conteggi['l/a'] / estrazioni).toBeCloseTo(0.6, 1)
    expect(conteggi['l/b'] / estrazioni).toBeCloseTo(0.3, 1)
    expect(conteggi['l/c'] / estrazioni).toBeCloseTo(0.1, 1)
    expect(Math.abs(conteggi['l/a'] / conteggi['l/c'] - 6)).toBeLessThan(0.3)
    expect(Math.abs(conteggi['l/b'] / conteggi['l/c'] - 3)).toBeLessThan(0.15)
  })
})
