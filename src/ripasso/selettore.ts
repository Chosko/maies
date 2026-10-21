import { PESI } from './livelli'
import type { Livello } from './livelli'

export interface Candidato {
  readonly id: string
  readonly livello: Livello
}

export type Casualita = () => number

export function scegli<T extends Candidato>(
  candidati: readonly T[],
  esclusi: Iterable<string>,
  casualita: Casualita,
): T | null {
  const daEscludere = new Set(esclusi)
  const ammessi = candidati.filter((candidato) => !daEscludere.has(candidato.id))
  if (ammessi.length === 0) return null

  const totale = ammessi.reduce((somma, candidato) => somma + PESI[candidato.livello], 0)
  let soglia = casualita() * totale
  for (const candidato of ammessi) {
    soglia -= PESI[candidato.livello]
    if (soglia < 0) return candidato
  }
  return ammessi[ammessi.length - 1]
}
