import { PESI } from './livelli'
import type { Livello } from './livelli'
import { FATTORI } from './importanza'
import type { Importanza } from './importanza'

export interface Candidato {
  readonly id: string
  readonly livello: Livello
  readonly importanza: Importanza
}

export type Casualita = () => number

function peso(candidato: Candidato): number {
  return PESI[candidato.livello] * FATTORI[candidato.importanza]
}

export function scegli<T extends Candidato>(
  candidati: readonly T[],
  esclusi: Iterable<string>,
  casualita: Casualita,
): T | null {
  const daEscludere = new Set(esclusi)
  const ammessi = candidati.filter((candidato) => !daEscludere.has(candidato.id) && peso(candidato) > 0)
  if (ammessi.length === 0) return null

  const totale = ammessi.reduce((somma, candidato) => somma + peso(candidato), 0)
  let soglia = casualita() * totale
  for (const candidato of ammessi) {
    soglia -= peso(candidato)
    if (soglia < 0) return candidato
  }
  return ammessi[ammessi.length - 1]
}
