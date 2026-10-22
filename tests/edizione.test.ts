import { describe, it, expect } from 'vitest'
import { EDIZIONE, chiaveProgressi } from '../src/edizione'

describe('edizione', () => {
  it('nei test e nella build normale è la principale', () => {
    expect(EDIZIONE).toBe('principale')
  })

  it('dà a ogni edizione la sua chiave dei progressi', () => {
    expect(chiaveProgressi('principale')).toBe('maies.progressi')
    expect(chiaveProgressi('kids')).toBe('maies.kids.progressi')
  })
})
