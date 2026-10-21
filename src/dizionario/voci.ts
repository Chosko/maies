import type { VocaboloCatalogo } from '../contenuti/catalogo'

export interface Voce {
  readonly idGlobale: string
  readonly it: string
  readonly en: readonly string[]
}

const confronto = new Intl.Collator('it', { sensitivity: 'base' })

export function voci(vocaboli: readonly VocaboloCatalogo[]): Voce[] {
  return vocaboli
    .map(({ idGlobale, it, en }) => ({ idGlobale, it, en: [...en] }))
    .sort((a, b) => confronto.compare(a.it, b.it))
}
