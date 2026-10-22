import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FondoBandiera from '../src/components/FondoBandiera.vue'
import { puntiBandiera } from '../src/fondo/bandiera'

interface Punto {
  x: number
  y: number
  r: number
}

// Ogni puntino è "M<x-r> <y>a<r> <r> 0 1 0 <2r> 0a<r> <r> 0 1 0 <-2r> 0".
function puntini(tracciato: string): Punto[] {
  return [...tracciato.matchAll(/M(-?[\d.]+) (-?[\d.]+)a([\d.]+) /g)].map((m) => {
    const r = Number(m[3])
    return { x: Math.round(Number(m[1]) + r), y: Number(m[2]), r }
  })
}

describe('bandiera a punti', () => {
  const punti = puntiBandiera()

  it('divide i puntini fra fondo, diagonali e croce', () => {
    for (const parte of ['fondo', 'diagonali', 'croce'] as const) {
      expect(puntini(punti[parte]).length, parte).toBeGreaterThan(20)
    }
  })

  it('mette i puntini su una griglia di 8px, con raggio fino a 2,2px', () => {
    const tutti = [...puntini(punti.fondo), ...puntini(punti.diagonali), ...puntini(punti.croce)]
    for (const { x, y, r } of tutti) {
      expect(Math.abs(((x - 60) / 8) % 1) < 0.02 || Math.abs(((x - 60) / 8) % 1) > 0.98).toBe(true)
      expect(Math.abs(((y - 470) / 8) % 1) < 0.02 || Math.abs(((y - 470) / 8) % 1) > 0.98).toBe(true)
      expect(r).toBeGreaterThan(0.45)
      expect(r).toBeLessThanOrEqual(2.2)
    }
    expect(Math.max(...tutti.map((p) => p.r))).toBeGreaterThan(2)
  })

  it('fa rimpicciolire i puntini allontanandosi dal centro del frammento', () => {
    const tutti = [...puntini(punti.fondo), ...puntini(punti.diagonali), ...puntini(punti.croce)]
    const vicino = tutti.find((p) => p.x === 332 && p.y === 598)
    const lontano = tutti.find((p) => p.x === 252 && p.y === 534)
    expect(vicino && lontano && vicino.r > lontano.r).toBe(true)
  })

  it('disegna i tre tracciati in un svg decorativo dentro il fondo', () => {
    const wrapper = mount(FondoBandiera, { slots: { default: '<main>contenuto</main>' } })
    const fondo = wrapper.get('.fondo')
    const svg = fondo.get('svg.bandiera')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('viewBox')).toBe('0 420 400 400')
    expect(svg.attributes('preserveAspectRatio')).toBe('xMaxYMax meet')
    expect(svg.get('path.bandiera-fondo').attributes('d')).toBe(punti.fondo)
    expect(svg.get('path.bandiera-diagonali').attributes('d')).toBe(punti.diagonali)
    expect(svg.get('path.bandiera-croce').attributes('d')).toBe(punti.croce)
    expect(fondo.get('main').text()).toBe('contenuto')
  })
})
