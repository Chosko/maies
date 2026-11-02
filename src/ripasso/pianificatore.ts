import { controlloScaduto } from './apprendimento'
import type { Giorno, StatoApprendimento } from './apprendimento'
import type { Importanza } from './importanza'

export const DIMENSIONE_GRUPPO = { frasi: 5, vocaboli: 8 } as const

export const FINESTRA = 3

export type Casualita = () => number

/** Di chi è il turno quando ci sono controlli scaduti e il gruppo non è vuoto. */
export type Turno = 'gruppo' | 'controllo'

export const TURNO_INIZIALE: Turno = 'controllo'

export interface Candidato {
  readonly id: string
  readonly stato: StatoApprendimento
  readonly importanza: Importanza
  /** Numero della lezione: più alto è più recente. */
  readonly lezione: number
  /** Posizione dell'elemento nel file della sua lezione. */
  readonly ordine: number
}

export type Fonte = 'gruppo' | 'controllo' | 'libero'

export interface RichiestaPianificazione {
  readonly dimensione: number
  readonly oggi: Giorno
  /** Gli ultimi elementi proposti, dal più vecchio al più recente. */
  readonly ultimi: readonly string[]
  readonly turno: Turno
  readonly casualita: Casualita
}

export interface Pianificazione<T extends Candidato> {
  /** Gli elementi entrati nel gruppo con questa scelta, da salvare "nel gruppo" con serie 0. */
  readonly entrati: readonly T[]
  readonly scelta: { readonly candidato: T; readonly fonte: Fonte } | null
  readonly turno: Turno
}

const PRIORITA_INGRESSO: Partial<Record<StatoApprendimento['stato'], number>> = {
  'da-riprendere': 0,
  nuovo: 1,
}

function ordineIngresso(a: Candidato, b: Candidato): number {
  return (
    PRIORITA_INGRESSO[a.stato.stato]! - PRIORITA_INGRESSO[b.stato.stato]! ||
    b.importanza - a.importanza ||
    b.lezione - a.lezione ||
    a.ordine - b.ordine
  )
}

function attivi<T extends Candidato>(candidati: readonly T[]): T[] {
  return candidati.filter((candidato) => candidato.importanza !== 0)
}

export function completaGruppo<T extends Candidato>(candidati: readonly T[], dimensione: number): T[] {
  const ammessi = attivi(candidati)
  const liberi = dimensione - ammessi.filter((candidato) => candidato.stato.stato === 'nel-gruppo').length
  if (liberi <= 0) return []
  return ammessi
    .filter((candidato) => PRIORITA_INGRESSO[candidato.stato.stato] !== undefined)
    .sort(ordineIngresso)
    .slice(0, liberi)
}

export function ampiezzaFinestra(disponibili: number): number {
  return Math.min(FINESTRA, Math.max(disponibili - 1, 0))
}

type Imparato = Extract<StatoApprendimento, { stato: 'imparato' }>

function statoImparato(candidato: Candidato): Imparato {
  return candidato.stato as Imparato
}

export function pianifica<T extends Candidato>(
  candidati: readonly T[],
  richiesta: RichiestaPianificazione,
): Pianificazione<T> {
  const { oggi, turno, casualita } = richiesta
  const ammessi = attivi(candidati)
  const entrati = completaGruppo(ammessi, richiesta.dimensione)
  const nuoviDelGruppo = new Set(entrati)

  const gruppo = ammessi.filter((candidato) => candidato.stato.stato === 'nel-gruppo' || nuoviDelGruppo.has(candidato))
  const imparati = ammessi.filter((candidato) => candidato.stato.stato === 'imparato')
  const scaduti = imparati
    .filter((candidato) => controlloScaduto(candidato.stato, oggi))
    .sort(
      (a, b) =>
        statoImparato(a).controllo.localeCompare(statoImparato(b).controllo) || b.importanza - a.importanza,
    )
  const liberi = [...imparati].sort((a, b) => statoImparato(a).ultimaVista.localeCompare(statoImparato(b).ultimaVista))

  // Le fonti in ordine di preferenza: si passa alla successiva quando la finestra esclude tutta la precedente.
  let fonti: Fonte[]
  if (gruppo.length === 0) fonti = scaduti.length > 0 ? ['controllo'] : ['libero']
  else if (scaduti.length === 0) fonti = ['gruppo', 'libero']
  else fonti = turno === 'controllo' ? ['controllo', 'gruppo', 'libero'] : ['gruppo', 'controllo', 'libero']

  const elementi: Record<Fonte, readonly T[]> = { gruppo, controllo: scaduti, libero: liberi }
  const ampiezza = ampiezzaFinestra(gruppo.length + imparati.length)
  const esclusi = new Set(richiesta.ultimi.slice(Math.max(richiesta.ultimi.length - ampiezza, 0)))

  const scegli = (daEscludere: ReadonlySet<string>) => {
    for (const fonte of fonti) {
      const possibili = elementi[fonte].filter((candidato) => !daEscludere.has(candidato.id))
      if (possibili.length === 0) continue
      const indice = fonte === 'gruppo' ? Math.min(Math.floor(casualita() * possibili.length), possibili.length - 1) : 0
      return { candidato: possibili[indice], fonte }
    }
    return null
  }

  // Se la finestra esclude tutto, si ignora.
  const scelta = scegli(esclusi) ?? scegli(new Set())
  const successivo = scelta?.fonte === 'controllo' ? 'gruppo' : scelta?.fonte === 'gruppo' ? 'controllo' : turno
  return { entrati, scelta, turno: successivo }
}
