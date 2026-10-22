import { describe, it, expect, afterEach, vi } from 'vitest'
import { CHIAVE_PROGRESSI, creaArchivio } from '../src/ripasso/archivio'

class SalvataggioFinto implements Storage {
  dati = new Map<string, string>()
  scritture = 0

  get length(): number {
    return this.dati.size
  }
  clear(): void {
    this.dati.clear()
  }
  getItem(chiave: string): string | null {
    return this.dati.get(chiave) ?? null
  }
  key(indice: number): string | null {
    return [...this.dati.keys()][indice] ?? null
  }
  removeItem(chiave: string): void {
    this.dati.delete(chiave)
  }
  setItem(chiave: string, valore: string): void {
    this.scritture++
    this.dati.set(chiave, valore)
  }
}

class SalvataggioCheLancia extends SalvataggioFinto {
  constructor(
    private lanciaInLettura: boolean,
    private lanciaInScrittura: boolean,
  ) {
    super()
  }
  override getItem(chiave: string): string | null {
    if (this.lanciaInLettura) throw new DOMException('negato', 'SecurityError')
    return super.getItem(chiave)
  }
  override setItem(chiave: string, valore: string): void {
    if (this.lanciaInScrittura) throw new DOMException('pieno', 'QuotaExceededError')
    super.setItem(chiave, valore)
  }
}

function contenuto(salvataggio: SalvataggioFinto): unknown {
  const testo = salvataggio.dati.get(CHIAVE_PROGRESSI)
  return testo === undefined ? undefined : JSON.parse(testo)
}

