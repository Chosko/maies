import { EDIZIONE, chiaveProgressi } from '../edizione'
import { STATO_INIZIALE, giornoLocale } from './apprendimento'
import type { Giorno, StatoApprendimento } from './apprendimento'
import { IMPORTANZA_INIZIALE, isImportanza } from './importanza'
import type { Importanza } from './importanza'

export const CHIAVE_PROGRESSI = chiaveProgressi(EDIZIONE)

const VERSIONE = 3
const VERSIONE_LIVELLI_E_IMPORTANZA = 2
const VERSIONE_LIVELLI = 1

export interface ArchivioProgressi {
  leggiStato(idGlobale: string): StatoApprendimento
  salvaStato(idGlobale: string, stato: StatoApprendimento): void
  leggiImportanza(idGlobale: string): Importanza
  salvaImportanza(idGlobale: string, importanza: Importanza): void
}

type StatoSalvato = Record<string, unknown>

const FORMATO_GIORNO = /^\d{4}-\d{2}-\d{2}$/

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

function isGiorno(valore: unknown): valore is Giorno {
  return typeof valore === 'string' && FORMATO_GIORNO.test(valore)
}

/** Lo stato salvato ricostruito con i soli dati del suo tipo, o `null` se sconosciuto o incompleto. */
function statoValido(valore: unknown): StatoApprendimento | null {
  if (!isOggetto(valore)) return null
  switch (valore.stato) {
    case 'nuovo':
      return { stato: 'nuovo' }
    case 'da-riprendere':
      return { stato: 'da-riprendere' }
    case 'nel-gruppo': {
      const { serie } = valore
      return serie === 0 || serie === 1 || serie === 2 ? { stato: 'nel-gruppo', serie } : null
    }
    case 'imparato': {
      const { gradino, controllo, ultimaVista } = valore
      if (typeof gradino !== 'number' || !Number.isInteger(gradino) || gradino < 1) return null
      if (!isGiorno(controllo) || !isGiorno(ultimaVista)) return null
      return { stato: 'imparato', gradino, controllo, ultimaVista }
    }
    default:
      return null
  }
}

function statoDaLivello(livello: unknown, oggi: Giorno): StatoApprendimento {
  switch (livello) {
    case 'da-ripassare':
      return { stato: 'da-riprendere' }
    case 'consolidato':
      return { stato: 'imparato', gradino: 1, controllo: oggi, ultimaVista: oggi }
    default:
      return STATO_INIZIALE
  }
}

function elementoDaLivello(livello: unknown, importanza: unknown, oggi: Giorno): StatoSalvato | null {
  const elemento: StatoSalvato = {}
  const stato = statoDaLivello(livello, oggi)
  if (stato.stato !== STATO_INIZIALE.stato) elemento.stato = stato
  if (importanza !== undefined && importanza !== IMPORTANZA_INIZIALE) elemento.importanza = importanza
  return Object.keys(elemento).length === 0 ? null : elemento
}

function convertiLivelli(livelli: StatoSalvato, oggi: Giorno): Map<string, unknown> {
  const elementi = new Map<string, unknown>()
  for (const [id, livello] of Object.entries(livelli)) {
    const elemento = elementoDaLivello(livello, undefined, oggi)
    if (elemento !== null) elementi.set(id, elemento)
  }
  return elementi
}

function convertiLivelliEImportanza(salvati: StatoSalvato, oggi: Giorno): Map<string, unknown> {
  const elementi = new Map<string, unknown>()
  for (const [id, salvato] of Object.entries(salvati)) {
    if (!isOggetto(salvato)) continue
    const elemento = elementoDaLivello(salvato.livello, salvato.importanza, oggi)
    if (elemento !== null) elementi.set(id, elemento)
  }
  return elementi
}

function leggiMappa(testo: string | null, oggi: Giorno): Map<string, unknown> {
  if (testo === null) return new Map()
  try {
    const dati: unknown = JSON.parse(testo)
    if (!isOggetto(dati)) return new Map()
    const { versione, elementi, livelli } = dati
    if (versione === VERSIONE && isOggetto(elementi)) return new Map(Object.entries(elementi))
    if (versione === VERSIONE_LIVELLI_E_IMPORTANZA && isOggetto(elementi)) {
      return convertiLivelliEImportanza(elementi, oggi)
    }
    if (versione === VERSIONE_LIVELLI && isOggetto(livelli)) return convertiLivelli(livelli, oggi)
    return new Map()
  } catch {
    return new Map()
  }
}

export function creaArchivio(
  salvataggio: Storage | null = salvataggioPredefinito(),
  chiave: string = CHIAVE_PROGRESSI,
  oggi: Giorno = giornoLocale(new Date()),
): ArchivioProgressi {
  let disponibile = salvataggio
  let elementi = new Map<string, unknown>()
  try {
    elementi = leggiMappa(disponibile?.getItem(chiave) ?? null, oggi)
  } catch {
    disponibile = null
  }

  function leggiCampo(idGlobale: string, campo: 'stato' | 'importanza'): unknown {
    const elemento = elementi.get(idGlobale)
    return isOggetto(elemento) ? elemento[campo] : undefined
  }

  function salvaCampo(idGlobale: string, campo: 'stato' | 'importanza', valore: unknown | null): void {
    const precedente = elementi.get(idGlobale)
    const elemento: StatoSalvato = isOggetto(precedente) ? { ...precedente } : {}
    if (valore === null) delete elemento[campo]
    else elemento[campo] = valore
    if (Object.keys(elemento).length === 0) elementi.delete(idGlobale)
    else elementi.set(idGlobale, elemento)
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

  function leggiStato(idGlobale: string): StatoApprendimento {
    return statoValido(leggiCampo(idGlobale, 'stato')) ?? STATO_INIZIALE
  }

  function salvaStato(idGlobale: string, stato: StatoApprendimento): void {
    const valido = statoValido(stato)
    salvaCampo(idGlobale, 'stato', valido === null || valido.stato === STATO_INIZIALE.stato ? null : valido)
  }

  return {
    leggiStato,
    salvaStato,
    leggiImportanza(idGlobale) {
      const importanza = leggiCampo(idGlobale, 'importanza')
      return isImportanza(importanza) ? importanza : IMPORTANZA_INIZIALE
    },
    salvaImportanza(idGlobale, importanza) {
      salvaCampo(idGlobale, 'importanza', importanza === IMPORTANZA_INIZIALE ? null : importanza)
    },
  }
}
