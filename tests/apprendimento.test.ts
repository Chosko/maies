import { describe, it, expect } from 'vitest'
import {
  SCALA,
  STATO_INIZIALE,
  aggiungiGiorni,
  applicaEsito,
  controlloScaduto,
  giornoLocale,
  intervallo,
} from '../src/ripasso/apprendimento'
import type { StatoApprendimento } from '../src/ripasso/apprendimento'

const oggi = '2026-03-10'

describe('scala dei controlli', () => {
  it('ha i gradini 1, 3, 7, 14, 30 giorni', () => {
    expect([...SCALA]).toEqual([1, 3, 7, 14, 30])
  })

  it.each([
    [1, 2, 1],
    [2, 2, 3],
    [3, 2, 7],
    [4, 2, 14],
    [5, 2, 30],
    [1, 1, 2],
    [2, 1, 6],
    [3, 1, 14],
    [4, 1, 28],
    [5, 1, 60],
    [1, 3, 1],
    [2, 3, 1],
    [3, 3, 3],
    [4, 3, 7],
    [5, 3, 15],
  ] as const)('gradino %i con importanza %i dura %i giorni', (gradino, importanza, giorni) => {
    expect(intervallo(gradino, importanza)).toBe(giorni)
  })

  it('oltre l\'ultimo gradino resta 30 giorni, moltiplicato dall\'importanza', () => {
    expect(intervallo(6, 2)).toBe(30)
    expect(intervallo(12, 2)).toBe(30)
    expect(intervallo(6, 1)).toBe(60)
    expect(intervallo(6, 3)).toBe(15)
  })
})

