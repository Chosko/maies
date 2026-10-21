import { LIVELLO_INIZIALE, isLivello } from './livelli'
import type { Livello } from './livelli'

export const CHIAVE_PROGRESSI = 'maies.progressi'

const VERSIONE = 1

export interface ArchivioProgressi {
  leggiLivello(idGlobale: string): Livello
  salvaLivello(idGlobale: string, livello: Livello): void
}

function salvataggioPredefinito(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function leggiMappa(testo: string | null): Map<string, unknown> {
  if (testo === null) return new Map()
  try {
    const dati: unknown = JSON.parse(testo)
    if (typeof dati !== 'object' || dati === null) return new Map()
    const { versione, livelli } = dati as Record<string, unknown>
    if (versione !== VERSIONE) return new Map()
    if (typeof livelli !== 'object' || livelli === null || Array.isArray(livelli)) return new Map()
    return new Map(Object.entries(livelli))
  } catch {
    return new Map()
  }
}

export function creaArchivio(
  salvataggio: Storage | null = salvataggioPredefinito(),
): ArchivioProgressi {
  let disponibile = salvataggio
  let livelli = new Map<string, unknown>()
  try {
    livelli = leggiMappa(disponibile?.getItem(CHIAVE_PROGRESSI) ?? null)
  } catch {
    disponibile = null
  }

  return {
    leggiLivello(idGlobale) {
      const livello = livelli.get(idGlobale)
      return isLivello(livello) ? livello : LIVELLO_INIZIALE
    },
    salvaLivello(idGlobale, livello) {
      livelli.set(idGlobale, livello)
      if (disponibile === null) return
      try {
        disponibile.setItem(
          CHIAVE_PROGRESSI,
          JSON.stringify({ versione: VERSIONE, livelli: Object.fromEntries(livelli) }),
        )
      } catch {
        // spazio pieno o accesso negato: i progressi restano in memoria
      }
    },
  }
}