describe('archivio dei progressi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('usa la chiave maies.progressi', () => {
    expect(CHIAVE_PROGRESSI).toBe('maies.progressi')
  })

  it('dà "normale" per un id mai registrato e non scrive nulla', () => {
    const salvataggio = new SalvataggioFinto()
    const archivio = creaArchivio(salvataggio)
    expect(archivio.leggiLivello('03-present-continuous/v07')).toBe('normale')
    expect(salvataggio.scritture).toBe(0)
    expect(contenuto(salvataggio)).toBeUndefined()
  })

  it('salva subito la mappa e la rilegge', () => {
    const salvataggio = new SalvataggioFinto()
    const archivio = creaArchivio(salvataggio)
    archivio.salvaLivello('03-present-continuous/v07', 'da-ripassare')
    expect(archivio.leggiLivello('03-present-continuous/v07')).toBe('da-ripassare')
    expect(contenuto(salvataggio)).toEqual({
      versione: 1,
      livelli: { '03-present-continuous/v07': 'da-ripassare' },
    })
    archivio.salvaLivello('01-saluti/f02', 'consolidato')
    expect(salvataggio.scritture).toBe(2)
    expect(contenuto(salvataggio)).toEqual({
      versione: 1,
      livelli: {
        '03-present-continuous/v07': 'da-ripassare',
        '01-saluti/f02': 'consolidato',
      },
    })
  })

  it('i progressi persistono tra due archivi sullo stesso salvataggio', () => {
    const salvataggio = new SalvataggioFinto()
    creaArchivio(salvataggio).salvaLivello('01-saluti/v01', 'consolidato')
    const secondo = creaArchivio(salvataggio)
    expect(secondo.leggiLivello('01-saluti/v01')).toBe('consolidato')
  })

  it('conserva gli id salvati che nessuno legge', () => {
    const salvataggio = new SalvataggioFinto()
    salvataggio.dati.set(
      CHIAVE_PROGRESSI,
      JSON.stringify({ versione: 1, livelli: { 'eliminata/f09': 'consolidato' } }),
    )
    creaArchivio(salvataggio).salvaLivello('01-saluti/v01', 'normale')
    expect(contenuto(salvataggio)).toEqual({
      versione: 1,
      livelli: { 'eliminata/f09': 'consolidato', '01-saluti/v01': 'normale' },
    })
  })

  it('un livello sconosciuto vale "normale"', () => {
    const salvataggio = new SalvataggioFinto()
    salvataggio.dati.set(
      CHIAVE_PROGRESSI,
      JSON.stringify({
        versione: 1,
        livelli: { '01-saluti/v01': 'esperto', '01-saluti/v02': 4, '01-saluti/v03': 'consolidato' },
      }),
    )
    const archivio = creaArchivio(salvataggio)
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('normale')
    expect(archivio.leggiLivello('01-saluti/v02')).toBe('normale')
    expect(archivio.leggiLivello('01-saluti/v03')).toBe('consolidato')
    expect(archivio.leggiLivello('toString')).toBe('normale')
  })

  it.each([
    ['non JSON', '{non è json'],
    ['JSON di forma sbagliata', JSON.stringify([1, 2, 3])],
    ['livelli non oggetto', JSON.stringify({ versione: 1, livelli: ['normale'] })],
    ['null', 'null'],
  ])('una chiave illeggibile (%s) riparte da progressi vuoti', (_caso, testo) => {
    const salvataggio = new SalvataggioFinto()
    salvataggio.dati.set(CHIAVE_PROGRESSI, testo)
    const archivio = creaArchivio(salvataggio)
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('normale')
    expect(salvataggio.dati.get(CHIAVE_PROGRESSI)).toBe(testo)
    archivio.salvaLivello('01-saluti/v01', 'da-ripassare')
    expect(contenuto(salvataggio)).toEqual({
      versione: 1,
      livelli: { '01-saluti/v01': 'da-ripassare' },
    })
  })

  it('una versione sconosciuta riparte da progressi vuoti e riscrive la chiave al primo salvataggio', () => {
    const salvataggio = new SalvataggioFinto()
    const testo = JSON.stringify({ versione: 2, livelli: { '01-saluti/v01': 'consolidato' } })
    salvataggio.dati.set(CHIAVE_PROGRESSI, testo)
    const archivio = creaArchivio(salvataggio)
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('normale')
    expect(salvataggio.dati.get(CHIAVE_PROGRESSI)).toBe(testo)
    archivio.salvaLivello('01-saluti/v02', 'normale')
    expect(contenuto(salvataggio)).toEqual({
      versione: 1,
      livelli: { '01-saluti/v02': 'normale' },
    })
  })

  it('un salvataggio che lancia in lettura lascia lavorare l\'archivio in memoria', () => {
    const salvataggio = new SalvataggioCheLancia(true, false)
    let archivio!: ReturnType<typeof creaArchivio>
    expect(() => {
      archivio = creaArchivio(salvataggio)
    }).not.toThrow()
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('normale')
    expect(() => archivio.salvaLivello('01-saluti/v01', 'da-ripassare')).not.toThrow()
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('da-ripassare')
  })

  it('un salvataggio che lancia in scrittura lascia lavorare l\'archivio in memoria', () => {
    const salvataggio = new SalvataggioCheLancia(false, true)
    const archivio = creaArchivio(salvataggio)
    expect(() => archivio.salvaLivello('01-saluti/v01', 'da-ripassare')).not.toThrow()
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('da-ripassare')
    expect(() => archivio.salvaLivello('01-saluti/v01', 'normale')).not.toThrow()
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('normale')
  })

  it('usa localStorage come salvataggio predefinito', () => {
    creaArchivio().salvaLivello('01-saluti/v01', 'consolidato')
    expect(JSON.parse(localStorage.getItem(CHIAVE_PROGRESSI) ?? 'null')).toEqual({
      versione: 1,
      livelli: { '01-saluti/v01': 'consolidato' },
    })
    expect(creaArchivio().leggiLivello('01-saluti/v01')).toBe('consolidato')
  })

  it('con una chiave data legge e scrive solo quella', () => {
    const salvataggio = new SalvataggioFinto()
    salvataggio.dati.set(
      CHIAVE_PROGRESSI,
      JSON.stringify({ versione: 1, livelli: { '01-saluti/v01': 'consolidato' } }),
    )
    const archivio = creaArchivio(salvataggio, 'maies.kids.progressi')
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('normale')
    archivio.salvaLivello('01-saluti/v01', 'da-ripassare')
    expect(JSON.parse(salvataggio.dati.get('maies.kids.progressi') ?? 'null')).toEqual({
      versione: 1,
      livelli: { '01-saluti/v01': 'da-ripassare' },
    })
    expect(contenuto(salvataggio)).toEqual({
      versione: 1,
      livelli: { '01-saluti/v01': 'consolidato' },
    })
  })

  it('lavora in memoria quando localStorage non è disponibile', () => {
    vi.stubGlobal('localStorage', undefined)
    const archivio = creaArchivio()
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('normale')
    expect(() => archivio.salvaLivello('01-saluti/v01', 'da-ripassare')).not.toThrow()
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('da-ripassare')
  })
})
