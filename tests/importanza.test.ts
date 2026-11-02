import { describe, it, expect } from 'vitest'
import {
  FATTORI_INTERVALLO,
  IMPORTANZA_INIZIALE,
  IMPORTANZE,
  isImportanza,
} from '../src/ripasso/importanza'

describe('importanza', () => {
  it('definisce le quattro importanze da 0 a 3', () => {
    expect([...IMPORTANZE]).toEqual([0, 1, 2, 3])
  })

  it('parte da 2', () => {
    expect(IMPORTANZA_INIZIALE).toBe(2)
  })

  it('moltiplica l\'intervallo dei controlli: 1 → ×2, 2 → ×1, 3 → ×0,5', () => {
    expect(FATTORI_INTERVALLO).toEqual({ 1: 2, 2: 1, 3: 0.5 })
  })

  it('non ha più i fattori di peso', async () => {
    const modulo: Record<string, unknown> = await import('../src/ripasso/importanza')
    expect(modulo.FATTORI).toBeUndefined()
  })

  it('riconosce solo le quattro importanze', () => {
    for (const importanza of IMPORTANZE) expect(isImportanza(importanza)).toBe(true)
    expect(isImportanza(4)).toBe(false)
    expect(isImportanza(-1)).toBe(false)
    expect(isImportanza(1.5)).toBe(false)
    expect(isImportanza('2')).toBe(false)
    expect(isImportanza(null)).toBe(false)
    expect(isImportanza(undefined)).toBe(false)
  })
})
