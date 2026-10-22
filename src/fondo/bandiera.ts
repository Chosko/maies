// Frammento di Union Jack fatto di puntini, come una retinatura: la geometria
// delle schermate in design/schermate/. La bandiera (60×30) è stesa su un
// riquadro di 560×280 che esce dal bordo destro; i puntini stanno su una
// griglia di 8px e rimpiccioliscono allontanandosi dal centro del frammento.
export interface PuntiBandiera {
  fondo: string
  diagonali: string
  croce: string
}

type Parte = keyof PuntiBandiera

// u in [0, 60], v in [0, 30]: in quale parte della bandiera cade il punto.
function parte(u: number, v: number): Parte {
  if (Math.abs(v - 15) < 3 || Math.abs(u - 30) < 3) return 'croce'
  if (Math.abs(v - 15) < 5 || Math.abs(u - 30) < 5) return 'diagonali'
  const d1 = Math.abs(u - 2 * v) / Math.sqrt(5)
  const d2 = Math.abs(u + 2 * v - 60) / Math.sqrt(5)
  if (d1 < 1 || d2 < 1) return 'croce'
  if (d1 < 3 || d2 < 3) return 'diagonali'
  return 'fondo'
}

export function puntiBandiera(): PuntiBandiera {
  const tracciati: Record<Parte, string[]> = { fondo: [], diagonali: [], croce: [] }
  const x0 = 60
  const y0 = 470
  const larghezza = 560
  const altezza = 280
  const passo = 8
  const cx = 330
  const cy = 600
  for (let y = y0; y <= y0 + altezza; y += passo) {
    for (let x = x0; x <= x0 + larghezza; x += passo) {
      if (x < -5 || x > 395) continue
      const u = ((x - x0) / larghezza) * 60
      const v = ((y - y0) / altezza) * 30
      const distanza = Math.hypot((x - cx) / 190, (y - cy) / 120)
      const peso = Math.max(0, 1 - distanza * distanza)
      const r = +(0.3 + 1.9 * peso).toFixed(2)
      if (r <= 0.45) continue
      tracciati[parte(u, v)].push(
        `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`,
      )
    }
  }
  return {
    fondo: tracciati.fondo.join(''),
    diagonali: tracciati.diagonali.join(''),
    croce: tracciati.croce.join(''),
  }
}
