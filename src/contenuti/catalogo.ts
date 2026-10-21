import type { Frase, Lezione, Scheda, Vocabolo } from './schema'

type SolaLettura<T> = {
  readonly [K in keyof T]: T[K] extends readonly (infer E)[] ? readonly E[] : T[K]
}

interface Collocazione {
  readonly idGlobale: string
  readonly idLezione: string
}

export type FraseCatalogo = SolaLettura<Frase> & Collocazione
export type VocaboloCatalogo = SolaLettura<Vocabolo> & Collocazione
export type SchedaCatalogo = SolaLettura<Scheda>

export interface LezioneCatalogo {
  readonly id: string
  readonly title: string
  readonly sentences: readonly FraseCatalogo[]
  readonly vocabulary: readonly VocaboloCatalogo[]
  readonly grammar: readonly SchedaCatalogo[]
}

export interface Catalogo {
  readonly lezioni: readonly LezioneCatalogo[]
  readonly frasi: readonly FraseCatalogo[]
  readonly vocaboli: readonly VocaboloCatalogo[]
  lezione(id: string): LezioneCatalogo | undefined
  frase(idGlobale: string): FraseCatalogo | undefined
  vocabolo(idGlobale: string): VocaboloCatalogo | undefined
}

function colloca<T extends { id: string }>(
  elemento: T,
  idLezione: string,
): SolaLettura<T> & Collocazione {
  const copia: Record<string, unknown> = { idGlobale: `${idLezione}/${elemento.id}`, idLezione }
  for (const [chiave, valore] of Object.entries(elemento)) {
    copia[chiave] = Array.isArray(valore) ? Object.freeze([...valore]) : valore
  }
  return Object.freeze(copia) as SolaLettura<T> & Collocazione
}

function indice<T extends Collocazione>(elementi: readonly T[]): Map<string, T> {
  return new Map(elementi.map((elemento) => [elemento.idGlobale, elemento]))
}

export function costruisciCatalogo(moduli: Readonly<Record<string, Lezione>>): Catalogo {
  const lezioni = Object.freeze(
    Object.values(moduli)
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      .map((lezione) =>
        Object.freeze({
          id: lezione.id,
          title: lezione.title,
          sentences: Object.freeze(lezione.sentences.map((frase) => colloca(frase, lezione.id))),
          vocabulary: Object.freeze(lezione.vocabulary.map((voce) => colloca(voce, lezione.id))),
          grammar: Object.freeze(lezione.grammar.map((scheda) => Object.freeze({ ...scheda }))),
        }),
      ),
  )
  const frasi = Object.freeze(lezioni.flatMap((lezione) => lezione.sentences))
  const vocaboli = Object.freeze(lezioni.flatMap((lezione) => lezione.vocabulary))

  const perId = new Map(lezioni.map((lezione) => [lezione.id, lezione]))
  const frasiPerId = indice(frasi)
  const vocaboliPerId = indice(vocaboli)

  return Object.freeze({
    lezioni,
    frasi,
    vocaboli,
    lezione: (id: string) => perId.get(id),
    frase: (idGlobale: string) => frasiPerId.get(idGlobale),
    vocabolo: (idGlobale: string) => vocaboliPerId.get(idGlobale),
  })
}

// Nessuna validazione qui: un file malformato ferma il test di validità prima della pubblicazione.
export const catalogo = costruisciCatalogo(
  import.meta.glob<Lezione>('../../contenuti/lezioni/*.json', { eager: true, import: 'default' }),
)
