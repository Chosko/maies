import { describe, it, expect } from 'vitest'
import { LIVELLI, PESI, nuovoLivello, isLivello } from '../src/ripasso/livelli'
import type { Esito, Livello } from '../src/ripasso/livelli'

describe('livelli', () => {
  it('definisce i tre livelli con i loro pesi', () => {
    expect([...LIVELLI].sort()).toEqual(['consolidato', 'da-ripassare', 'normale'])
    expect(PESI['da-ripassare']).toBe(6)
    expect(PESI.normale).toBe(3)
    expect(PESI.consolidato).toBe(1)
  })

  const transizioni: [Livello, Esito, Livello][] = [
    ['da-ripassare', 'sbagliato', 'da-ripassare'],
    ['normale', 'sbagliato', 'da-ripassare'],
    ['consolidato', 'sbagliato', 'da-ripassare'],
    ['da-ripassare', 'giusto', 'normale'],
    ['normale', 'giusto', 'consolidato'],
    ['consolidato', 'giusto', 'consolidato'],
  ]

  it.each(transizioni)('da %s con esito %s porta a %s', (attuale, esito, atteso) => {
    expect(nuovoLivello(attuale, esito)).toBe(atteso)
  })

  it('dopo un errore servono due risposte giuste per tornare consolidato', () => {
    let livello = nuovoLivello('consolidato', 'sbagliato')
    livello = nuovoLivello(livello, 'giusto')
    expect(livello).toBe('normale')
    livello = nuovoLivello(livello, 'giusto')
    expect(livello).toBe('consolidato')
  })

  it('riconosce solo i tre livelli', () => {
    for (const livello of LIVELLI) expect(isLivello(livello)).toBe(true)
    expect(isLivello('esperto')).toBe(false)
    expect(isLivello(3)).toBe(false)
    expect(isLivello(null)).toBe(false)
    expect(isLivello('toString')).toBe(false)
  })
})
