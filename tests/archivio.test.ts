import { describe, it, expect, afterEach, vi } from 'vitest'
import { CHIAVE_PROGRESSI, creaArchivio } from '../src/ripasso/archivio'
import { giornoLocale } from '../src/ripasso/apprendimento'
import type { StatoApprendimento } from '../src/ripasso/apprendimento'

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

const OGGI = '2026-11-02'

const IMPARATO: StatoApprendimento = {
  stato: 'imparato',
  gradino: 3,
  controllo: '2026-11-09',
  ultimaVista: '2026-11-02',
}

function salvatoCon(dati: unknown): SalvataggioFinto {
  const salvataggio = new SalvataggioFinto()
  salvataggio.dati.set(CHIAVE_PROGRESSI, JSON.stringify(dati))
  return salvataggio
}

describe('archivio dei progressi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
    localStorage.clear()
  })

  it('usa la chiave maies.progressi', () => {
    expect(CHIAVE_PROGRESSI).toBe('maies.progressi')
  })

  it('dà "nuovo" e importanza 2 per un id mai registrato e non scrive nulla', () => {
    const salvataggio = new SalvataggioFinto()
    const archivio = creaArchivio(salvataggio, CHIAVE_PROGRESSI, OGGI)
    expect(archivio.leggiStato('03-present-continuous/v07')).toEqual({ stato: 'nuovo' })
    expect(archivio.leggiImportanza('03-present-continuous/v07')).toBe(2)
    expect(salvataggio.scritture).toBe(0)
    expect(contenuto(salvataggio)).toBeUndefined()
  })

  it('salva subito la mappa a ogni stato e la rilegge', () => {
    const salvataggio = new SalvataggioFinto()
    const archivio = creaArchivio(salvataggio)
    archivio.salvaStato('03-present-continuous/v07', { stato: 'nel-gruppo', serie: 1 })
    expect(archivio.leggiStato('03-present-continuous/v07')).toEqual({ stato: 'nel-gruppo', serie: 1 })
    expect(archivio.leggiImportanza('03-present-continuous/v07')).toBe(2)
    expect(contenuto(salvataggio)).toEqual({
      versione: 3,
      elementi: { '03-present-continuous/v07': { stato: { stato: 'nel-gruppo', serie: 1 } } },
    })
    archivio.salvaStato('01-saluti/f02', IMPARATO)
    expect(salvataggio.scritture).toBe(2)
    expect(contenuto(salvataggio)).toEqual({
      versione: 3,
      elementi: {
        '03-present-continuous/v07': { stato: { stato: 'nel-gruppo', serie: 1 } },
        '01-saluti/f02': { stato: IMPARATO },
      },
    })
    expect(archivio.leggiStato('01-saluti/f02')).toEqual(IMPARATO)
  })

  it('salva subito la mappa a ogni importanza, senza toccare lo stato', () => {
    const salvataggio = new SalvataggioFinto()
    const archivio = creaArchivio(salvataggio)
    archivio.salvaImportanza('01-saluti/v01', 3)
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(3)
    expect(archivio.leggiStato('01-saluti/v01')).toEqual({ stato: 'nuovo' })
    expect(contenuto(salvataggio)).toEqual({
      versione: 3,
      elementi: { '01-saluti/v01': { importanza: 3 } },
    })
    archivio.salvaStato('01-saluti/v01', { stato: 'da-riprendere' })
    archivio.salvaImportanza('01-saluti/v01', 0)
    expect(salvataggio.scritture).toBe(3)
    expect(archivio.leggiStato('01-saluti/v01')).toEqual({ stato: 'da-riprendere' })
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(0)
    expect(contenuto(salvataggio)).toEqual({
      versione: 3,
      elementi: { '01-saluti/v01': { stato: { stato: 'da-riprendere' }, importanza: 0 } },
    })
  })

  it('stato e importanza persistono tra due archivi sullo stesso salvataggio', () => {
    const salvataggio = new SalvataggioFinto()
    const primo = creaArchivio(salvataggio)
    primo.salvaStato('01-saluti/v01', IMPARATO)
    primo.salvaImportanza('01-saluti/v01', 1)
    primo.salvaImportanza('01-saluti/f03', 0)
    const secondo = creaArchivio(salvataggio)
    expect(secondo.leggiStato('01-saluti/v01')).toEqual(IMPARATO)
    expect(secondo.leggiImportanza('01-saluti/v01')).toBe(1)
    expect(secondo.leggiStato('01-saluti/f03')).toEqual({ stato: 'nuovo' })
    expect(secondo.leggiImportanza('01-saluti/f03')).toBe(0)
  })

  it('salva solo i valori diversi da quelli iniziali e toglie gli elementi tornati iniziali', () => {
    const salvataggio = new SalvataggioFinto()
    const archivio = creaArchivio(salvataggio)
    archivio.salvaStato('01-saluti/v01', { stato: 'nel-gruppo', serie: 0 })
    archivio.salvaImportanza('01-saluti/v01', 3)
    archivio.salvaStato('01-saluti/v02', { stato: 'da-riprendere' })
    archivio.salvaStato('01-saluti/v01', { stato: 'nuovo' })
    expect(contenuto(salvataggio)).toEqual({
      versione: 3,
      elementi: {
        '01-saluti/v01': { importanza: 3 },
        '01-saluti/v02': { stato: { stato: 'da-riprendere' } },
      },
    })
    archivio.salvaImportanza('01-saluti/v01', 2)
    archivio.salvaStato('01-saluti/v02', { stato: 'nuovo' })
    archivio.salvaImportanza('01-saluti/v03', 2)
    expect(salvataggio.scritture).toBe(7)
    expect(contenuto(salvataggio)).toEqual({ versione: 3, elementi: {} })
    expect(archivio.leggiStato('01-saluti/v01')).toEqual({ stato: 'nuovo' })
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(2)
  })

  it('salva solo i dati del proprio stato', () => {
    const salvataggio = new SalvataggioFinto()
    const archivio = creaArchivio(salvataggio)
    archivio.salvaStato('01-saluti/v01', {
      stato: 'nel-gruppo',
      serie: 2,
      extra: 'x',
    } as unknown as StatoApprendimento)
    expect(contenuto(salvataggio)).toEqual({
      versione: 3,
      elementi: { '01-saluti/v01': { stato: { stato: 'nel-gruppo', serie: 2 } } },
    })
  })

  it('lo stato letto è una copia: modificarlo non cambia l\'archivio', () => {
    const archivio = creaArchivio(null)
    archivio.salvaStato('01-saluti/v01', IMPARATO)
    const letto = archivio.leggiStato('01-saluti/v01') as { gradino: number }
    letto.gradino = 9
    expect(archivio.leggiStato('01-saluti/v01')).toEqual(IMPARATO)
  })

  it('converte alla lettura la versione 1 e la riscrive nel formato nuovo alla prima registrazione', () => {
    const testo = JSON.stringify({
      versione: 1,
      livelli: {
        '01-saluti/v01': 'consolidato',
        '01-saluti/v02': 'da-ripassare',
        '01-saluti/v03': 'normale',
      },
    })
    const salvataggio = new SalvataggioFinto()
    salvataggio.dati.set(CHIAVE_PROGRESSI, testo)
    const archivio = creaArchivio(salvataggio, CHIAVE_PROGRESSI, OGGI)
    const imparatoOggi = { stato: 'imparato', gradino: 1, controllo: OGGI, ultimaVista: OGGI }
    expect(archivio.leggiStato('01-saluti/v01')).toEqual(imparatoOggi)
    expect(archivio.leggiStato('01-saluti/v02')).toEqual({ stato: 'da-riprendere' })
    expect(archivio.leggiStato('01-saluti/v03')).toEqual({ stato: 'nuovo' })
    for (const id of ['01-saluti/v01', '01-saluti/v02', '01-saluti/v03']) {
      expect(archivio.leggiImportanza(id)).toBe(2)
    }
    expect(salvataggio.dati.get(CHIAVE_PROGRESSI)).toBe(testo)
    archivio.salvaImportanza('01-saluti/f01', 3)
    expect(contenuto(salvataggio)).toEqual({
      versione: 3,
      elementi: {
        '01-saluti/v01': { stato: imparatoOggi },
        '01-saluti/v02': { stato: { stato: 'da-riprendere' } },
        '01-saluti/f01': { importanza: 3 },
      },
    })
  })

  it('converte alla lettura la versione 2 lasciando l\'importanza invariata', () => {
    const testo = JSON.stringify({
      versione: 2,
      elementi: {
        '01-saluti/v01': { livello: 'consolidato', importanza: 3 },
        '01-saluti/v02': { livello: 'da-ripassare' },
        '01-saluti/v03': { livello: 'normale', importanza: 0 },
        '01-saluti/v04': { importanza: 1 },
        'eliminata/f09': { livello: 'consolidato', importanza: 0 },
      },
    })
    const salvataggio = new SalvataggioFinto()
    salvataggio.dati.set(CHIAVE_PROGRESSI, testo)
    const archivio = creaArchivio(salvataggio, CHIAVE_PROGRESSI, OGGI)
    const imparatoOggi = { stato: 'imparato', gradino: 1, controllo: OGGI, ultimaVista: OGGI }
    expect(archivio.leggiStato('01-saluti/v01')).toEqual(imparatoOggi)
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(3)
    expect(archivio.leggiStato('01-saluti/v02')).toEqual({ stato: 'da-riprendere' })
    expect(archivio.leggiImportanza('01-saluti/v02')).toBe(2)
    expect(archivio.leggiStato('01-saluti/v03')).toEqual({ stato: 'nuovo' })
    expect(archivio.leggiImportanza('01-saluti/v03')).toBe(0)
    expect(archivio.leggiStato('01-saluti/v04')).toEqual({ stato: 'nuovo' })
    expect(archivio.leggiImportanza('01-saluti/v04')).toBe(1)
    expect(salvataggio.dati.get(CHIAVE_PROGRESSI)).toBe(testo)
    archivio.salvaStato('01-saluti/f01', { stato: 'nel-gruppo', serie: 0 })
    expect(contenuto(salvataggio)).toEqual({
      versione: 3,
      elementi: {
        '01-saluti/v01': { stato: imparatoOggi, importanza: 3 },
        '01-saluti/v02': { stato: { stato: 'da-riprendere' } },
        '01-saluti/v03': { importanza: 0 },
        '01-saluti/v04': { importanza: 1 },
        'eliminata/f09': { stato: imparatoOggi, importanza: 0 },
        '01-saluti/f01': { stato: { stato: 'nel-gruppo', serie: 0 } },
      },
    })
  })

  it('il controllo dei consolidati convertiti scade nel giorno locale di oggi', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 15, 23, 30))
    const archivio = creaArchivio(
      salvatoCon({ versione: 1, livelli: { '01-saluti/v01': 'consolidato' } }),
    )
    expect(archivio.leggiStato('01-saluti/v01')).toEqual({
      stato: 'imparato',
      gradino: 1,
      controllo: giornoLocale(new Date(2026, 2, 15)),
      ultimaVista: '2026-03-15',
    })
  })

  it('conserva gli id salvati che nessuno legge', () => {
    const salvataggio = salvatoCon({
      versione: 3,
      elementi: { 'eliminata/f09': { stato: IMPARATO, importanza: 0 } },
    })
    creaArchivio(salvataggio).salvaStato('01-saluti/v01', { stato: 'da-riprendere' })
    expect(contenuto(salvataggio)).toEqual({
      versione: 3,
      elementi: {
        'eliminata/f09': { stato: IMPARATO, importanza: 0 },
        '01-saluti/v01': { stato: { stato: 'da-riprendere' } },
      },
    })
  })

  it('uno stato sconosciuto o incompleto vale "nuovo"', () => {
    const casi: Record<string, unknown> = {
      '01-saluti/v01': { stato: { stato: 'esperto' } },
      '01-saluti/v02': { stato: 'imparato' },
      '01-saluti/v03': { stato: { stato: 'nel-gruppo' } },
      '01-saluti/v04': { stato: { stato: 'nel-gruppo', serie: 3 } },
      '01-saluti/v05': { stato: { stato: 'nel-gruppo', serie: 1.5 } },
      '01-saluti/v06': { stato: { stato: 'imparato', gradino: 2, controllo: '2026-11-09' } },
      '01-saluti/v07': { stato: { ...IMPARATO, gradino: 0 } },
      '01-saluti/v08': { stato: { ...IMPARATO, gradino: '2' } },
      '01-saluti/v09': { stato: { ...IMPARATO, controllo: 'domani' } },
      '01-saluti/v10': { stato: { ...IMPARATO, ultimaVista: 20261102 } },
      '01-saluti/v11': 'imparato',
      '01-saluti/v12': { stato: null },
      '01-saluti/v13': { stato: { stato: 'nel-gruppo', serie: 2 } },
      '01-saluti/v14': { stato: IMPARATO, importanza: 3 },
    }
    const archivio = creaArchivio(salvatoCon({ versione: 3, elementi: casi }))
    for (let i = 1; i <= 12; i++) {
      const id = `01-saluti/v${String(i).padStart(2, '0')}`
      expect(archivio.leggiStato(id), id).toEqual({ stato: 'nuovo' })
    }
    expect(archivio.leggiStato('01-saluti/v13')).toEqual({ stato: 'nel-gruppo', serie: 2 })
    expect(archivio.leggiStato('01-saluti/v14')).toEqual(IMPARATO)
    expect(archivio.leggiStato('toString')).toEqual({ stato: 'nuovo' })
  })

  it('un livello sconosciuto nei formati a tre livelli vale "nuovo"', () => {
    const da1 = creaArchivio(
      salvatoCon({
        versione: 1,
        livelli: { '01-saluti/v01': 'esperto', '01-saluti/v02': 4, '01-saluti/v03': 'da-ripassare' },
      }),
    )
    expect(da1.leggiStato('01-saluti/v01')).toEqual({ stato: 'nuovo' })
    expect(da1.leggiStato('01-saluti/v02')).toEqual({ stato: 'nuovo' })
    expect(da1.leggiStato('01-saluti/v03')).toEqual({ stato: 'da-riprendere' })
    const da2 = creaArchivio(
      salvatoCon({
        versione: 2,
        elementi: {
          '01-saluti/v01': { livello: 'esperto', importanza: 3 },
          '01-saluti/v02': 'consolidato',
        },
      }),
    )
    expect(da2.leggiStato('01-saluti/v01')).toEqual({ stato: 'nuovo' })
    expect(da2.leggiImportanza('01-saluti/v01')).toBe(3)
    expect(da2.leggiStato('01-saluti/v02')).toEqual({ stato: 'nuovo' })
  })

  it('un\'importanza sconosciuta vale 2, senza toccare lo stato', () => {
    const archivio = creaArchivio(
      salvatoCon({
        versione: 3,
        elementi: {
          '01-saluti/v01': { stato: { stato: 'da-riprendere' }, importanza: 7 },
          '01-saluti/v02': { importanza: '3' },
          '01-saluti/v03': { importanza: 1.5 },
          '01-saluti/v04': { importanza: 0 },
        },
      }),
    )
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(2)
    expect(archivio.leggiStato('01-saluti/v01')).toEqual({ stato: 'da-riprendere' })
    expect(archivio.leggiImportanza('01-saluti/v02')).toBe(2)
    expect(archivio.leggiImportanza('01-saluti/v03')).toBe(2)
    expect(archivio.leggiImportanza('01-saluti/v04')).toBe(0)
    expect(archivio.leggiImportanza('toString')).toBe(2)
  })

  it.each([
    ['non JSON', '{non è json'],
    ['JSON di forma sbagliata', JSON.stringify([1, 2, 3])],
    ['elementi non oggetto', JSON.stringify({ versione: 3, elementi: [{ importanza: 3 }] })],
    ['elementi v2 non oggetto', JSON.stringify({ versione: 2, elementi: [{ livello: 'normale' }] })],
    ['livelli non oggetto', JSON.stringify({ versione: 1, livelli: ['normale'] })],
    ['null', 'null'],
  ])('una chiave illeggibile (%s) riparte da progressi vuoti', (_caso, testo) => {
    const salvataggio = new SalvataggioFinto()
    salvataggio.dati.set(CHIAVE_PROGRESSI, testo)
    const archivio = creaArchivio(salvataggio)
    expect(archivio.leggiStato('01-saluti/v01')).toEqual({ stato: 'nuovo' })
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(2)
    expect(salvataggio.dati.get(CHIAVE_PROGRESSI)).toBe(testo)
    archivio.salvaStato('01-saluti/v01', { stato: 'da-riprendere' })
    expect(contenuto(salvataggio)).toEqual({
      versione: 3,
      elementi: { '01-saluti/v01': { stato: { stato: 'da-riprendere' } } },
    })
  })

  it('una versione sconosciuta riparte da progressi vuoti e riscrive la chiave al primo salvataggio', () => {
    const testo = JSON.stringify({
      versione: 4,
      elementi: { '01-saluti/v01': { stato: IMPARATO, importanza: 3 } },
    })
    const salvataggio = new SalvataggioFinto()
    salvataggio.dati.set(CHIAVE_PROGRESSI, testo)
    const archivio = creaArchivio(salvataggio)
    expect(archivio.leggiStato('01-saluti/v01')).toEqual({ stato: 'nuovo' })
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(2)
    expect(salvataggio.dati.get(CHIAVE_PROGRESSI)).toBe(testo)
    archivio.salvaImportanza('01-saluti/v02', 1)
    expect(contenuto(salvataggio)).toEqual({
      versione: 3,
      elementi: { '01-saluti/v02': { importanza: 1 } },
    })
  })

  it('un salvataggio che lancia in lettura lascia lavorare l\'archivio in memoria', () => {
    const salvataggio = new SalvataggioCheLancia(true, false)
    let archivio!: ReturnType<typeof creaArchivio>
    expect(() => {
      archivio = creaArchivio(salvataggio)
    }).not.toThrow()
    expect(archivio.leggiStato('01-saluti/v01')).toEqual({ stato: 'nuovo' })
    expect(() => archivio.salvaStato('01-saluti/v01', { stato: 'da-riprendere' })).not.toThrow()
    expect(() => archivio.salvaImportanza('01-saluti/v01', 3)).not.toThrow()
    expect(archivio.leggiStato('01-saluti/v01')).toEqual({ stato: 'da-riprendere' })
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(3)
  })

  it('un salvataggio che lancia in scrittura lascia lavorare l\'archivio in memoria', () => {
    const salvataggio = new SalvataggioCheLancia(false, true)
    const archivio = creaArchivio(salvataggio)
    expect(() => archivio.salvaStato('01-saluti/v01', IMPARATO)).not.toThrow()
    expect(archivio.leggiStato('01-saluti/v01')).toEqual(IMPARATO)
    expect(() => archivio.salvaStato('01-saluti/v01', { stato: 'nuovo' })).not.toThrow()
    expect(archivio.leggiStato('01-saluti/v01')).toEqual({ stato: 'nuovo' })
    expect(() => archivio.salvaImportanza('01-saluti/v01', 0)).not.toThrow()
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(0)
  })

  it('usa localStorage come salvataggio predefinito', () => {
    const archivio = creaArchivio()
    archivio.salvaStato('01-saluti/v01', IMPARATO)
    archivio.salvaImportanza('01-saluti/v01', 3)
    expect(JSON.parse(localStorage.getItem(CHIAVE_PROGRESSI) ?? 'null')).toEqual({
      versione: 3,
      elementi: { '01-saluti/v01': { stato: IMPARATO, importanza: 3 } },
    })
    expect(creaArchivio().leggiStato('01-saluti/v01')).toEqual(IMPARATO)
    expect(creaArchivio().leggiImportanza('01-saluti/v01')).toBe(3)
  })

  it('con una chiave data legge e scrive solo quella', () => {
    const testo = JSON.stringify({
      versione: 3,
      elementi: { '01-saluti/v01': { stato: IMPARATO, importanza: 3 } },
    })
    const salvataggio = new SalvataggioFinto()
    salvataggio.dati.set(CHIAVE_PROGRESSI, testo)
    const archivio = creaArchivio(salvataggio, 'maies.kids.progressi')
    expect(archivio.leggiStato('01-saluti/v01')).toEqual({ stato: 'nuovo' })
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(2)
    archivio.salvaStato('01-saluti/v01', { stato: 'da-riprendere' })
    expect(JSON.parse(salvataggio.dati.get('maies.kids.progressi') ?? 'null')).toEqual({
      versione: 3,
      elementi: { '01-saluti/v01': { stato: { stato: 'da-riprendere' } } },
    })
    expect(salvataggio.dati.get(CHIAVE_PROGRESSI)).toBe(testo)
  })

  it('lavora in memoria quando localStorage non è disponibile', () => {
    vi.stubGlobal('localStorage', undefined)
    const archivio = creaArchivio()
    expect(archivio.leggiStato('01-saluti/v01')).toEqual({ stato: 'nuovo' })
    expect(() => archivio.salvaStato('01-saluti/v01', { stato: 'da-riprendere' })).not.toThrow()
    expect(() => archivio.salvaImportanza('01-saluti/v01', 1)).not.toThrow()
    expect(archivio.leggiStato('01-saluti/v01')).toEqual({ stato: 'da-riprendere' })
    expect(archivio.leggiImportanza('01-saluti/v01')).toBe(1)
  })

  describe('ponte verso i livelli usati dalla sessione', () => {
    it('legge lo stato come livello', () => {
      const archivio = creaArchivio(null, CHIAVE_PROGRESSI, OGGI)
      expect(archivio.leggiLivello('01-saluti/v01')).toBe('normale')
      archivio.salvaStato('01-saluti/v01', { stato: 'da-riprendere' })
      expect(archivio.leggiLivello('01-saluti/v01')).toBe('da-ripassare')
      archivio.salvaStato('01-saluti/v01', { stato: 'nel-gruppo', serie: 1 })
      expect(archivio.leggiLivello('01-saluti/v01')).toBe('da-ripassare')
      archivio.salvaStato('01-saluti/v01', IMPARATO)
      expect(archivio.leggiLivello('01-saluti/v01')).toBe('consolidato')
    })

    it('salva un livello come lo stato in cui la conversione lo trasforma', () => {
      const salvataggio = new SalvataggioFinto()
      const archivio = creaArchivio(salvataggio, CHIAVE_PROGRESSI, OGGI)
      archivio.salvaLivello('01-saluti/v01', 'consolidato')
      archivio.salvaLivello('01-saluti/v02', 'da-ripassare')
      archivio.salvaLivello('01-saluti/v03', 'normale')
      expect(contenuto(salvataggio)).toEqual({
        versione: 3,
        elementi: {
          '01-saluti/v01': {
            stato: { stato: 'imparato', gradino: 1, controllo: OGGI, ultimaVista: OGGI },
          },
          '01-saluti/v02': { stato: { stato: 'da-riprendere' } },
        },
      })
      expect(archivio.leggiLivello('01-saluti/v01')).toBe('consolidato')
      expect(archivio.leggiLivello('01-saluti/v02')).toBe('da-ripassare')
      expect(archivio.leggiLivello('01-saluti/v03')).toBe('normale')
    })
  })
})
