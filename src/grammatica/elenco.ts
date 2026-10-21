import type { LezioneCatalogo } from '../contenuti/catalogo'

export interface VoceGrammatica {
  readonly id: string
  readonly title: string
  readonly schede: readonly string[]
}

function perId<T extends { readonly id: string }>(a: T, b: T): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

export function elenco(lezioni: readonly LezioneCatalogo[]): VoceGrammatica[] {
  return lezioni
    .filter((lezione) => lezione.grammar.length > 0)
    .sort(perId)
    .map((lezione) => ({
      id: lezione.id,
      title: lezione.title,
      schede: [...lezione.grammar].sort(perId).map((scheda) => scheda.title),
    }))
}
