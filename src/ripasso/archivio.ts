import { EDIZIONE, chiaveProgressi } from '../edizione'
import { LIVELLO_INIZIALE, isLivello } from './livelli'
import type { Livello } from './livelli'
import { IMPORTANZA_INIZIALE, isImportanza } from './importanza'
import type { Importanza } from './importanza'

export const CHIAVE_PROGRESSI = chiaveProgressi(EDIZIONE)

const VERSIONE = 2
const VERSIONE_PRECEDENTE = 1

export interface ArchivioProgressi {
  leggiLivello(idGlobale: string): Livello
  salvaLivello(idGlobale: string, livello: Livello): void
  leggiImportanza(idGlobale: string): Importanza
  salvaImportanza(idGlobale: string, importanza: Importanza): void
}

type StatoSalvato = Record<string, unknown>

function salvataggioPredefinito(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function isOggetto(valore: unknown): valore is StatoSalvato {
  return typeof valore === 'object' && valore !== null && !Array.isArray(valore)
}

function convertiLivelli(livelli: StatoSalvato): Map<string, unknown> {
  const elementi = new Map<string, unknown>()
  for (const [id, livello] of Object.entries(livelli)) {
    if (livello !== LIVELLO_INIZIALE) elementi.set(id, { livello })
  }
  return elementi
}

function leggiMappa(testo: string | null): Map<string, unknown> {
  if (testo === null) return new Map()
  try {
    const dati: unknown = JSON.parse(testo)
    if (!isOggetto(dati)) return new Map()
    const { versione, elementi, livelli } = dati
    if (versione === VERSIONE && isOggetto(elementi)) return new Map(Object.entries(elementi))
    if (versione === VERSIONE_PRECEDENTE && isOggetto(livelli)) return convertiLivelli(livelli)
    return new Map()
  } catch {
    return new Map()
  }
}

export function creaArchivio(
  salvataggio: Storage | null = salvataggioPredefinito(),
  chiave: string = CHIAVE_PROGRESSI,
): ArchivioProgressi {
  let disponibile = salvataggio
  let elementi = new Map<string, unknown>()
  try {
    elementi = leggiMappa(disponibile?.getItem(chiave) ?? null)
  } catch {
    disponibile = null
  }

  function leggiCampo(idGlobale: string, campo: 'livello' | 'importanza'): unknown {
    const stato = elementi.get(idGlobale)
    return isOggetto(stato) ? stato[campo] : undefined
  }

  function salvaCampo(
    idGlobale: string,
    campo: 'livello' | 'importanza',
    valore: unknown,
    iniziale: unknown,
  ): void {
    const precedente = elementi.get(idGlobale)
    const stato: StatoSalvato = isOggetto(precedente) ? { ...precedente } : {}
    if (valore === iniziale) delete stato[campo]
    else stato[campo] = valore
    if (Object.keys(stato).length === 0) elementi.delete(idGlobale)
    else elementi.set(idGlobale, stato)
    if (disponibile === null) return
    try {
      disponibile.setItem(
        chiave,
        JSON.stringify({ versione: VERSIONE, elementi: Object.fromEntries(elementi) }),
      )
    } catch {
      // spazio pieno o accesso negato: i progressi restano in memoria
    }
  }

  return {
    leggiLivello(idGlobale) {
      const livello = leggiCampo(idGlobale, 'livello')
      return isLivello(livello) ? livello : LIVELLO_INIZIALE
    },
    salvaLivello(idGlobale, livello) {
      salvaCampo(idGlobale, 'livello', livello, LIVELLO_INIZIALE)
    },
    leggiImportanza(idGlobale) {
      const importanza = leggiCampo(idGlobale, 'importanza')
      return isImportanza(importanza) ? importanza : IMPORTANZA_INIZIALE
    },
    salvaImportanza(idGlobale, importanza) {
      salvaCampo(idGlobale, 'importanza', importanza, IMPORTANZA_INIZIALE)
    },
  }
}
