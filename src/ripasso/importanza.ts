export const IMPORTANZE = [0, 1, 2, 3] as const

export type Importanza = (typeof IMPORTANZE)[number]

export const IMPORTANZA_INIZIALE: Importanza = 2

export const FATTORI: Readonly<Record<Importanza, number>> = {
  0: 0,
  1: 0.5,
  2: 1,
  3: 2,
}

export function isImportanza(valore: unknown): valore is Importanza {
  return (IMPORTANZE as readonly unknown[]).includes(valore)
}
