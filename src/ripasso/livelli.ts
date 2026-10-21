export const LIVELLI = ['da-ripassare', 'normale', 'consolidato'] as const

export type Livello = (typeof LIVELLI)[number]

export type Esito = 'giusto' | 'sbagliato'

export const LIVELLO_INIZIALE: Livello = 'normale'

export const PESI: Readonly<Record<Livello, number>> = {
  'da-ripassare': 6,
  normale: 3,
  consolidato: 1,
}

export function isLivello(valore: unknown): valore is Livello {
  return (LIVELLI as readonly unknown[]).includes(valore)
}

export function nuovoLivello(attuale: Livello, esito: Esito): Livello {
  if (esito === 'sbagliato') return 'da-ripassare'
  return attuale === 'da-ripassare' ? 'normale' : 'consolidato'
}
