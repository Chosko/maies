import type { Esito } from '../ripasso/livelli'

const APOSTROFI_TIPOGRAFICI = /[’‘ʼ]/g
const PUNTEGGIATURA_FINALE = /[\s.!?,;:]+$/

function normalizza(testo: string): string {
  return testo
    .toLowerCase()
    .replace(APOSTROFI_TIPOGRAFICI, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(PUNTEGGIATURA_FINALE, '')
}

export function verifica(risposta: string, traduzioniAccettate: readonly string[]): Esito {
  const normalizzata = normalizza(risposta)
  if (normalizzata === '') return 'sbagliato'
  return traduzioniAccettate.some((traduzione) => normalizza(traduzione) === normalizzata)
    ? 'giusto'
    : 'sbagliato'
}
