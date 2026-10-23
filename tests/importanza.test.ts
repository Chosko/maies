import { describe, it, expect } from 'vitest'
import {
  FATTORI,
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

  it('dà a ogni importanza il suo fattore, con 0 escluso', () => {
    expect(FATTORI[0]).toBe(0)
    expect(FATTORI[1]).toBe(0.5)
    expect(FATTORI[2]).toBe(1)
    expect(FATTORI[3]).toBe(2)
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
