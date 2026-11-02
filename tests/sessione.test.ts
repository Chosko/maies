import { describe, it, expect } from 'vitest'
import { costruisciCatalogo } from '../src/contenuti/catalogo'
import type { Lezione } from '../src/contenuti/schema'
import type { StatoApprendimento } from '../src/ripasso/apprendimento'
import { CHIAVE_PROGRESSI, creaArchivio } from '../src/ripasso/archivio'
import type { ArchivioProgressi } from '../src/ripasso/archivio'
import { creaSessione } from '../src/ripasso/sessione'
import type { Proposta } from '../src/ripasso/sessione'

const fissa = (valore: number) => () => valore

const OGGI = '2026-11-02'

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

function idDi(proposta: Proposta<{ idGlobale: string }>): string {
  return proposta.caso === 'elemento' ? proposta.elemento.idGlobale : proposta.caso
}

function proposte(sessione: { prossimoElemento(): Proposta<{ idGlobale: string }> }, quante: number) {
  return Array.from({ length: quante }, () => idDi(sessione.prossimoElemento()))
}

function nelGruppo(archivio: ArchivioProgressi, ids: readonly string[]): string[] {
  return ids.filter((id) => archivio.leggiStato(id).stato === 'nel-gruppo')
}

function imparato(controllo: string, ultimaVista = '2026-10-01', gradino = 1): StatoApprendimento {
  return { stato: 'imparato', gradino, controllo, ultimaVista }
}

const frasiDi = (lezioneId: string, quante: number) =>
  Array.from({ length: quante }, (_, i) => `${lezioneId}/f${i + 1}`)

