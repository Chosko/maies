import { FATTORI_INTERVALLO } from './importanza'
import type { ImportanzaAttiva } from './importanza'

export type Esito = 'giusto' | 'sbagliato'

/** Giorno di calendario locale, `AAAA-MM-GG`, senza orario. */
export type Giorno = string

export type Serie = 0 | 1 | 2

export type StatoApprendimento =
  | { readonly stato: 'nuovo' }
  | { readonly stato: 'da-riprendere' }
  | { readonly stato: 'nel-gruppo'; readonly serie: Serie }
  | {
      readonly stato: 'imparato'
      readonly gradino: number
      readonly controllo: Giorno
      readonly ultimaVista: Giorno
    }

export const STATO_INIZIALE: StatoApprendimento = { stato: 'nuovo' }

export const SCALA = [1, 3, 7, 14, 30] as const

const RISPOSTE_PER_IMPARARE = 3

export function giornoLocale(data: Date): Giorno {
  const anno = String(data.getFullYear()).padStart(4, '0')
  const mese = String(data.getMonth() + 1).padStart(2, '0')
  const giorno = String(data.getDate()).padStart(2, '0')
  return `${anno}-${mese}-${giorno}`
}

export function aggiungiGiorni(giorno: Giorno, giorni: number): Giorno {
  const [anno, mese, numero] = giorno.split('-').map(Number)
  return giornoLocale(new Date(anno, mese - 1, numero + giorni))
}

export function intervallo(gradino: number, importanza: ImportanzaAttiva): number {
  const base = SCALA[Math.min(gradino, SCALA.length) - 1]
  return Math.max(1, Math.floor(base * FATTORI_INTERVALLO[importanza]))
}

export function controlloScaduto(stato: StatoApprendimento, oggi: Giorno): boolean {
  return stato.stato === 'imparato' && stato.controllo <= oggi
}

function imparato(gradino: number, importanza: ImportanzaAttiva, oggi: Giorno): StatoApprendimento {
  return {
    stato: 'imparato',
    gradino,
    controllo: aggiungiGiorni(oggi, intervallo(gradino, importanza)),
    ultimaVista: oggi,
  }
}

export function applicaEsito(
  stato: StatoApprendimento,
  esito: Esito,
  importanza: ImportanzaAttiva,
  oggi: Giorno,
): StatoApprendimento {
  switch (stato.stato) {
    case 'nuovo':
    case 'da-riprendere':
      return applicaEsito({ stato: 'nel-gruppo', serie: 0 }, esito, importanza, oggi)
    case 'nel-gruppo': {
      if (esito === 'sbagliato') return { stato: 'nel-gruppo', serie: 0 }
      const serie = stato.serie + 1
      if (serie >= RISPOSTE_PER_IMPARARE) return imparato(1, importanza, oggi)
      return { stato: 'nel-gruppo', serie: serie as Serie }
    }
    case 'imparato':
      if (esito === 'sbagliato') return { stato: 'nel-gruppo', serie: 0 }
      if (controlloScaduto(stato, oggi)) return imparato(stato.gradino + 1, importanza, oggi)
      return { ...stato, ultimaVista: oggi }
  }
}
