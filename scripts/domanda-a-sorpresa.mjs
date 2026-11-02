// Domanda a sorpresa: sceglie un vocabolo dalle lezioni dell'edizione principale
// e lo pubblica come notifica su ntfy.sh, sul canale della variabile NTFY_TOPIC.
// Esporta le funzioni pure per i test e le esegue solo se lanciato direttamente.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/** @typedef {{ id: string, vocabulary: { id: string, it: string }[] }} Lezione */
/** @typedef {{ idGlobale: string, it: string }} VocaboloScelto */
/** @typedef {{ titolo: string, testo: string, indirizzo: string, etichette: string[] }} Notifica */

const LEZIONI_RECENTI = 3
const PESO_RECENTI = 3
const PESO_ALTRE = 1
const SITO = 'https://maies.chosko.com'
const NTFY = 'https://ntfy.sh'

/** @param {Lezione} lezione */
const numeroLezione = (lezione) => Number.parseInt(lezione.id, 10)

/**
 * Sceglie il vocabolo della domanda: pesano 3 quelli delle tre lezioni più
 * recenti (numero più alto), 1 gli altri; uniforme a parità di peso.
 * @param {Lezione[]} lezioni
 * @param {() => number} casuale valore in [0, 1)
 * @returns {VocaboloScelto | null}
 */
export function scegliVocabolo(lezioni, casuale = Math.random) {
  const recenti = new Set(
    [...lezioni]
      .sort((a, b) => numeroLezione(b) - numeroLezione(a))
      .slice(0, LEZIONI_RECENTI)
      .map((lezione) => lezione.id),
  )
  const candidati = lezioni.flatMap((lezione) =>
    lezione.vocabulary.map((vocabolo) => ({
      vocabolo: { idGlobale: `${lezione.id}/${vocabolo.id}`, it: vocabolo.it },
      peso: recenti.has(lezione.id) ? PESO_RECENTI : PESO_ALTRE,
    })),
  )
  if (candidati.length === 0) return null

  const totale = candidati.reduce((somma, c) => somma + c.peso, 0)
  let resto = casuale() * totale
  for (const candidato of candidati) {
    if (resto < candidato.peso) return candidato.vocabolo
    resto -= candidato.peso
  }
  return candidati[candidati.length - 1].vocabolo
}

/**
 * @param {VocaboloScelto} vocabolo
 * @returns {Notifica}
 */
export function componiNotifica(vocabolo) {
  return {
    titolo: 'maies',
    testo: `Come si dice «${vocabolo.it}»?`,
    indirizzo: `${SITO}/#/vocaboli?parola=${encodeURIComponent(vocabolo.idGlobale)}`,
    etichette: ['speech_balloon'],
  }
}

/**
 * @param {Lezione[]} lezioni
 * @param {() => number} casuale
 * @returns {Notifica | null}
 */
export function scegliDomanda(lezioni, casuale = Math.random) {
  const vocabolo = scegliVocabolo(lezioni, casuale)
  return vocabolo ? componiNotifica(vocabolo) : null
}

/**
 * Legge i file .json della cartella; una cartella che non esiste vale zero lezioni.
 * @param {string} cartella
 * @returns {Lezione[]}
 */
export function leggiLezioni(cartella) {
  if (!existsSync(cartella)) return []
  return readdirSync(cartella)
    .filter((nome) => nome.endsWith('.json'))
    .sort()
    .map((nome) => JSON.parse(readFileSync(join(cartella, nome), 'utf8')))
}

/**
 * Pubblica la domanda. Senza canale o senza vocaboli scrive il motivo e non
 * pubblica; un errore di ntfy.sh è un'eccezione. Il canale non va mai nel log.
 * @param {{
 *   canale: string | undefined,
 *   lezioni: Lezione[],
 *   casuale?: () => number,
 *   fetch?: typeof globalThis.fetch,
 *   log?: (riga: string) => void,
 * }} opzioni
 * @returns {Promise<void>}
 */
export async function esegui({ canale, lezioni, casuale = Math.random, fetch = globalThis.fetch, log = console.log }) {
  if (!canale) {
    log('NTFY_TOPIC non è impostata: nessuna domanda inviata.')
    return
  }
  const notifica = scegliDomanda(lezioni, casuale)
  if (!notifica) {
    log('Nessun vocabolo nelle lezioni: nessuna domanda inviata.')
    return
  }

  /** @type {Response} */
  let risposta
  try {
    risposta = await fetch(`${NTFY}/${canale}`, {
      method: 'POST',
      body: notifica.testo,
      headers: {
        Title: notifica.titolo,
        Click: notifica.indirizzo,
        Tags: notifica.etichette.join(','),
      },
    })
  } catch {
    // Il messaggio originale può contenere l'indirizzo, e con esso il canale.
    throw new Error('ntfy.sh non ha risposto.')
  }
  if (!risposta.ok) throw new Error(`ntfy.sh ha risposto con lo stato ${risposta.status}.`)
  log(`Domanda inviata: ${notifica.testo}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cartella = fileURLToPath(new URL('../contenuti/lezioni/', import.meta.url))
  esegui({ canale: process.env.NTFY_TOPIC, lezioni: leggiLezioni(cartella) }).catch((errore) => {
    console.error(errore instanceof Error ? errore.message : 'Invio della domanda non riuscito.')
    process.exitCode = 1
  })
}