describe('giorni di calendario', () => {
  it('rappresenta il giorno locale senza orario', () => {
    expect(giornoLocale(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(giornoLocale(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31')
  })

  it('aggiunge giorni di calendario oltre mese e anno', () => {
    expect(aggiungiGiorni('2026-03-10', 1)).toBe('2026-03-11')
    expect(aggiungiGiorni('2026-02-27', 3)).toBe('2026-03-02')
    expect(aggiungiGiorni('2026-12-20', 30)).toBe('2027-01-19')
    expect(aggiungiGiorni('2026-03-28', 2)).toBe('2026-03-30')
    expect(aggiungiGiorni('2026-10-24', 7)).toBe('2026-10-31')
  })

  it('un controllo è scaduto quando la sua data è oggi o passata', () => {
    const imparato = (controllo: string): StatoApprendimento => ({
      stato: 'imparato',
      gradino: 1,
      controllo,
      ultimaVista: '2026-03-01',
    })
    expect(controlloScaduto(imparato('2026-03-09'), oggi)).toBe(true)
    expect(controlloScaduto(imparato('2026-03-10'), oggi)).toBe(true)
    expect(controlloScaduto(imparato('2026-03-11'), oggi)).toBe(false)
    expect(controlloScaduto({ stato: 'nel-gruppo', serie: 0 }, oggi)).toBe(false)
    expect(controlloScaduto(STATO_INIZIALE, oggi)).toBe(false)
  })
})

describe('transizioni', () => {
  it('ogni elemento parte nuovo', () => {
    expect(STATO_INIZIALE).toEqual({ stato: 'nuovo' })
  })

  it('nel gruppo, giusto: la serie sale di uno', () => {
    expect(applicaEsito({ stato: 'nel-gruppo', serie: 0 }, 'giusto', 2, oggi)).toEqual({
      stato: 'nel-gruppo',
      serie: 1,
    })
    expect(applicaEsito({ stato: 'nel-gruppo', serie: 1 }, 'giusto', 2, oggi)).toEqual({
      stato: 'nel-gruppo',
      serie: 2,
    })
  })

  it('nel gruppo, la terza giusta di fila rende imparato al primo gradino', () => {
    expect(applicaEsito({ stato: 'nel-gruppo', serie: 2 }, 'giusto', 2, oggi)).toEqual({
      stato: 'imparato',
      gradino: 1,
      controllo: '2026-03-11',
      ultimaVista: oggi,
    })
    expect(applicaEsito({ stato: 'nel-gruppo', serie: 2 }, 'giusto', 1, oggi)).toEqual({
      stato: 'imparato',
      gradino: 1,
      controllo: '2026-03-12',
      ultimaVista: oggi,
    })
  })

  it('nel gruppo, sbagliato: la serie torna a 0', () => {
    for (const serie of [0, 1, 2] as const) {
      expect(applicaEsito({ stato: 'nel-gruppo', serie }, 'sbagliato', 2, oggi)).toEqual({
        stato: 'nel-gruppo',
        serie: 0,
      })
    }
  })

  it('tre giuste di fila dopo un errore rendono imparato', () => {
    let stato: StatoApprendimento = { stato: 'nel-gruppo', serie: 2 }
    stato = applicaEsito(stato, 'sbagliato', 2, oggi)
    stato = applicaEsito(stato, 'giusto', 2, oggi)
    stato = applicaEsito(stato, 'giusto', 2, oggi)
    expect(stato).toEqual({ stato: 'nel-gruppo', serie: 2 })
    stato = applicaEsito(stato, 'giusto', 2, oggi)
    expect(stato.stato).toBe('imparato')
  })

  it('imparato, controllo scaduto, giusto: sale di un gradino da oggi', () => {
    const stato: StatoApprendimento = {
      stato: 'imparato',
      gradino: 1,
      controllo: '2026-03-08',
      ultimaVista: '2026-03-07',
    }
    expect(applicaEsito(stato, 'giusto', 2, oggi)).toEqual({
      stato: 'imparato',
      gradino: 2,
      controllo: '2026-03-13',
      ultimaVista: oggi,
    })
    expect(applicaEsito(stato, 'giusto', 3, oggi)).toEqual({
      stato: 'imparato',
      gradino: 2,
      controllo: '2026-03-11',
      ultimaVista: oggi,
    })
  })

  it('imparato all\'ultimo gradino, giusto: il controllo resta fra 30 giorni', () => {
    const stato: StatoApprendimento = {
      stato: 'imparato',
      gradino: 5,
      controllo: oggi,
      ultimaVista: '2026-02-08',
    }
    expect(applicaEsito(stato, 'giusto', 2, oggi)).toEqual({
      stato: 'imparato',
      gradino: 6,
      controllo: '2026-04-09',
      ultimaVista: oggi,
    })
  })

  it('imparato, controllo scaduto, sbagliato: rientra nel gruppo con serie 0', () => {
    const stato: StatoApprendimento = {
      stato: 'imparato',
      gradino: 3,
      controllo: oggi,
      ultimaVista: '2026-03-03',
    }
    expect(applicaEsito(stato, 'sbagliato', 2, oggi)).toEqual({ stato: 'nel-gruppo', serie: 0 })
  })

  it('imparato, ripasso libero, giusto: aggiorna solo l\'ultima vista', () => {
    const stato: StatoApprendimento = {
      stato: 'imparato',
      gradino: 2,
      controllo: '2026-03-12',
      ultimaVista: '2026-03-09',
    }
    expect(applicaEsito(stato, 'giusto', 2, oggi)).toEqual({ ...stato, ultimaVista: oggi })
  })

  it('imparato, ripasso libero, sbagliato: rientra nel gruppo come dopo un controllo', () => {
    const stato: StatoApprendimento = {
      stato: 'imparato',
      gradino: 2,
      controllo: '2026-03-12',
      ultimaVista: '2026-03-09',
    }
    expect(applicaEsito(stato, 'sbagliato', 2, oggi)).toEqual({ stato: 'nel-gruppo', serie: 0 })
  })

  it.each(['nuovo', 'da-riprendere'] as const)(
    'un esito per un elemento %s lo fa entrare nel gruppo e poi si applica',
    (nome) => {
      const stato = { stato: nome } as StatoApprendimento
      expect(applicaEsito(stato, 'giusto', 2, oggi)).toEqual({ stato: 'nel-gruppo', serie: 1 })
      expect(applicaEsito(stato, 'sbagliato', 2, oggi)).toEqual({ stato: 'nel-gruppo', serie: 0 })
    },
  )

  it('non modifica lo stato ricevuto', () => {
    const stato: StatoApprendimento = { stato: 'nel-gruppo', serie: 1 }
    applicaEsito(stato, 'giusto', 2, oggi)
    expect(stato).toEqual({ stato: 'nel-gruppo', serie: 1 })
  })
})
