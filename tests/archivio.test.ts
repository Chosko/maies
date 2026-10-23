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

  it('dà "normale" e importanza 2 per un id mai registrato e non scrive nulla', () => {
    const salvataggio = new SalvataggioFinto()
    const archivio = creaArchivio(salvataggio)
    expect(archivio.leggiLivello('03-present-continuous/v07')).toBe('normale')
    expect(archivio.leggiImportanza('03-present-continuous/v07')).toBe(2)
    expect(salvataggio.scritture).toBe(0)
    expect(contenuto(salvataggio)).toBeUndefined()
  })

  it('salva subito la mappa a ogni livello e la rilegge', () => {
    const salvataggio = new SalvataggioFinto()
    const archivio = creaArchivio(salvataggio)
    archivio.salvaLivello('03-present-continuous/v07', 'da-ripassare')
    expect(archivio.leggiLivello('03-present-continuous/v07')).toBe('da-ripassare')
    expect(archivio.leggiImportanza('03-present-continuous/v07')).toBe(2)
    expect(contenuto(salvataggio)).toEqual({
      versione: 2,
      elementi: { '03-present-continuous/v07': { livello: 'da-ripassare' } },
    })
    archivio.salvaLivello('01-saluti/f02', 'consolidato')
    expect(salvataggio.scritture).toBe(2)
    expect(contenuto(salvataggio)).toEqual({
      versione: 2,
      elementi: {
        '03-present-continuous/v07': { livello: 'da-ripassare' },
        '01-saluti/f02': { livello: 'consolidato' },
      },
    })
  })

  it('salva subito la mappa a ogni importanza, senza toccare il livello', () => {
    const salvataggio = new SalvataggioFinto()
    const archivio = creaArchivio(salvataggio)
    archivio.salvaImportanza('01-saluti/v01', 3)
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(3)
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('normale')
    expect(contenuto(salvataggio)).toEqual({
      versione: 2,
      elementi: { '01-saluti/v01': { importanza: 3 } },
    })
    archivio.salvaLivello('01-saluti/v01', 'da-ripassare')
    archivio.salvaImportanza('01-saluti/v01', 0)
    expect(salvataggio.scritture).toBe(3)
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('da-ripassare')
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(0)
    expect(contenuto(salvataggio)).toEqual({
      versione: 2,
      elementi: { '01-saluti/v01': { livello: 'da-ripassare', importanza: 0 } },
    })
  })

  it('livello e importanza persistono tra due archivi sullo stesso salvataggio', () => {
    const salvataggio = new SalvataggioFinto()
    const primo = creaArchivio(salvataggio)
    primo.salvaLivello('01-saluti/v01', 'consolidato')
    primo.salvaImportanza('01-saluti/v01', 1)
    primo.salvaImportanza('01-saluti/f03', 0)
    const secondo = creaArchivio(salvataggio)
    expect(secondo.leggiLivello('01-saluti/v01')).toBe('consolidato')
    expect(secondo.leggiImportanza('01-saluti/v01')).toBe(1)
    expect(secondo.leggiLivello('01-saluti/f03')).toBe('normale')
    expect(secondo.leggiImportanza('01-saluti/f03')).toBe(0)
  })

  it('salva solo i valori diversi da quelli iniziali e toglie gli elementi tornati iniziali', () => {
    const salvataggio = new SalvataggioFinto()
    const archivio = creaArchivio(salvataggio)
    archivio.salvaLivello('01-saluti/v01', 'da-ripassare')
    archivio.salvaImportanza('01-saluti/v01', 3)
    archivio.salvaLivello('01-saluti/v02', 'da-ripassare')
    archivio.salvaLivello('01-saluti/v01', 'normale')
    expect(contenuto(salvataggio)).toEqual({
      versione: 2,
      elementi: {
        '01-saluti/v01': { importanza: 3 },
        '01-saluti/v02': { livello: 'da-ripassare' },
      },
    })
    archivio.salvaImportanza('01-saluti/v01', 2)
    archivio.salvaLivello('01-saluti/v02', 'normale')
    archivio.salvaImportanza('01-saluti/v03', 2)
    expect(salvataggio.scritture).toBe(7)
    expect(contenuto(salvataggio)).toEqual({ versione: 2, elementi: {} })
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('normale')
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(2)
  })

  it('converte alla lettura il formato precedente e lo riscrive alla prima registrazione', () => {
    const salvataggio = new SalvataggioFinto()
    const testo = JSON.stringify({
      versione: 1,
      livelli: {
        '01-saluti/v01': 'consolidato',
        '01-saluti/v02': 'da-ripassare',
        '01-saluti/v03': 'normale',
      },
    })
    salvataggio.dati.set(CHIAVE_PROGRESSI, testo)
    const archivio = creaArchivio(salvataggio)
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('consolidato')
    expect(archivio.leggiLivello('01-saluti/v02')).toBe('da-ripassare')
    expect(archivio.leggiLivello('01-saluti/v03')).toBe('normale')
    for (const id of ['01-saluti/v01', '01-saluti/v02', '01-saluti/v03']) {
      expect(archivio.leggiImportanza(id)).toBe(2)
    }
    expect(salvataggio.dati.get(CHIAVE_PROGRESSI)).toBe(testo)
    archivio.salvaImportanza('01-saluti/f01', 3)
    expect(contenuto(salvataggio)).toEqual({
      versione: 2,
      elementi: {
        '01-saluti/v01': { livello: 'consolidato' },
        '01-saluti/v02': { livello: 'da-ripassare' },
        '01-saluti/f01': { importanza: 3 },
      },
    })
  })

  it('il formato precedente si riscrive anche alla prima registrazione di un livello', () => {
    const salvataggio = new SalvataggioFinto()
    salvataggio.dati.set(
      CHIAVE_PROGRESSI,
      JSON.stringify({ versione: 1, livelli: { '01-saluti/v01': 'consolidato' } }),
    )
    creaArchivio(salvataggio).salvaLivello('01-saluti/v02', 'da-ripassare')
    expect(contenuto(salvataggio)).toEqual({
      versione: 2,
      elementi: {
        '01-saluti/v01': { livello: 'consolidato' },
        '01-saluti/v02': { livello: 'da-ripassare' },
      },
    })
  })

  it('conserva gli id salvati che nessuno legge', () => {
    const salvataggio = new SalvataggioFinto()
    salvataggio.dati.set(
      CHIAVE_PROGRESSI,
      JSON.stringify({
        versione: 2,
        elementi: { 'eliminata/f09': { livello: 'consolidato', importanza: 0 } },
      }),
    )
    creaArchivio(salvataggio).salvaLivello('01-saluti/v01', 'da-ripassare')
    expect(contenuto(salvataggio)).toEqual({
      versione: 2,
      elementi: {
        'eliminata/f09': { livello: 'consolidato', importanza: 0 },
        '01-saluti/v01': { livello: 'da-ripassare' },
      },
    })
  })

  it('un livello sconosciuto vale "normale"', () => {
    const salvataggio = new SalvataggioFinto()
    salvataggio.dati.set(
      CHIAVE_PROGRESSI,
      JSON.stringify({
        versione: 2,
        elementi: {
          '01-saluti/v01': { livello: 'esperto' },
          '01-saluti/v02': { livello: 4 },
          '01-saluti/v03': { livello: 'consolidato' },
          '01-saluti/v04': 'consolidato',
        },
      }),
    )
    const archivio = creaArchivio(salvataggio)
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('normale')
    expect(archivio.leggiLivello('01-saluti/v02')).toBe('normale')
    expect(archivio.leggiLivello('01-saluti/v03')).toBe('consolidato')
    expect(archivio.leggiLivello('01-saluti/v04')).toBe('normale')
    expect(archivio.leggiLivello('toString')).toBe('normale')
  })

  it('un livello sconosciuto nel formato precedente vale "normale"', () => {
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
  })

  it('un\'importanza sconosciuta vale 2, senza toccare il livello', () => {
    const salvataggio = new SalvataggioFinto()
    salvataggio.dati.set(
      CHIAVE_PROGRESSI,
      JSON.stringify({
        versione: 2,
        elementi: {
          '01-saluti/v01': { livello: 'da-ripassare', importanza: 7 },
          '01-saluti/v02': { importanza: '3' },
          '01-saluti/v03': { importanza: 1.5 },
          '01-saluti/v04': { importanza: 0 },
        },
      }),
    )
    const archivio = creaArchivio(salvataggio)
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(2)
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('da-ripassare')
    expect(archivio.leggiImportanza('01-saluti/v02')).toBe(2)
    expect(archivio.leggiImportanza('01-saluti/v03')).toBe(2)
    expect(archivio.leggiImportanza('01-saluti/v04')).toBe(0)
    expect(archivio.leggiImportanza('toString')).toBe(2)
  })

  it.each([
    ['non JSON', '{non è json'],
    ['JSON di forma sbagliata', JSON.stringify([1, 2, 3])],
    ['elementi non oggetto', JSON.stringify({ versione: 2, elementi: [{ livello: 'normale' }] })],
    ['livelli non oggetto', JSON.stringify({ versione: 1, livelli: ['normale'] })],
    ['null', 'null'],
  ])('una chiave illeggibile (%s) riparte da progressi vuoti', (_caso, testo) => {
    const salvataggio = new SalvataggioFinto()
    salvataggio.dati.set(CHIAVE_PROGRESSI, testo)
    const archivio = creaArchivio(salvataggio)
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('normale')
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(2)
    expect(salvataggio.dati.get(CHIAVE_PROGRESSI)).toBe(testo)
    archivio.salvaLivello('01-saluti/v01', 'da-ripassare')
    expect(contenuto(salvataggio)).toEqual({
      versione: 2,
      elementi: { '01-saluti/v01': { livello: 'da-ripassare' } },
    })
  })

  it('una versione sconosciuta riparte da progressi vuoti e riscrive la chiave al primo salvataggio', () => {
    const salvataggio = new SalvataggioFinto()
    const testo = JSON.stringify({
      versione: 3,
      elementi: { '01-saluti/v01': { livello: 'consolidato', importanza: 3 } },
    })
    salvataggio.dati.set(CHIAVE_PROGRESSI, testo)
    const archivio = creaArchivio(salvataggio)
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('normale')
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(2)
    expect(salvataggio.dati.get(CHIAVE_PROGRESSI)).toBe(testo)
    archivio.salvaImportanza('01-saluti/v02', 1)
    expect(contenuto(salvataggio)).toEqual({
      versione: 2,
      elementi: { '01-saluti/v02': { importanza: 1 } },
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
    expect(() => archivio.salvaImportanza('01-saluti/v01', 3)).not.toThrow()
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('da-ripassare')
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(3)
  })

  it('un salvataggio che lancia in scrittura lascia lavorare l\'archivio in memoria', () => {
    const salvataggio = new SalvataggioCheLancia(false, true)
    const archivio = creaArchivio(salvataggio)
    expect(() => archivio.salvaLivello('01-saluti/v01', 'da-ripassare')).not.toThrow()
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('da-ripassare')
    expect(() => archivio.salvaLivello('01-saluti/v01', 'normale')).not.toThrow()
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('normale')
    expect(() => archivio.salvaImportanza('01-saluti/v01', 0)).not.toThrow()
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(0)
  })

  it('usa localStorage come salvataggio predefinito', () => {
    const archivio = creaArchivio()
    archivio.salvaLivello('01-saluti/v01', 'consolidato')
    archivio.salvaImportanza('01-saluti/v01', 3)
    expect(JSON.parse(localStorage.getItem(CHIAVE_PROGRESSI) ?? 'null')).toEqual({
      versione: 2,
      elementi: { '01-saluti/v01': { livello: 'consolidato', importanza: 3 } },
    })
    expect(creaArchivio().leggiLivello('01-saluti/v01')).toBe('consolidato')
    expect(creaArchivio().leggiImportanza('01-saluti/v01')).toBe(3)
  })

  it('con una chiave data legge e scrive solo quella', () => {
    const salvataggio = new SalvataggioFinto()
    const testo = JSON.stringify({
      versione: 2,
      elementi: { '01-saluti/v01': { livello: 'consolidato', importanza: 3 } },
    })
    salvataggio.dati.set(CHIAVE_PROGRESSI, testo)
    const archivio = creaArchivio(salvataggio, 'maies.kids.progressi')
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('normale')
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(2)
    archivio.salvaLivello('01-saluti/v01', 'da-ripassare')
    expect(JSON.parse(salvataggio.dati.get('maies.kids.progressi') ?? 'null')).toEqual({
      versione: 2,
      elementi: { '01-saluti/v01': { livello: 'da-ripassare' } },
    })
    expect(salvataggio.dati.get(CHIAVE_PROGRESSI)).toBe(testo)
  })

  it('lavora in memoria quando localStorage non è disponibile', () => {
    vi.stubGlobal('localStorage', undefined)
    const archivio = creaArchivio()
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('normale')
    expect(() => archivio.salvaLivello('01-saluti/v01', 'da-ripassare')).not.toThrow()
    expect(() => archivio.salvaImportanza('01-saluti/v01', 1)).not.toThrow()
    expect(archivio.leggiLivello('01-saluti/v01')).toBe('da-ripassare')
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(1)
  })
})