describe('sessione di ripasso', () => {
  describe('prossimo elemento', () => {
    it('restituisce nessun materiale quando il catalogo non ha elementi del tipo della sessione', () => {
      const soloVocaboli = catalogoDi(lezione('01-a', 0, 2))
      const archivio = creaArchivio(null)
      expect(creaSessione('frasi', { catalogo: soloVocaboli, archivio }).prossimoElemento()).toEqual({
        caso: 'nessun-materiale',
      })
      expect(creaSessione('vocaboli', { catalogo: catalogoDi(), archivio }).prossimoElemento()).toEqual({
        caso: 'nessun-materiale',
      })
    })

    it("restituisce l'elemento del catalogo con il suo id globale e la sua importanza", () => {
      const catalogo = catalogoDi(lezione('01-a', 1, 0))
      const archivio = creaArchivio(null)
      const sessione = creaSessione('frasi', { catalogo, archivio, casualita: fissa(0) })
      const proposta = sessione.prossimoElemento()
      expect(proposta).toEqual({ caso: 'elemento', elemento: catalogo.frasi[0], importanza: 2 })
      if (proposta.caso !== 'elemento') throw new Error('atteso un elemento')
      expect(proposta.elemento).toBe(catalogo.frasi[0])
      expect(proposta.elemento.idGlobale).toBe('01-a/f1')

      archivio.salvaImportanza('01-a/f1', 3)
      expect(sessione.prossimoElemento()).toMatchObject({ caso: 'elemento', importanza: 3 })
    })

    it('completa il gruppo di 5 frasi prendendo prima la lezione più recente e lo salva', () => {
      const salvataggio = new SalvataggioFinto()
      const archivio = creaArchivio(salvataggio)
      const catalogo = catalogoDi(lezione('01-a', 4, 0), lezione('02-b', 3, 0))
      const sessione = creaSessione('frasi', { catalogo, archivio, casualita: fissa(0), oggi: () => OGGI })

      sessione.prossimoElemento()
      const tutte = [...frasiDi('01-a', 4), ...frasiDi('02-b', 3)]
      expect(nelGruppo(archivio, tutte)).toEqual(['01-a/f1', '01-a/f2', '02-b/f1', '02-b/f2', '02-b/f3'])
      expect(archivio.leggiStato('01-a/f1')).toEqual({ stato: 'nel-gruppo', serie: 0 })
      expect(JSON.parse(salvataggio.getItem(CHIAVE_PROGRESSI) ?? '{}').elementi).toMatchObject({
        '02-b/f1': { stato: { stato: 'nel-gruppo', serie: 0 } },
        '01-a/f2': { stato: { stato: 'nel-gruppo', serie: 0 } },
      })

      // Il gruppo pieno non si completa di nuovo e non si riscrive.
      const scritture = salvataggio.scritture
      proposte(sessione, 10)
      expect(salvataggio.scritture).toBe(scritture)
      expect(nelGruppo(archivio, tutte)).toHaveLength(5)
    })

    it('completa il gruppo di 8 vocaboli', () => {
      const archivio = creaArchivio(null)
      const catalogo = catalogoDi(lezione('01-a', 0, 10))
      creaSessione('vocaboli', { catalogo, archivio, casualita: fissa(0) }).prossimoElemento()
      const tutti = Array.from({ length: 10 }, (_, i) => `01-a/v${i + 1}`)
      expect(nelGruppo(archivio, tutti)).toEqual(tutti.slice(0, 8))
    })

    it('propone solo elementi del gruppo, senza ripetere gli ultimi 3', () => {
      const archivio = creaArchivio(null)
      const catalogo = catalogoDi(lezione('01-a', 8, 0))
      const sessione = creaSessione('frasi', { catalogo, archivio, casualita: conSeme(3) })
      const sequenza = proposte(sessione, 200)
      const gruppo = nelGruppo(archivio, frasiDi('01-a', 8))
      expect(new Set(sequenza)).toEqual(new Set(gruppo))
      for (let i = 3; i < sequenza.length; i++) {
        expect(new Set(sequenza.slice(i - 3, i + 1)).size).toBe(4)
      }
    })

    it('il gruppo resta lo stesso in una sessione successiva sullo stesso archivio', () => {
      const archivio = creaArchivio(null)
      const catalogo = catalogoDi(lezione('01-a', 8, 0))
      creaSessione('frasi', { catalogo, archivio, casualita: fissa(0) }).prossimoElemento()
      const gruppo = nelGruppo(archivio, frasiDi('01-a', 8))
      archivio.salvaImportanza('01-a/f8', 3)

      const seconda = creaSessione('frasi', { catalogo, archivio, casualita: conSeme(9) })
      expect(new Set(proposte(seconda, 50))).toEqual(new Set(gruppo))
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
      expect(proposte(sessione, 6)).toEqual(['01-a/f1', '01-a/f2', '01-a/f1', '01-a/f2', '01-a/f1', '01-a/f2'])
    })

    it('alterna controlli scaduti ed elementi del gruppo, un controllo ogni due proposte', () => {
      const archivio = creaArchivio(null)
      archivio.salvaStato('01-a/f1', imparato('2026-10-20'))
      archivio.salvaStato('01-a/f2', imparato('2026-10-25'))
      const catalogo = catalogoDi(lezione('01-a', 7, 0))
      const sessione = creaSessione('frasi', { catalogo, archivio, casualita: fissa(0), oggi: () => OGGI })

      const sequenza = proposte(sessione, 6)
      const controlli = new Set(['01-a/f1', '01-a/f2'])
      expect(sequenza.map((id) => controlli.has(id))).toEqual([true, false, true, false, true, false])
      // Dal controllo più vecchio.
      expect(sequenza[0]).toBe('01-a/f1')
    })

    it('con il gruppo vuoto propone solo controlli scaduti, poi il ripasso libero', () => {
      const archivio = creaArchivio(null)
      archivio.salvaStato('01-a/f1', imparato('2026-11-10', '2026-10-05'))
      archivio.salvaStato('01-a/f2', imparato('2026-11-01', '2026-10-30'))
      archivio.salvaStato('01-a/f3', imparato('2026-11-12', '2026-10-01'))
      const catalogo = catalogoDi(lezione('01-a', 3, 0))
      const sessione = creaSessione('frasi', { catalogo, archivio, casualita: fissa(0), oggi: () => OGGI })

      // f2 è l'unico controllo scaduto.
      expect(idDi(sessione.prossimoElemento())).toBe('01-a/f2')
      sessione.registraEsito('01-a/f2', 'giusto')
      // Tutto imparato e niente di scaduto: il visto meno di recente.
      expect(idDi(sessione.prossimoElemento())).toBe('01-a/f3')
    })

    it('il turno e gli ultimi proposti vivono solo in memoria', () => {
      const salvataggio = new SalvataggioFinto()
      const archivio = creaArchivio(salvataggio)
      archivio.salvaStato('01-a/f1', imparato('2026-10-20'))
      const catalogo = catalogoDi(lezione('01-a', 4, 0))
      const prima = creaSessione('frasi', { catalogo, archivio, casualita: fissa(0), oggi: () => OGGI })
      expect(proposte(prima, 2)).toEqual(['01-a/f1', '01-a/f2'])

      // Una nuova sessione riparte dal suo turno e non esclude ciò che l'altra ha proposto.
      const seconda = creaSessione('frasi', { catalogo, archivio, casualita: fissa(0), oggi: () => OGGI })
      expect(idDi(seconda.prossimoElemento())).toBe('01-a/f1')

      const salvato = JSON.parse(salvataggio.getItem(CHIAVE_PROGRESSI) ?? '{}')
      expect(Object.keys(salvato)).toEqual(['versione', 'elementi'])
      for (const elemento of Object.values(salvato.elementi) as Record<string, unknown>[]) {
        expect(Object.keys(elemento)).toEqual(['stato'])
      }
    })

    it('la data di oggi si chiede a ogni scelta: un controllo scade mentre la sessione è aperta', () => {
      const archivio = creaArchivio(null)
      archivio.salvaStato('01-a/f1', imparato('2026-11-03'))
      let oggi = OGGI
      const sessione = creaSessione('frasi', {
        catalogo: catalogoDi(lezione('01-a', 3, 0)),
        archivio,
        casualita: fissa(0),
        oggi: () => oggi,
      })
      expect(proposte(sessione, 2)).toEqual(['01-a/f2', '01-a/f3'])
      oggi = '2026-11-03'
      expect(idDi(sessione.prossimoElemento())).toBe('01-a/f1')
    })

    it("tiene la finestra di esclusione per sessione, non in comune", () => {
      const catalogo = catalogoDi(lezione('01-a', 2, 0))
      const archivio = creaArchivio(null)
      const prima = creaSessione('frasi', { catalogo, archivio, casualita: fissa(0) })
      const seconda = creaSessione('frasi', { catalogo, archivio, casualita: fissa(0) })
      expect(idDi(prima.prossimoElemento())).toBe('01-a/f1')
      expect(idDi(seconda.prossimoElemento())).toBe('01-a/f1')
    })
  })

  describe('registra esito', () => {
    it('applica le transizioni con la data di oggi e salva subito', () => {
      const salvataggio = new SalvataggioFinto()
      const archivio = creaArchivio(salvataggio)
      const sessione = creaSessione('frasi', {
        catalogo: catalogoDi(lezione('01-a', 2, 0)),
        archivio,
        oggi: () => OGGI,
      })
      sessione.prossimoElemento()
      const scritture = salvataggio.scritture

      sessione.registraEsito('01-a/f1', 'giusto')
      expect(archivio.leggiStato('01-a/f1')).toEqual({ stato: 'nel-gruppo', serie: 1 })
      expect(salvataggio.scritture).toBe(scritture + 1)
      sessione.registraEsito('01-a/f1', 'sbagliato')
      expect(archivio.leggiStato('01-a/f1')).toEqual({ stato: 'nel-gruppo', serie: 0 })

      for (let i = 0; i < 3; i++) sessione.registraEsito('01-a/f1', 'giusto')
      expect(archivio.leggiStato('01-a/f1')).toEqual(imparato('2026-11-03', OGGI))
      expect(JSON.parse(salvataggio.getItem(CHIAVE_PROGRESSI) ?? '{}').elementi['01-a/f1']).toEqual({
        stato: imparato('2026-11-03', OGGI),
      })
    })

    it("l'intervallo del controllo dipende dall'importanza", () => {
      const archivio = creaArchivio(null)
      archivio.salvaImportanza('01-a/f1', 1)
      archivio.salvaImportanza('01-a/f2', 3)
      const sessione = creaSessione('frasi', { catalogo: catalogoDi(lezione('01-a', 2, 0)), archivio, oggi: () => OGGI })
      archivio.salvaStato('01-a/f1', imparato(OGGI, '2026-10-01', 2))
      archivio.salvaStato('01-a/f2', imparato(OGGI, '2026-10-01', 2))

      sessione.registraEsito('01-a/f1', 'giusto')
      sessione.registraEsito('01-a/f2', 'giusto')
      // Gradino 3, 7 giorni: ×2 per importanza 1, ×0,5 arrotondato per difetto per importanza 3.
      expect(archivio.leggiStato('01-a/f1')).toEqual(imparato('2026-11-16', OGGI, 3))
      expect(archivio.leggiStato('01-a/f2')).toEqual(imparato('2026-11-05', OGGI, 3))
    })

    it('un elemento imparato libera il posto, che si completa alla prossima scelta', () => {
      const archivio = creaArchivio(null)
      const sessione = creaSessione('frasi', {
        catalogo: catalogoDi(lezione('01-a', 6, 0)),
        archivio,
        casualita: fissa(0),
        oggi: () => OGGI,
      })
      sessione.prossimoElemento()
      expect(nelGruppo(archivio, frasiDi('01-a', 6))).toEqual(frasiDi('01-a', 5))
      for (let i = 0; i < 3; i++) sessione.registraEsito('01-a/f1', 'giusto')
      expect(nelGruppo(archivio, frasiDi('01-a', 6))).toHaveLength(4)

      sessione.prossimoElemento()
      expect(nelGruppo(archivio, frasiDi('01-a', 6))).toEqual(frasiDi('01-a', 6).slice(1))
    })

    it('un controllo sbagliato rientra nel gruppo anche se è pieno, e il gruppo non si completa', () => {
      const archivio = creaArchivio(null)
      archivio.salvaStato('01-a/f1', imparato('2026-10-20'))
      const sessione = creaSessione('frasi', {
        catalogo: catalogoDi(lezione('01-a', 8, 0)),
        archivio,
        casualita: fissa(0),
        oggi: () => OGGI,
      })
      expect(idDi(sessione.prossimoElemento())).toBe('01-a/f1')
      sessione.registraEsito('01-a/f1', 'sbagliato')
      expect(archivio.leggiStato('01-a/f1')).toEqual({ stato: 'nel-gruppo', serie: 0 })
      expect(nelGruppo(archivio, frasiDi('01-a', 8))).toHaveLength(6)

      proposte(sessione, 5)
      expect(nelGruppo(archivio, frasiDi('01-a', 8))).toHaveLength(6)
    })

    it('un controllo scaduto giusto sale di gradino; nel ripasso libero cambia solo la data della vista', () => {
      const archivio = creaArchivio(null)
      archivio.salvaStato('01-a/f1', imparato('2026-11-01'))
      archivio.salvaStato('01-a/f2', imparato('2026-11-20'))
      const sessione = creaSessione('frasi', { catalogo: catalogoDi(lezione('01-a', 2, 0)), archivio, oggi: () => OGGI })

      sessione.registraEsito('01-a/f1', 'giusto')
      sessione.registraEsito('01-a/f2', 'giusto')
      expect(archivio.leggiStato('01-a/f1')).toEqual(imparato('2026-11-05', OGGI, 2))
      expect(archivio.leggiStato('01-a/f2')).toEqual(imparato('2026-11-20', OGGI))
    })

    it('ignora senza errori un id sconosciuto al catalogo o di un altro tipo', () => {
      const salvataggio = new SalvataggioFinto()
      const archivio = creaArchivio(salvataggio)
      const sessione = creaSessione('frasi', { catalogo: catalogoDi(lezione('01-a', 1, 1)), archivio })

      expect(() => sessione.registraEsito('99-z/f1', 'sbagliato')).not.toThrow()
      sessione.registraEsito('01-a/v1', 'sbagliato')
      expect(salvataggio.scritture).toBe(0)
      expect(archivio.leggiStato('99-z/f1')).toEqual({ stato: 'nuovo' })
      expect(archivio.leggiStato('01-a/v1')).toEqual({ stato: 'nuovo' })
    })

    it('ignora l’esito di un elemento tolto', () => {
      const archivio = creaArchivio(null)
      const sessione = creaSessione('frasi', { catalogo: catalogoDi(lezione('01-a', 2, 0)), archivio })
      sessione.registraImportanza('01-a/f1', 0)
      sessione.registraEsito('01-a/f1', 'giusto')
      expect(archivio.leggiStato('01-a/f1')).toEqual({ stato: 'nuovo' })
    })

    it('ignora l’esito di un elemento tolto mentre era nel gruppo o imparato, senza scrivere', () => {
      const salvataggio = new SalvataggioFinto()
      const archivio = creaArchivio(salvataggio)
      archivio.salvaStato('01-a/f1', { stato: 'nel-gruppo', serie: 2 })
      archivio.salvaStato('01-a/f2', imparato('2026-10-20'))
      archivio.salvaImportanza('01-a/f1', 0)
      archivio.salvaImportanza('01-a/f2', 0)
      const sessione = creaSessione('frasi', { catalogo: catalogoDi(lezione('01-a', 2, 0)), archivio, oggi: () => OGGI })
      const scritture = salvataggio.scritture

      for (const esito of ['giusto', 'sbagliato'] as const) {
        sessione.registraEsito('01-a/f1', esito)
        sessione.registraEsito('01-a/f2', esito)
      }
      expect(salvataggio.scritture).toBe(scritture)
      expect(archivio.leggiStato('01-a/f1')).toEqual({ stato: 'nel-gruppo', serie: 2 })
      expect(archivio.leggiStato('01-a/f2')).toEqual(imparato('2026-10-20'))
    })
  })

  describe('elemento per id', () => {
    it("restituisce l'elemento del tipo della sessione con la sua importanza", () => {
      const catalogo = catalogoDi(lezione('01-a', 0, 3))
      const archivio = creaArchivio(null)
      archivio.salvaImportanza('01-a/v2', 3)
      const sessione = creaSessione('vocaboli', { catalogo, archivio })

      const trovato = sessione.elementoPerId('01-a/v2')
      expect(trovato).toEqual({ caso: 'elemento', elemento: catalogo.vocaboli[1], importanza: 3 })
      expect(trovato?.elemento).toBe(catalogo.vocaboli[1])
      expect(sessione.elementoPerId('01-a/v1')).toMatchObject({ caso: 'elemento', importanza: 2 })
    })

    it('restituisce nessuno per un id sconosciuto, di un altro tipo o con importanza 0', () => {
      const archivio = creaArchivio(null)
      const sessione = creaSessione('vocaboli', { catalogo: catalogoDi(lezione('01-a', 1, 2)), archivio })
      archivio.salvaImportanza('01-a/v2', 0)

      expect(sessione.elementoPerId('99-z/v1')).toBeNull()
      expect(sessione.elementoPerId('01-a/f1')).toBeNull()
      expect(sessione.elementoPerId('01-a/v2')).toBeNull()
    })

    it('non tocca i progressi salvati', () => {
      const salvataggio = new SalvataggioFinto()
      const archivio = creaArchivio(salvataggio)
      const sessione = creaSessione('vocaboli', { catalogo: catalogoDi(lezione('01-a', 0, 10)), archivio })

      sessione.elementoPerId('01-a/v10')
      sessione.elementoPerId('99-z/v1')
      expect(salvataggio.scritture).toBe(0)
      expect(archivio.leggiStato('01-a/v10')).toEqual({ stato: 'nuovo' })
    })

    it('conta l’elemento fra gli ultimi proposti: la scelta successiva non lo ripete', () => {
      const archivio = creaArchivio(null)
      const sessione = creaSessione('frasi', {
        catalogo: catalogoDi(lezione('01-a', 2, 0)),
        archivio,
        casualita: fissa(0),
      })
      // Senza la richiesta per id la prima proposta sarebbe f1.
      expect(sessione.elementoPerId('01-a/f1')).toMatchObject({ caso: 'elemento' })
      expect(proposte(sessione, 3)).toEqual(['01-a/f2', '01-a/f1', '01-a/f2'])
    })

    it('la finestra degli ultimi proposti resta di 3 anche con le richieste per id', () => {
      const archivio = creaArchivio(null)
      const sessione = creaSessione('frasi', {
        catalogo: catalogoDi(lezione('01-a', 5, 0)),
        archivio,
        casualita: fissa(0),
      })
      for (const id of ['01-a/f1', '01-a/f2', '01-a/f3', '01-a/f4']) sessione.elementoPerId(id)
      // Escluse le ultime 3 (f2, f3, f4): f1 è di nuovo proponibile.
      expect(idDi(sessione.prossimoElemento())).toBe('01-a/f1')
    })

    it('una richiesta per nessuno non cambia gli ultimi proposti', () => {
      const archivio = creaArchivio(null)
      const sessione = creaSessione('frasi', {
        catalogo: catalogoDi(lezione('01-a', 2, 1)),
        archivio,
        casualita: fissa(0),
      })
      expect(sessione.elementoPerId('01-a/v1')).toBeNull()
      expect(sessione.elementoPerId('99-z/f1')).toBeNull()
      expect(idDi(sessione.prossimoElemento())).toBe('01-a/f1')
    })
  })

  it('tiene separate la sessione di frasi e quella di vocaboli', () => {
    const catalogo = catalogoDi(lezione('01-a', 2, 2))
    const archivio = creaArchivio(null)
    const frasi = creaSessione('frasi', { catalogo, archivio, casualita: conSeme(5) })
    const vocaboli = creaSessione('vocaboli', { catalogo, archivio, casualita: conSeme(5) })

    for (let i = 0; i < 20; i++) {
      expect(idDi(frasi.prossimoElemento())).toMatch(/^01-a\/f\d$/)
      expect(idDi(vocaboli.prossimoElemento())).toMatch(/^01-a\/v\d$/)
    }

    vocaboli.registraEsito('01-a/v1', 'giusto')
    expect(archivio.leggiStato('01-a/v1')).toEqual({ stato: 'nel-gruppo', serie: 1 })
    expect(archivio.leggiStato('01-a/f1')).toEqual({ stato: 'nel-gruppo', serie: 0 })
  })

  it("usa catalogo, archivio, casualità e data dell'app quando non sono indicati", () => {
    expect(() => creaSessione('frasi').prossimoElemento()).not.toThrow()
    expect(() => creaSessione('vocaboli').registraEsito('inesistente/v1', 'giusto')).not.toThrow()
  })

  describe('registra importanza', () => {
    it("la salva nell'archivio senza toccare lo stato di apprendimento", () => {
      const salvataggio = new SalvataggioFinto()
      const archivio = creaArchivio(salvataggio)
      const sessione = creaSessione('frasi', { catalogo: catalogoDi(lezione('01-a', 2, 0)), archivio })
      sessione.registraEsito('01-a/f1', 'giusto')

      sessione.registraImportanza('01-a/f1', 3)
      expect(archivio.leggiImportanza('01-a/f1')).toBe(3)
      expect(archivio.leggiStato('01-a/f1')).toEqual({ stato: 'nel-gruppo', serie: 1 })

      sessione.registraImportanza('01-a/f1', 0)
      expect(archivio.leggiImportanza('01-a/f1')).toBe(0)
      expect(archivio.leggiStato('01-a/f1')).toEqual({ stato: 'nel-gruppo', serie: 1 })
      expect(salvataggio.scritture).toBe(3)
    })

    it("con 0 l'elemento lascia il gruppo e il suo posto si completa alla prossima scelta", () => {
      const archivio = creaArchivio(null)
      const sessione = creaSessione('frasi', {
        catalogo: catalogoDi(lezione('01-a', 6, 0)),
        archivio,
        casualita: conSeme(21),
      })
      sessione.prossimoElemento()
      sessione.registraImportanza('01-a/f1', 0)
      const sequenza = proposte(sessione, 30)
      expect(sequenza).not.toContain('01-a/f1')
      expect(new Set(sequenza)).toEqual(new Set(frasiDi('01-a', 6).slice(1)))
      expect(archivio.leggiStato('01-a/f6')).toEqual({ stato: 'nel-gruppo', serie: 0 })
    })

    it("l'importanza decide chi entra per primo nel gruppo", () => {
      const archivio = creaArchivio(null)
      const sessione = creaSessione('frasi', {
        catalogo: catalogoDi(lezione('01-a', 3, 0), lezione('02-b', 5, 0)),
        archivio,
        casualita: fissa(0),
      })
      sessione.registraImportanza('01-a/f3', 3)
      sessione.prossimoElemento()
      expect(nelGruppo(archivio, [...frasiDi('01-a', 3), ...frasiDi('02-b', 5)])).toEqual([
        '01-a/f3',
        '02-b/f1',
        '02-b/f2',
        '02-b/f3',
        '02-b/f4',
      ])
    })

    it('due sessioni sullo stesso archivio vedono la stessa importanza a ogni richiesta', () => {
      const catalogo = catalogoDi(lezione('01-a', 2, 0))
      const archivio = creaArchivio(null)
      const prima = creaSessione('frasi', { catalogo, archivio, casualita: fissa(0) })
      const seconda = creaSessione('frasi', { catalogo, archivio, casualita: fissa(0) })
      prima.registraImportanza('01-a/f1', 0)
      expect(proposte(seconda, 3)).toEqual(['01-a/f2', '01-a/f2', '01-a/f2'])
    })

    it('restituisce tutti tolti quando il catalogo ha elementi del tipo ma tutti con importanza 0', () => {
      const archivio = creaArchivio(null)
      const sessione = creaSessione('frasi', {
        catalogo: catalogoDi(lezione('01-a', 2, 1)),
        archivio,
        casualita: fissa(0),
      })
      sessione.registraImportanza('01-a/f1', 0)
      sessione.registraImportanza('01-a/f2', 0)
      expect(sessione.prossimoElemento()).toEqual({ caso: 'tutti-tolti' })

      // Rimettere un elemento lo fa tornare.
      sessione.registraImportanza('01-a/f2', 1)
      expect(idDi(sessione.prossimoElemento())).toBe('01-a/f2')
    })

    it('la finestra si calcola sui candidati rimasti: con un solo elemento rimasto questo si ripropone', () => {
      const sessione = creaSessione('frasi', {
        catalogo: catalogoDi(lezione('01-a', 5, 0)),
        archivio: creaArchivio(null),
        casualita: fissa(0),
      })
      expect(proposte(sessione, 3)).toEqual(['01-a/f1', '01-a/f2', '01-a/f3'])
      for (const id of ['01-a/f1', '01-a/f2', '01-a/f4', '01-a/f5']) sessione.registraImportanza(id, 0)
      // f3 è l'ultimo proposto, ma è l'unico candidato rimasto.
      expect(proposte(sessione, 4)).toEqual(Array(4).fill('01-a/f3'))
    })

    it('ignora senza errori un id sconosciuto al catalogo o di un altro tipo', () => {
      const salvataggio = new SalvataggioFinto()
      const archivio = creaArchivio(salvataggio)
      const sessione = creaSessione('frasi', { catalogo: catalogoDi(lezione('01-a', 1, 1)), archivio })

      expect(() => sessione.registraImportanza('99-z/f1', 0)).not.toThrow()
      expect(() => sessione.registraImportanza('01-a/v1', 0)).not.toThrow()
      expect(salvataggio.scritture).toBe(0)
      expect(archivio.leggiImportanza('99-z/f1')).toBe(2)
      expect(archivio.leggiImportanza('01-a/v1')).toBe(2)
    })

    it('ignora senza errori un valore fuori da 0–3', () => {
      const salvataggio = new SalvataggioFinto()
      const archivio = creaArchivio(salvataggio)
      const sessione = creaSessione('frasi', { catalogo: catalogoDi(lezione('01-a', 1, 0)), archivio })

      for (const valore of [-1, 4, 1.5, Number.NaN, '2', null, undefined]) {
        expect(() => sessione.registraImportanza('01-a/f1', valore as never)).not.toThrow()
      }
      expect(salvataggio.scritture).toBe(0)
      expect(archivio.leggiImportanza('01-a/f1')).toBe(2)
    })
  })
})
