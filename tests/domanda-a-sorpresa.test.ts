// @vitest-environment node
/// <reference types="node" />
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  componiNotifica,
  esegui,
  leggiLezioni,
  scegliDomanda,
  scegliVocabolo,
} from '../scripts/domanda-a-sorpresa.mjs'

type LezioneMinima = { id: string; vocabulary: { id: string; it: string }[] }

function lezione(numero: number, parole: string[]): LezioneMinima {
  const nn = String(numero).padStart(2, '0')
  return {
    id: `${nn}-lezione`,
    vocabulary: parole.map((it, i) => ({ id: `v${String(i + 1).padStart(2, '0')}`, it })),
  }
}

// Una casualità che restituisce sempre lo stesso valore in [0, 1).
const fissa = (valore: number) => () => valore

// Conta quale vocabolo esce per ogni valore di casualità su una griglia fitta di [0, 1).
function frequenze(lezioni: LezioneMinima[], passi = 10000) {
  const conti = new Map<string, number>()
  for (let i = 0; i < passi; i++) {
    const scelto = scegliVocabolo(lezioni, fissa((i + 0.5) / passi))
    if (scelto) conti.set(scelto.idGlobale, (conti.get(scelto.idGlobale) ?? 0) + 1)
  }
  return conti
}

describe('scegliVocabolo', () => {
  it('senza vocaboli non sceglie nulla', () => {
    expect(scegliVocabolo([], fissa(0.3))).toBeNull()
    expect(scegliVocabolo([lezione(1, [])], fissa(0.3))).toBeNull()
  })

  it('restituisce id globale e parola italiana del vocabolo scelto', () => {
    expect(scegliVocabolo([lezione(4, ['cane'])], fissa(0.9))).toEqual({
      idGlobale: '04-lezione/v01',
      it: 'cane',
    })
  })

  it('pesa 3 i vocaboli delle tre lezioni più recenti e 1 gli altri', () => {
    // In ordine sparso: conta il numero di lezione, non la posizione.
    const lezioni = [lezione(5, ['e']), lezione(1, ['a']), lezione(3, ['c']), lezione(2, ['b']), lezione(4, ['d'])]
    const conti = frequenze(lezioni)
    // Peso totale 1 + 1 + 3 + 3 + 3 = 11.
    expect(conti.get('01-lezione/v01')).toBe(Math.round(10000 / 11))
    expect(conti.get('02-lezione/v01')).toBe(Math.round(10000 / 11))
    for (const id of ['03-lezione/v01', '04-lezione/v01', '05-lezione/v01']) {
      expect(Math.abs(conti.get(id)! - 30000 / 11)).toBeLessThanOrEqual(1)
    }
  })

  it('è uniforme fra i vocaboli dello stesso peso, anche nella stessa lezione', () => {
    const conti = frequenze([lezione(1, ['a', 'b']), lezione(2, ['c']), lezione(3, ['d']), lezione(4, ['e'])])
    // Pesi 1, 1, 3, 3, 3: totale 11.
    // La griglia arrotonda: lo stesso peso vale al più un passo di differenza.
    const vicini = (a: string, b: string) =>
      expect(Math.abs(conti.get(a)! - conti.get(b)!)).toBeLessThanOrEqual(1)
    vicini('01-lezione/v01', '01-lezione/v02')
    vicini('02-lezione/v01', '03-lezione/v01')
    vicini('03-lezione/v01', '04-lezione/v01')
    expect(Math.abs(conti.get('02-lezione/v01')! - 30000 / 11)).toBeLessThanOrEqual(1)
  })

  it('con meno di tre lezioni le pesa tutte allo stesso modo', () => {
    const conti = frequenze([lezione(1, ['a']), lezione(2, ['b'])])
    expect(conti.get('01-lezione/v01')).toBe(5000)
    expect(conti.get('02-lezione/v01')).toBe(5000)
  })

  it('usa la casualità data: gli estremi scelgono il primo e l’ultimo vocabolo', () => {
    const lezioni = [lezione(1, ['a']), lezione(2, ['b'])]
    expect(scegliVocabolo(lezioni, fissa(0))?.it).toBe('a')
    expect(scegliVocabolo(lezioni, fissa(0.999999))?.it).toBe('b')
  })
})

describe('componiNotifica', () => {
  it('ha titolo maies, la domanda con la parola com’è scritta e l’icona a fumetto', () => {
    const notifica = componiNotifica({ idGlobale: '03-salute/v07', it: 'pesca (frutto)' })
    expect(notifica.titolo).toBe('maies')
    expect(notifica.testo).toBe('Come si dice «pesca (frutto)»?')
    expect(notifica.etichette).toEqual(['speech_balloon'])
  })

  it('apre l’allenamento vocaboli sulla parola, con l’id codificato', () => {
    const notifica = componiNotifica({ idGlobale: '03-salute/v07', it: 'cane' })
    expect(notifica.indirizzo).toBe('https://maies.chosko.com/#/vocaboli?parola=03-salute%2Fv07')
  })
})

