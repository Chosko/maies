import { z } from 'zod'

const testo = z
  .string()
  .regex(/^\S(?:[\s\S]*\S)?$/, 'il testo è vuoto o ha spazi iniziali o finali')

export const schemaFrase = z.strictObject({
  id: testo,
  it: testo,
  en: testo,
  alternatives: z.array(testo),
})

export const schemaVocabolo = z.strictObject({
  id: testo,
  it: testo,
  en: z.array(testo).min(1, 'serve almeno una traduzione'),
})

export const schemaScheda = z.strictObject({
  id: testo,
  title: testo,
  body: testo,
})

export const schemaLezione = z
  .strictObject({
    id: testo,
    title: testo,
    sentences: z.array(schemaFrase),
    vocabulary: z.array(schemaVocabolo),
    grammar: z.array(schemaScheda),
  })
  .refine(
    (lezione) =>
      lezione.sentences.length + lezione.vocabulary.length + lezione.grammar.length > 0,
    'la lezione non ha né frasi né vocaboli né schede',
  )

export type Frase = z.infer<typeof schemaFrase>
export type Vocabolo = z.infer<typeof schemaVocabolo>
export type Scheda = z.infer<typeof schemaScheda>
export type Lezione = z.infer<typeof schemaLezione>
