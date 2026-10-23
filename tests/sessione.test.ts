import { describe, it, expect } from 'vitest'
import { costruisciCatalogo } from '../src/contenuti/catalogo'
import type { Lezione } from '../src/contenuti/schema'
import { CHIAVE_PROGRESSI, creaArchivio } from '../src/ripasso/archivio'
import { creaSessione } from '../src/ripasso/sessione'

const fissa = (valore: number) => () => valore

function conSeme(seme: number): () => number {
  let stato = seme >>> 0
  return () => {
    stato = (stato + 0x6d2b79f5) >>> 0
    let t = stato
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

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

function lezione(id: string, frasi: number, vocaboli: number): Lezione {
  return {
    id,
    title: `Lezione ${id}`,
    sentences: Array.from({ length: frasi }, (_, i) => ({
      id: `f${i + 1}`,
      it: `Frase ${i + 1}.`,
      en: `Sentence ${i + 1}.`,
      alternatives: [],
    })),
    vocabulary: Array.from({ length: vocaboli }, (_, i) => ({
      id: `v${i + 1}`,
      it: `parola ${i + 1}`,
      en: [`word ${i + 1}`],
    })),
    grammar: [],
  }
}

function catalogoDi(...lezioni: Lezione[]) {
  return costruisciCatalogo(
    Object.fromEntries(lezioni.map((l) => [`../../contenuti/lezioni/${l.id}.json`, l])),
  )
}

function proposte(sessione: { prossimoElemento(): { idGlobale: string } | null }, quante: number) {
  return Array.from({ length: quante }, () => sessione.prossimoElemento()?.idGlobale)
}

describe('sessione di ripasso', () => {
  it('restituisce null quando il catalogo non ha elementi del tipo della sessione', () => {
    const soloVocaboli = catalogoDi(lezione('01-a', 0, 2))
    const archivio = creaArchivio(null)
    expect(creaSessione('frasi', { catalogo: soloVocaboli, archivio }).prossimoElemento()).toBeNull()
    expect(
      creaSessione('vocaboli', { catalogo: catalogoDi(), archivio }).prossimoElemento(),
    ).toBeNull()
  })

  it("restituisce l'elemento del catalogo con il suo id globale", () => {
    const catalogo = catalogoDi(lezione('01-a', 1, 0))
    const elemento = creaSessione('frasi', {
      catalogo,
      archivio: creaArchivio(null),
      casualita: fissa(0),
    }).prossimoElemento()
    expect(elemento).toBe(catalogo.frasi[0])
    expect(elemento?.idGlobale).toBe('01-a/f1')
  })

  it('ripropone a ogni richiesta un candidato unico', () => {
    const sessione = creaSessione('vocaboli', {
      catalogo: catalogoDi(lezione('01-a', 3, 1)),
      archivio: creaArchivio(null),
      casualita: conSeme(1),
    })
    expect(proposte(sessione, 5)).toEqual(Array(5).fill('01-a/v1'))
  })

  it('con 2 candidati esclude solo l’ultimo proposto e quindi li alterna', () => {
    const sessione = creaSessione('frasi', {
      catalogo: catalogoDi(lezione('01-a', 2, 0)),
      archivio: creaArchivio(null),
      casualita: fissa(0),
    })
    expect(proposte(sessione, 6)).toEqual([
      '01-a/f1',
      '01-a/f2',
      '01-a/f1',
      '01-a/f2',
      '01-a/f1',
      '01-a/f2',
    ])
  })

  it('con 3 candidati esclude gli ultimi 2 proposti', () => {
    const sessione = creaSessione('frasi', {
      catalogo: catalogoDi(lezione('01-a', 3, 0)),
      archivio: creaArchivio(null),
      casualita: conSeme(7),
    })
    const sequenza = proposte(sessione, 30)
    for (let i = 2; i < sequenza.length; i++) {
      expect(new Set(sequenza.slice(i - 2, i + 1)).size).toBe(3)
    }
  })

  it('con più di 4 candidati esclude gli ultimi 3 proposti, non di più', () => {
    const sessione = creaSessione('vocaboli', {
      catalogo: catalogoDi(lezione('01-a', 0, 3), lezione('02-b', 0, 3)),
      archivio: creaArchivio(null),
      casualita: fissa(0),
    })
    // Con casualità 0 il selettore sceglie il primo candidato ammesso: si ripropone appena esce dalla finestra.
    expect(proposte(sessione, 8)).toEqual([
      '01-a/v1',
      '01-a/v2',
      '01-a/v3',
      '02-b/v1',
      '01-a/v1',
      '01-a/v2',
      '01-a/v3',
      '02-b/v1',
    ])

    const casuale = creaSessione('vocaboli', {
      catalogo: catalogoDi(lezione('01-a', 0, 3), lezione('02-b', 0, 3)),
      archivio: creaArchivio(null),
      casualita: conSeme(3),
    })
    const sequenza = proposte(casuale, 200)
    for (let i = 3; i < sequenza.length; i++) {
      expect(new Set(sequenza.slice(i - 3, i + 1)).size).toBe(4)
    }
  })

  it("registra esito cambia il livello e lo salva subito nell'archivio", () => {
    const salvataggio = new SalvataggioFinto()
    const archivio = creaArchivio(salvataggio)
    const sessione = creaSessione('frasi', {
      catalogo: catalogoDi(lezione('01-a', 2, 0)),
      archivio,
    })

    sessione.registraEsito('01-a/f1', 'sbagliato')
    expect(archivio.leggiLivello('01-a/f1')).toBe('da-ripassare')
    expect(salvataggio.scritture).toBe(1)
    expect(JSON.parse(salvataggio.getItem(CHIAVE_PROGRESSI) ?? '{}').elementi).toEqual({
      '01-a/f1': { livello: 'da-ripassare' },
    })

    sessione.registraEsito('01-a/f1', 'giusto')
    sessione.registraEsito('01-a/f2', 'giusto')
    expect(archivio.leggiLivello('01-a/f1')).toBe('normale')
    expect(archivio.leggiLivello('01-a/f2')).toBe('consolidato')
    expect(salvataggio.scritture).toBe(3)
  })

  it('un esito che cambia il livello cambia la frequenza di estrazione', () => {
    const catalogo = catalogoDi(lezione('01-a', 30, 0))
    const conta = (sessione: { prossimoElemento(): { idGlobale: string } | null }) => {
      const conteggi = new Map<string, number>()
      for (const id of proposte(sessione, 3000)) conteggi.set(id!, (conteggi.get(id!) ?? 0) + 1)
      return conteggi
    }

    const prima = conta(
      creaSessione('frasi', { catalogo, archivio: creaArchivio(null), casualita: conSeme(11) }),
    )

    const archivio = creaArchivio(null)
    const sessione = creaSessione('frasi', { catalogo, archivio, casualita: conSeme(11) })
    sessione.registraEsito('01-a/f1', 'sbagliato')
    sessione.registraEsito('01-a/f2', 'giusto')
    const dopo = conta(sessione)

    expect(dopo.get('01-a/f1')!).toBeGreaterThan(prima.get('01-a/f1')! * 1.5)
    expect(dopo.get('01-a/f2')!).toBeLessThan(prima.get('01-a/f2')! * 0.6)
    for (let i = 3; i <= 30; i++) {
      expect(dopo.get(`01-a/f${i}`)!).toBeLessThan(dopo.get('01-a/f1')!)
      expect(dopo.get(`01-a/f${i}`)!).toBeGreaterThan(dopo.get('01-a/f2')!)
    }
  })

  it('ignora senza errori un id sconosciuto al catalogo', () => {
    const salvataggio = new SalvataggioFinto()
    const archivio = creaArchivio(salvataggio)
    const sessione = creaSessione('frasi', { catalogo: catalogoDi(lezione('01-a', 1, 1)), archivio })

    expect(() => sessione.registraEsito('99-z/f1', 'sbagliato')).not.toThrow()
    expect(salvataggio.scritture).toBe(0)
    expect(archivio.leggiLivello('99-z/f1')).toBe('normale')
  })

  it('tiene separate la sessione di frasi e quella di vocaboli', () => {
    const catalogo = catalogoDi(lezione('01-a', 2, 2))
    const salvataggio = new SalvataggioFinto()
    const archivio = creaArchivio(salvataggio)
    const frasi = creaSessione('frasi', { catalogo, archivio, casualita: conSeme(5) })
    const vocaboli = creaSessione('vocaboli', { catalogo, archivio, casualita: conSeme(5) })

    for (let i = 0; i < 20; i++) {
      expect(frasi.prossimoElemento()?.idGlobale).toMatch(/^01-a\/f\d$/)
      expect(vocaboli.prossimoElemento()?.idGlobale).toMatch(/^01-a\/v\d$/)
    }

    // Una sessione registra solo gli esiti degli elementi del proprio tipo.
    frasi.registraEsito('01-a/v1', 'sbagliato')
    vocaboli.registraEsito('01-a/f1', 'sbagliato')
    expect(salvataggio.scritture).toBe(0)

    vocaboli.registraEsito('01-a/v1', 'sbagliato')
    expect(archivio.leggiLivello('01-a/v1')).toBe('da-ripassare')
    expect(archivio.leggiLivello('01-a/f1')).toBe('normale')
  })

  it('tiene la finestra di esclusione per sessione, non in comune', () => {
    const catalogo = catalogoDi(lezione('01-a', 2, 0))
    const archivio = creaArchivio(null)
    const prima = creaSessione('frasi', { catalogo, archivio, casualita: fissa(0) })
    const seconda = creaSessione('frasi', { catalogo, archivio, casualita: fissa(0) })
    expect(prima.prossimoElemento()?.idGlobale).toBe('01-a/f1')
    expect(seconda.prossimoElemento()?.idGlobale).toBe('01-a/f1')
  })

  it("due sessioni sullo stesso archivio vedono gli stessi progressi a ogni richiesta", () => {
    const catalogo = catalogoDi(lezione('01-a', 2, 0))
    const archivio = creaArchivio(null)
    const prima = creaSessione('frasi', { catalogo, archivio })
    const seconda = creaSessione('frasi', { catalogo, archivio, casualita: fissa(0.5) })
    const terza = creaSessione('frasi', { catalogo, archivio, casualita: fissa(0.5) })

    // Pesi 3 : 3, la metà cade sul secondo candidato.
    expect(terza.prossimoElemento()?.idGlobale).toBe('01-a/f2')
    // Pesi 6 : 3 dopo l'errore registrato dall'altra sessione, la metà cade sul primo.
    prima.registraEsito('01-a/f1', 'sbagliato')
    expect(seconda.prossimoElemento()?.idGlobale).toBe('01-a/f1')
  })

  it("usa catalogo, archivio e casualità dell'app quando non sono indicati", () => {
    expect(() => creaSessione('frasi').prossimoElemento()).not.toThrow()
    expect(() => creaSessione('vocaboli').registraEsito('inesistente/v1', 'giusto')).not.toThrow()
  })
})