describe('scegliDomanda', () => {
  it('compone la notifica del vocabolo scelto', () => {
    expect(scegliDomanda([lezione(2, ['gatto'])], fissa(0.5))?.testo).toBe('Come si dice «gatto»?')
  })

  it('senza vocaboli non c’è notifica', () => {
    expect(scegliDomanda([], fissa(0.5))).toBeNull()
  })
})

describe('leggiLezioni', () => {
  let cartella: string
  beforeEach(() => {
    cartella = mkdtempSync(join(tmpdir(), 'maies-lezioni-'))
  })
  afterEach(() => rmSync(cartella, { recursive: true, force: true }))

  it('legge i file .json della cartella', () => {
    writeFileSync(join(cartella, '01-lezione.json'), JSON.stringify(lezione(1, ['cane'])))
    writeFileSync(join(cartella, 'nota.txt'), 'non una lezione')
    expect(leggiLezioni(cartella)).toEqual([lezione(1, ['cane'])])
  })

  it('una cartella che non esiste vale zero lezioni', () => {
    expect(leggiLezioni(join(cartella, 'manca'))).toEqual([])
  })

  it('legge le lezioni reali dell’edizione principale', () => {
    const reale = fileURLToPath(new URL('../contenuti/lezioni/', import.meta.url))
    expect(scegliDomanda(leggiLezioni(reale), fissa(0.5))).not.toBeNull()
  })
})

describe('esegui', () => {
  const canale = 'canale-segretissimo-1234'
  const lezioni = [lezione(1, ['cane'])]

  function registro() {
    const righe: string[] = []
    return { righe, log: (riga: string) => void righe.push(riga) }
  }

  it('pubblica la notifica su ntfy.sh con una sola richiesta', async () => {
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }))
    const { righe, log } = registro()
    await esegui({ canale, lezioni, casuale: fissa(0.5), fetch, log })

    expect(fetch).toHaveBeenCalledTimes(1)
    const [indirizzo, opzioni] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(indirizzo).toBe(`https://ntfy.sh/${canale}`)
    expect(opzioni.method).toBe('POST')
    expect(opzioni.body).toBe('Come si dice «cane»?')
    expect(opzioni.headers).toEqual({
      Title: 'maies',
      Click: 'https://maies.chosko.com/#/vocaboli?parola=01-lezione%2Fv01',
      Tags: 'speech_balloon',
    })
    expect(righe.join('\n')).not.toContain(canale)
  })

  it('senza canale non pubblica e termina senza errore, scrivendo il motivo', async () => {
    const fetch = vi.fn()
    const { righe, log } = registro()
    await expect(esegui({ canale: undefined, lezioni, casuale: fissa(0.5), fetch, log })).resolves.toBeUndefined()
    await expect(esegui({ canale: '', lezioni, casuale: fissa(0.5), fetch, log })).resolves.toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
    expect(righe.join('\n')).toContain('NTFY_TOPIC')
  })

  it('senza vocaboli non pubblica e termina senza errore, scrivendo il motivo', async () => {
    const fetch = vi.fn()
    const { righe, log } = registro()
    await expect(esegui({ canale, lezioni: [], casuale: fissa(0.5), fetch, log })).resolves.toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
    expect(righe.join('\n')).toMatch(/vocabol/i)
    expect(righe.join('\n')).not.toContain(canale)
  })

  it('se ntfy.sh risponde con un errore termina con errore, senza nominare il canale', async () => {
    const fetch = vi.fn(async () => new Response('no', { status: 500 }))
    const { righe, log } = registro()
    const errore = await esegui({ canale, lezioni, casuale: fissa(0.5), fetch, log }).catch((e: Error) => e)
    expect(errore).toBeInstanceOf(Error)
    expect((errore as Error).message).toContain('500')
    expect((errore as Error).message).not.toContain(canale)
    expect(righe.join('\n')).not.toContain(canale)
  })

  it('se ntfy.sh non risponde termina con errore, senza nominare il canale', async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError(`fetch failed: https://ntfy.sh/${canale}`)
    })
    const { log } = registro()
    const errore = await esegui({ canale, lezioni, casuale: fissa(0.5), fetch, log }).catch((e: Error) => e)
    expect(errore).toBeInstanceOf(Error)
    expect((errore as Error).message).not.toContain(canale)
  })
})

describe('script npm', () => {
  it('domanda-a-sorpresa esegue lo script', () => {
    const pacchetto = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
    expect(pacchetto.scripts['domanda-a-sorpresa']).toBe('node scripts/domanda-a-sorpresa.mjs')
  })

  it('nessuna dipendenza nuova: lo script importa solo moduli di Node', () => {
    const sorgente = readFileSync(new URL('../scripts/domanda-a-sorpresa.mjs', import.meta.url), 'utf8')
    const importati = [...sorgente.matchAll(/^import .* from '([^']+)'/gm)].map((m) => m[1])
    expect(importati.length).toBeGreaterThan(0)
    for (const modulo of importati) expect(modulo).toMatch(/^node:/)
  })
})
