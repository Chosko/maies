import { schemaLezione, type Lezione } from './schema'

export interface FileLezione {
  nome: string
  contenuto: string
}

export interface ErroreValidazione {
  file: string
  elemento?: string
  messaggio: string
}

const formaIdLezione = /^(\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*$/

const liste = [
  { chiave: 'sentences', prefisso: 'f' },
  { chiave: 'vocabulary', prefisso: 'v' },
  { chiave: 'grammar', prefisso: 'g' },
] as const

function normalizza(testo: string): string {
  return testo
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[\s.,;:!?…]+$/u, '')
    .trim()
}

function percorso(path: readonly PropertyKey[]): string | undefined {
  let risultato = ''
  for (const parte of path) {
    risultato += typeof parte === 'number' ? `[${parte}]` : risultato ? `.${String(parte)}` : String(parte)
  }
  return risultato || undefined
}

function leggi(file: FileLezione, errori: ErroreValidazione[]): Lezione | undefined {
  if (!file.nome.endsWith('.json')) {
    errori.push({ file: file.nome, messaggio: 'non è un file JSON: nella cartella vanno solo lezioni' })
    return undefined
  }
  let dati: unknown
  try {
    dati = JSON.parse(file.contenuto)
  } catch (e) {
    errori.push({ file: file.nome, messaggio: `JSON non valido: ${(e as Error).message}` })
    return undefined
  }
  const esito = schemaLezione.safeParse(dati)
  if (!esito.success) {
    for (const problema of esito.error.issues) {
      errori.push({
        file: file.nome,
        elemento: percorso(problema.path),
        messaggio: `schema non rispettato: ${problema.message}`,
      })
    }
    return undefined
  }
  return esito.data
}

function controllaRipetuti(
  testi: string[],
  errore: (ripetuto: string) => void,
) {
  const visti = new Set<string>()
  for (const testo of testi) {
    const chiave = normalizza(testo)
    if (visti.has(chiave)) errore(testo)
    visti.add(chiave)
  }
}

export function validaLezioni(files: FileLezione[]): ErroreValidazione[] {
  const errori: ErroreValidazione[] = []
  const ordinati = [...files].sort((a, b) => (a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0))
  const numeri = new Map<string, string>()
  const frasi = new Map<string, string>()
  const vocaboli = new Map<string, string>()

  for (const file of ordinati) {
    const lezione = leggi(file, errori)
    if (!lezione) continue
    const nome = file.nome

    const forma = formaIdLezione.exec(lezione.id)
    if (!forma) {
      errori.push({ file: nome, messaggio: `l'id "${lezione.id}" non ha la forma NN-argomento` })
    } else {
      const primo = numeri.get(forma[1])
      if (primo) {
        errori.push({ file: nome, messaggio: `il numero ${forma[1]} è già usato da ${primo}` })
      } else {
        numeri.set(forma[1], nome)
      }
    }
    if (nome !== `${lezione.id}.json`) {
      errori.push({ file: nome, messaggio: `il nome del file non coincide con l'id "${lezione.id}"` })
    }

    const idVisti = new Set<string>()
    for (const { chiave, prefisso } of liste) {
      for (const elemento of lezione[chiave]) {
        if (!new RegExp(`^${prefisso}\\d{2}$`).test(elemento.id)) {
          errori.push({
            file: nome,
            elemento: elemento.id,
            messaggio: `l'id non ha la forma ${prefisso}NN richiesta in ${chiave}`,
          })
        } else if (idVisti.has(elemento.id)) {
          errori.push({ file: nome, elemento: elemento.id, messaggio: `l'id è ripetuto nella lezione` })
        }
        idVisti.add(elemento.id)
      }
    }

    for (const frase of lezione.sentences) {
      const dove = `${nome} › ${frase.id}`
      const primo = frasi.get(normalizza(frase.it))
      if (primo) {
        errori.push({ file: nome, elemento: frase.id, messaggio: `la frase "${frase.it}" c'è già in ${primo}` })
      } else {
        frasi.set(normalizza(frase.it), dove)
      }
      controllaRipetuti([frase.en, ...frase.alternatives], (ripetuto) =>
        errori.push({
          file: nome,
          elemento: frase.id,
          messaggio: `la traduzione "${ripetuto}" è ripetuta fra en e alternatives`,
        }),
      )
    }

    for (const vocabolo of lezione.vocabulary) {
      const dove = `${nome} › ${vocabolo.id}`
      const primo = vocaboli.get(normalizza(vocabolo.it))
      if (primo) {
        errori.push({
          file: nome,
          elemento: vocabolo.id,
          messaggio: `il vocabolo "${vocabolo.it}" c'è già in ${primo}`,
        })
      } else {
        vocaboli.set(normalizza(vocabolo.it), dove)
      }
      controllaRipetuti(vocabolo.en, (ripetuto) =>
        errori.push({ file: nome, elemento: vocabolo.id, messaggio: `la traduzione "${ripetuto}" è ripetuta` }),
      )
    }
  }

  return errori
}

export function descriviErrori(errori: ErroreValidazione[]): string {
  return errori
    .map((e) => `${e.file}${e.elemento ? ` › ${e.elemento}` : ''}: ${e.messaggio}`)
    .join('\n')
}
