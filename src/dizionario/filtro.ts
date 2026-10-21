import type { Voce } from './voci'

function normalizza(testo: string): string {
  return testo
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[’‘ʼ]/g, "'")
    .trim()
    .replace(/\s+/g, ' ')
}

export function filtra<T extends Voce>(elenco: readonly T[], testoCercato: string): T[] {
  const cercato = normalizza(testoCercato)
  if (cercato === '') return [...elenco]
  return elenco.filter(
    (voce) =>
      normalizza(voce.it).includes(cercato) ||
      voce.en.some((traduzione) => normalizza(traduzione).includes(cercato)),
  )
}
