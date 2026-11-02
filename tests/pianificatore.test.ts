import { describe, it, expect } from 'vitest'
import {
  DIMENSIONE_GRUPPO,
  FINESTRA,
  TURNO_INIZIALE,
  ampiezzaFinestra,
  completaGruppo,
  pianifica,
} from '../src/ripasso/pianificatore'
import type { Candidato, RichiestaPianificazione, Turno } from '../src/ripasso/pianificatore'
import type { Giorno, StatoApprendimento } from '../src/ripasso/apprendimento'
import type { Importanza } from '../src/ripasso/importanza'

const oggi = '2026-03-10'

const fissa = (valore: number) => () => valore

const nuovo: StatoApprendimento = { stato: 'nuovo' }
const daRiprendere: StatoApprendimento = { stato: 'da-riprendere' }
const nelGruppo: StatoApprendimento = { stato: 'nel-gruppo', serie: 0 }

function imparato(controllo: Giorno, ultimaVista: Giorno = '2026-03-01'): StatoApprendimento {
  return { stato: 'imparato', gradino: 1, controllo, ultimaVista }
}

let progressivo = 0

function candidato(
  id: string,
  stato: StatoApprendimento,
  dati: { importanza?: Importanza; lezione?: number; ordine?: number } = {},
): Candidato {
  progressivo += 1
  return {
    id,
    stato,
    importanza: dati.importanza ?? 2,
    lezione: dati.lezione ?? 1,
    ordine: dati.ordine ?? progressivo,
  }
}

function richiesta(dati: Partial<RichiestaPianificazione> = {}): RichiestaPianificazione {
  return { dimensione: 5, oggi, ultimi: [], turno: 'gruppo', casualita: fissa(0), ...dati }
}

const ids = (elementi: readonly Candidato[]) => elementi.map((elemento) => elemento.id)

describe('gruppo di lavoro', () => {
  it('ha 5 frasi e 8 vocaboli', () => {
    expect(DIMENSIONE_GRUPPO).toEqual({ frasi: 5, vocaboli: 8 })
  })

  it('si completa prima con i da riprendere, poi con i nuovi', () => {
    const candidati = [
      candidato('n1', nuovo, { importanza: 3 }),
      candidato('r1', daRiprendere, { importanza: 1 }),
      candidato('n2', nuovo, { importanza: 3 }),
      candidato('r2', daRiprendere, { importanza: 1 }),
    ]
    expect(ids(completaGruppo(candidati, 3))).toEqual(['r1', 'r2', 'n1'])
  })

  it('a parità di stato entra prima l\'importanza più alta', () => {
    const candidati = [
      candidato('a', nuovo, { importanza: 1 }),
      candidato('b', nuovo, { importanza: 2 }),
      candidato('c', nuovo, { importanza: 3 }),
    ]
    expect(ids(completaGruppo(candidati, 3))).toEqual(['c', 'b', 'a'])
  })

  it('a parità di importanza entra prima la lezione più recente, poi l\'ordine nel file', () => {
    const candidati = [
      candidato('l1-a', nuovo, { lezione: 1, ordine: 0 }),
      candidato('l3-b', nuovo, { lezione: 3, ordine: 1 }),
      candidato('l3-a', nuovo, { lezione: 3, ordine: 0 }),
      candidato('l2-a', nuovo, { lezione: 2, ordine: 0 }),
    ]
    expect(ids(completaGruppo(candidati, 4))).toEqual(['l3-a', 'l3-b', 'l2-a', 'l1-a'])
  })

  it('completa solo i posti liberi', () => {
    const candidati = [
      candidato('g1', nelGruppo),
      candidato('g2', nelGruppo),
      candidato('n1', nuovo),
      candidato('n2', nuovo),
      candidato('n3', nuovo),
      candidato('n4', nuovo),
    ]
    expect(ids(completaGruppo(candidati, 5))).toEqual(['n1', 'n2', 'n3'])
  })

  it('non aggiunge nessuno a un gruppo pieno o oltre la sua dimensione', () => {
    const pieno = [candidato('g1', nelGruppo), candidato('g2', nelGruppo), candidato('n1', nuovo)]
    expect(completaGruppo(pieno, 2)).toEqual([])
    expect(completaGruppo(pieno, 1)).toEqual([])
  })

  it('un elemento del gruppo con importanza 0 esce e libera il posto', () => {
    const candidati = [
      candidato('g1', nelGruppo),
      candidato('g2', nelGruppo, { importanza: 0 }),
      candidato('n1', nuovo),
    ]
    expect(ids(completaGruppo(candidati, 2))).toEqual(['n1'])
  })

  it('un elemento che il catalogo non conosce più non è fra i candidati e non occupa posto', () => {
    // Il gruppo si ricava dai soli candidati: un id salvato ma assente dal catalogo non arriva qui.
    const candidati = [candidato('g1', nelGruppo), candidato('n1', nuovo), candidato('n2', nuovo)]
    expect(ids(completaGruppo(candidati, 3))).toEqual(['n1', 'n2'])
  })

  it('non fa entrare elementi con importanza 0 né elementi imparati', () => {
    const candidati = [
      candidato('n0', nuovo, { importanza: 0 }),
      candidato('r0', daRiprendere, { importanza: 0 }),
      candidato('i1', imparato('2026-03-20')),
      candidato('n1', nuovo),
    ]
    expect(ids(completaGruppo(candidati, 5))).toEqual(['n1'])
  })
})

