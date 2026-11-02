export const IMPORTANZE = [0, 1, 2, 3] as const

export type Importanza = (typeof IMPORTANZE)[number]

export type ImportanzaAttiva = Exclude<Importanza, 0>

export const IMPORTANZA_INIZIALE: Importanza = 2

export const FATTORI_INTERVALLO: Readonly<Record<ImportanzaAttiva, number>> = {
  1: 2,
  2: 1,
  3: 0.5,
}

export function isImportanza(valore: unknown): valore is Importanza {
  return (IMPORTANZE as readonly unknown[]).includes(valore)
}