describe('finestra degli ultimi proposti', () => {
  it.each([
    [0, 0],
    [1, 0],
    [2, 1],
    [3, 2],
    [4, 3],
    [10, 3],
  ])('con %i elementi disponibili esclude gli ultimi %i', (disponibili, ampiezza) => {
    expect(ampiezzaFinestra(disponibili)).toBe(ampiezza)
  })

  it('è di 3 elementi', () => {
    expect(FINESTRA).toBe(3)
  })
})

describe('pianificatore', () => {
  it('senza candidati, o con tutti a importanza 0, non propone nulla', () => {
    expect(pianifica([], richiesta())).toEqual({ entrati: [], scelta: null, turno: 'gruppo' })
    const tolti = [candidato('a', nuovo, { importanza: 0 }), candidato('b', imparato(oggi), { importanza: 0 })]
    expect(pianifica(tolti, richiesta()).scelta).toBeNull()
  })

  it('completa il gruppo prima di scegliere e restituisce gli elementi entrati', () => {
    const candidati = [candidato('n1', nuovo), candidato('n2', nuovo)]
    const risultato = pianifica(candidati, richiesta())
    expect(ids(risultato.entrati)).toEqual(['n1', 'n2'])
    expect(risultato.scelta?.fonte).toBe('gruppo')
    expect(['n1', 'n2']).toContain(risultato.scelta?.candidato.id)
  })

  it('usa la dimensione richiesta', () => {
    const candidati = Array.from({ length: 10 }, (_, i) => candidato(`n${i}`, nuovo))
    expect(pianifica(candidati, richiesta({ dimensione: 8 })).entrati).toHaveLength(8)
  })

  it.each([
    [0, 'g1'],
    [0.2499, 'g1'],
    [0.25, 'g2'],
    [0.5, 'g3'],
    [0.99999, 'g4'],
  ])('sceglie nel gruppo con la stessa probabilità: casualità %f → %s', (valore, atteso) => {
    const gruppo = ['g1', 'g2', 'g3', 'g4'].map((id) => candidato(id, nelGruppo))
    const risultato = pianifica(gruppo, richiesta({ dimensione: 4, casualita: fissa(valore) }))
    expect(risultato.scelta?.candidato.id).toBe(atteso)
  })

  it('esclude dal gruppo gli ultimi 3 proposti', () => {
    const gruppo = ['g1', 'g2', 'g3', 'g4', 'g5'].map((id) => candidato(id, nelGruppo))
    const scelti = [0, 0.49, 0.5, 0.99999].map(
      (valore) =>
        pianifica(gruppo, richiesta({ ultimi: ['g5', 'g1', 'g3', 'g4'], casualita: fissa(valore) })).scelta
          ?.candidato.id,
    )
    // La finestra è di 3: g5, il più vecchio dei quattro, torna disponibile.
    expect(scelti).toEqual(['g2', 'g2', 'g5', 'g5'])
  })

  it('riduce la finestra al numero di elementi disponibili meno uno', () => {
    const coppia = [candidato('g1', nelGruppo), candidato('g2', nelGruppo)]
    expect(pianifica(coppia, richiesta({ ultimi: ['g1', 'g2'] })).scelta?.candidato.id).toBe('g1')
    const solo = [candidato('g1', nelGruppo)]
    expect(pianifica(solo, richiesta({ ultimi: ['g1'] })).scelta?.candidato.id).toBe('g1')
  })

  it('conta fra i disponibili anche gli imparati, e se la finestra esclude tutto il gruppo passa al ripasso libero', () => {
    const candidati = [
      candidato('g1', nelGruppo),
      candidato('g2', nelGruppo),
      candidato('i1', imparato('2026-03-20')),
    ]
    const scelta = pianifica(candidati, richiesta({ ultimi: ['g1', 'g2'] })).scelta
    expect(scelta).toEqual({ candidato: candidati[2], fonte: 'libero' })
  })

  it('se la finestra esclude tutto il gruppo passa a un controllo scaduto', () => {
    const candidati = [
      candidato('g1', nelGruppo),
      candidato('i1', imparato('2026-03-20')),
      candidato('c1', imparato(oggi)),
    ]
    const scelta = pianifica(candidati, richiesta({ ultimi: ['g1'], turno: 'gruppo' })).scelta
    expect(scelta).toEqual({ candidato: candidati[2], fonte: 'controllo' })
  })

  describe('controlli scaduti con il gruppo non vuoto', () => {
    const gruppo = ['g1', 'g2', 'g3', 'g4', 'g5'].map((id) => candidato(id, nelGruppo))
    const controlli = [
      candidato('c1', imparato('2026-03-08')),
      candidato('c2', imparato('2026-03-09')),
      candidato('c3', imparato(oggi)),
    ]

    it('al turno del controllo propone un controllo, al turno del gruppo un elemento del gruppo', () => {
      const candidati = [...gruppo, ...controlli]
      expect(pianifica(candidati, richiesta({ turno: 'controllo' }))).toMatchObject({
        scelta: { candidato: { id: 'c1' }, fonte: 'controllo' },
        turno: 'gruppo',
      })
      expect(pianifica(candidati, richiesta({ turno: 'gruppo' }))).toMatchObject({
        scelta: { candidato: { id: 'g1' }, fonte: 'gruppo' },
        turno: 'controllo',
      })
    })

    it('alterna un controllo ogni due elementi proposti', () => {
      const candidati = [...gruppo, ...controlli]
      let turno: Turno = TURNO_INIZIALE
      const ultimi: string[] = []
      const fonti: string[] = []
      for (let i = 0; i < 6; i++) {
        const { scelta, turno: successivo } = pianifica(candidati, richiesta({ turno, ultimi: [...ultimi] }))
        fonti.push(scelta?.fonte ?? 'nessuna')
        ultimi.push(scelta?.candidato.id ?? '')
        turno = successivo
      }
      const attese: string[] = TURNO_INIZIALE === 'controllo' ? ['controllo', 'gruppo'] : ['gruppo', 'controllo']
      expect(fonti).toEqual([...attese, ...attese, ...attese])
    })
  })

  describe('con il gruppo vuoto', () => {
    it('propone solo controlli, qualunque sia il turno', () => {
      const candidati = [candidato('i1', imparato('2026-03-20')), candidato('c1', imparato(oggi))]
      for (const turno of ['gruppo', 'controllo'] as const) {
        expect(pianifica(candidati, richiesta({ turno })).scelta).toEqual({ candidato: candidati[1], fonte: 'controllo' })
      }
    })

    it('sceglie il controllo più vecchio, a parità di data l\'importanza più alta', () => {
      const candidati = [
        candidato('c-oggi', imparato(oggi), { importanza: 3 }),
        candidato('c-ieri-1', imparato('2026-03-09'), { importanza: 1 }),
        candidato('c-ieri-3', imparato('2026-03-09'), { importanza: 3 }),
        candidato('c-ieri-2', imparato('2026-03-09'), { importanza: 2 }),
      ]
      expect(pianifica(candidati, richiesta()).scelta?.candidato.id).toBe('c-ieri-3')
      expect(pianifica(candidati, richiesta({ ultimi: ['c-ieri-3'] })).scelta?.candidato.id).toBe('c-ieri-2')
      expect(
        pianifica(candidati, richiesta({ ultimi: ['c-ieri-3', 'c-ieri-2', 'c-ieri-1'] })).scelta?.candidato.id,
      ).toBe('c-oggi')
    })

    it('se la finestra esclude tutti i controlli la ignora', () => {
      const candidati = [candidato('c1', imparato(oggi)), candidato('i1', imparato('2026-03-20'))]
      expect(pianifica(candidati, richiesta({ ultimi: ['c1'] })).scelta).toEqual({
        candidato: candidati[0],
        fonte: 'controllo',
      })
    })
  })

  describe('ripasso libero', () => {
    const tutti = [
      candidato('i-recente', imparato('2026-03-20', '2026-03-09')),
      candidato('i-vecchio', imparato('2026-03-25', '2026-02-01')),
      candidato('i-medio', imparato('2026-03-22', '2026-03-01')),
    ]

    it('senza gruppo né controlli scaduti propone l\'imparato visto meno di recente', () => {
      expect(pianifica(tutti, richiesta()).scelta).toEqual({ candidato: tutti[1], fonte: 'libero' })
    })

    it('esclude gli ultimi proposti', () => {
      expect(pianifica(tutti, richiesta({ ultimi: ['i-vecchio'] })).scelta?.candidato.id).toBe('i-medio')
      expect(pianifica(tutti, richiesta({ ultimi: ['i-vecchio', 'i-medio'] })).scelta?.candidato.id).toBe(
        'i-recente',
      )
    })

    it('non cambia il turno', () => {
      for (const turno of ['gruppo', 'controllo'] as const) {
        expect(pianifica(tutti, richiesta({ turno })).turno).toBe(turno)
      }
    })

    it('non propone elementi con importanza 0', () => {
      const conTolto = [candidato('i-tolto', imparato('2026-03-20', '2026-01-01'), { importanza: 0 }), ...tutti]
      expect(pianifica(conTolto, richiesta()).scelta?.candidato.id).toBe('i-vecchio')
    })
  })

  it('la data di oggi decide quali controlli sono scaduti', () => {
    const candidati = [
      candidato('i-vecchio', imparato('2026-03-12', '2026-01-01')),
      candidato('c-domani', imparato('2026-03-11', '2026-03-09')),
    ]
    expect(pianifica(candidati, richiesta({ oggi: '2026-03-10' })).scelta?.fonte).toBe('libero')
    expect(pianifica(candidati, richiesta({ oggi: '2026-03-11' })).scelta).toEqual({
      candidato: candidati[1],
      fonte: 'controllo',
    })
  })

  it('un controllo scaduto con importanza 0 non è proposto', () => {
    const candidati = [candidato('c0', imparato(oggi), { importanza: 0 }), candidato('g1', nelGruppo)]
    expect(pianifica(candidati, richiesta({ turno: 'controllo' })).scelta).toEqual({
      candidato: candidati[1],
      fonte: 'gruppo',
    })
  })

  it('non modifica i candidati ricevuti', () => {
    const candidati = Object.freeze([Object.freeze(candidato('n1', nuovo))])
    expect(() => pianifica(candidati, richiesta())).not.toThrow()
    expect(candidati[0].stato).toEqual(nuovo)
  })
})
