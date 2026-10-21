// @vitest-environment node
/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs'
import { join, posix, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import {
  validaLezioni,
  descriviErrori,
  type ErroreValidazione,
  type FileLezione,
} from '../src/contenuti/validazione'

type Dati = Record<string, unknown>

function lezione(id: string, extra: Dati = {}): Dati {
  return {
    id,
    title: 'Lezione di prova',
    sentences: [],
    vocabulary: [],
    grammar: [],
    ...extra,
  }
}

function file(dati: Dati, nome = `${String(dati.id)}.json`): FileLezione {
  return { nome, contenuto: JSON.stringify(dati) }
}

function frase(id: string, it: string, en = 'Translation.', alternatives: string[] = []): Dati {
  return { id, it, en, alternatives }
}

function vocabolo(id: string, it: string, en: string[] = ['word']): Dati {
  return { id, it, en }
}

function scheda(id: string, title = 'Argomento', body = 'Testo **Markdown**.'): Dati {
  return { id, title, body }
}

const lezioneValida = lezione('01-to-be', {
  title: 'Il verbo essere',
  sentences: [
    frase('f01', 'Io sono stanco.', 'I am tired.', ["I'm tired."]),
    frase('f02', 'Lei è a casa?', 'Is she at home?'),
  ],
  vocabulary: [vocabolo('v01', 'stanco', ['tired']), vocabolo('v02', 'pesca (frutto)', ['peach'])],
  grammar: [scheda('g01', 'Il verbo to be')],
})

const altraLezioneValida = lezione('02-present-continuous', {
  title: 'Il presente progressivo',
  sentences: [frase('f01', 'Sto mangiando una mela.', 'I am eating an apple.')],
  vocabulary: [vocabolo('v01', 'mela', ['apple'])],
})

function erroriDi(lezioni: (Dati | FileLezione)[]): ErroreValidazione[] {
  return validaLezioni(lezioni.map((l) => ('nome' in l ? (l as FileLezione) : file(l))))
}

function soloLezione(extra: Dati): ErroreValidazione[] {
  return erroriDi([lezioneValida, lezione('02-prova', extra)])
}

describe('validaLezioni — insieme valido', () => {
  it('accetta un insieme di lezioni valido', () => {
    expect(erroriDi([lezioneValida, altraLezioneValida])).toEqual([])
  })

  it('accetta una cartella vuota', () => {
    expect(validaLezioni([])).toEqual([])
  })

  it('accetta una lezione con una sola lista non vuota', () => {
    expect(erroriDi([lezione('01-solo-schede', { grammar: [scheda('g01')] })])).toEqual([])
  })
})

describe('validaLezioni — schema', () => {
  it('rifiuta un file .json che non contiene JSON valido', () => {
    const errori = validaLezioni([{ nome: '01-rotto.json', contenuto: '{ non json' }])
    expect(errori).toHaveLength(1)
    expect(errori[0].file).toBe('01-rotto.json')
  })

  it('rifiuta una chiave mancante della lezione', () => {
    const dati = lezione('01-prova', { sentences: [frase('f01', 'Ciao.')] })
    delete dati.title
    const errori = erroriDi([dati])
    expect(errori).toHaveLength(1)
    expect(errori[0].file).toBe('01-prova.json')
    expect(errori[0].elemento).toBe('title')
  })

  it('rifiuta una chiave sconosciuta nella lezione', () => {
    const errori = soloLezione({ sentences: [frase('f01', 'Ciao.')], date: '2026-01-01' })
    expect(errori).toHaveLength(1)
    expect(errori[0].file).toBe('02-prova.json')
    expect(errori[0].messaggio).toContain('date')
  })

  it('rifiuta una chiave sconosciuta in un elemento e nomina l’elemento', () => {
    const errori = soloLezione({
      sentences: [{ ...frase('f01', 'Ciao.'), note: 'x' }],
    })
    expect(errori).toHaveLength(1)
    expect(errori[0].elemento).toBe('sentences[0]')
    expect(errori[0].messaggio).toContain('note')
  })

  it('rifiuta una lezione con tutte e tre le liste vuote', () => {
    const errori = erroriDi([lezione('01-vuota')])
    expect(errori).toHaveLength(1)
    expect(errori[0].file).toBe('01-vuota.json')
  })

  it('rifiuta un vocabolo senza traduzioni', () => {
    const errori = soloLezione({ vocabulary: [vocabolo('v01', 'casa', [])] })
    expect(errori).toHaveLength(1)
    expect(errori[0].elemento).toBe('vocabulary[0].en')
  })

  it.each([
    ['vuoto', ''],
    ['con spazio iniziale', ' Ciao.'],
    ['con spazio finale', 'Ciao. '],
    ['di soli spazi', '   '],
  ])('rifiuta un testo %s', (_caso, testo) => {
    const errori = soloLezione({ sentences: [frase('f01', testo)] })
    expect(errori).toHaveLength(1)
    expect(errori[0].elemento).toBe('sentences[0].it')
  })

  it('applica il vincolo sui testi anche a titoli, alternative, traduzioni e schede', () => {
    const errori = soloLezione({
      title: '',
      sentences: [frase('f01', 'Ciao.', 'Hello.', [' Hi.'])],
      vocabulary: [vocabolo('v01', 'casa', ['house '])],
      grammar: [scheda('g01', 'Titolo', '')],
    })
    expect(errori.map((e) => e.elemento).sort()).toEqual(
      ['grammar[0].body', 'sentences[0].alternatives[0]', 'title', 'vocabulary[0].en[0]'].sort(),
    )
  })

  it('rifiuta un valore del tipo sbagliato', () => {
    const errori = soloLezione({ sentences: [{ ...frase('f01', 'Ciao.'), alternatives: 'Hi.' }] })
    expect(errori).toHaveLength(1)
    expect(errori[0].elemento).toBe('sentences[0].alternatives')
  })
})

describe('validaLezioni — nome del file e id della lezione', () => {
  it('rifiuta un nome di file diverso dall’id', () => {
    const errori = erroriDi([file(lezioneValida, '01-essere.json')])
    expect(errori).toHaveLength(1)
    expect(errori[0].file).toBe('01-essere.json')
    expect(errori[0].messaggio).toContain('01-to-be')
  })

  it.each(['1-to-be', '001-to-be', '01_to_be', '01-To-Be', '01-', 'to-be', '01-to--be'])(
    'rifiuta l’id "%s" che non ha la forma NN-argomento',
    (id) => {
      const errori = erroriDi([lezione(id, { grammar: [scheda('g01')] })])
      expect(errori).toHaveLength(1)
      expect(errori[0].file).toBe(`${id}.json`)
      expect(errori[0].messaggio).toContain(id)
    },
  )

  it('rifiuta due lezioni con lo stesso numero', () => {
    const errori = erroriDi([lezioneValida, lezione('01-altro', { grammar: [scheda('g01')] })])
    expect(errori).toHaveLength(1)
    expect(errori[0].file).toBe('01-to-be.json')
    expect(errori[0].messaggio).toContain('01-altro.json')
  })
})

describe('validaLezioni — id degli elementi', () => {
  it.each([
    ['sentences', { sentences: [frase('v01', 'Ciao.')] }, 'v01'],
    ['sentences', { sentences: [frase('f1', 'Ciao.')] }, 'f1'],
    ['vocabulary', { vocabulary: [vocabolo('f01', 'casa')] }, 'f01'],
    ['vocabulary', { vocabulary: [vocabolo('v001', 'casa')] }, 'v001'],
    ['grammar', { grammar: [scheda('G01')] }, 'G01'],
  ])('rifiuta in %s un id malformato', (_lista, extra, id) => {
    const errori = soloLezione(extra)
    expect(errori).toHaveLength(1)
    expect(errori[0].file).toBe('02-prova.json')
    expect(errori[0].elemento).toBe(id)
  })

  it('rifiuta un id ripetuto nella lezione', () => {
    const errori = soloLezione({
      vocabulary: [vocabolo('v01', 'casa', ['house']), vocabolo('v01', 'cane', ['dog'])],
    })
    expect(errori).toHaveLength(1)
    expect(errori[0].file).toBe('02-prova.json')
    expect(errori[0].elemento).toBe('v01')
  })

  it('accetta lo stesso id di elemento in lezioni diverse', () => {
    expect(erroriDi([lezioneValida, altraLezioneValida])).toEqual([])
  })
})

describe('validaLezioni — frasi e vocaboli ripetuti', () => {
  it('rifiuta la stessa frase italiana due volte nella stessa lezione', () => {
    const errori = soloLezione({
      sentences: [frase('f01', 'Ciao.', 'Hello.'), frase('f02', 'Ciao.', 'Hi.')],
    })
    expect(errori).toHaveLength(1)
    expect(errori[0].file).toBe('02-prova.json')
    expect(errori[0].elemento).toBe('f02')
    expect(errori[0].messaggio).toContain('f01')
  })

  it('rifiuta la stessa frase italiana in lezioni diverse, ignorando maiuscole, spazi e punteggiatura finale', () => {
    const errori = soloLezione({
      sentences: [frase('f01', 'io  SONO stanco!')],
    })
    expect(errori).toHaveLength(1)
    expect(errori[0].file).toBe('02-prova.json')
    expect(errori[0].elemento).toBe('f01')
    expect(errori[0].messaggio).toContain('01-to-be.json')
  })

  it('rifiuta lo stesso vocabolo italiano in lezioni diverse, ignorando maiuscole e spazi', () => {
    const errori = soloLezione({ vocabulary: [vocabolo('v01', 'Pesca  (frutto)', ['peach'])] })
    expect(errori).toHaveLength(1)
    expect(errori[0].file).toBe('02-prova.json')
    expect(errori[0].elemento).toBe('v01')
    expect(errori[0].messaggio).toContain('01-to-be.json')
  })

  it('non confonde una frase con un vocabolo dallo stesso testo', () => {
    expect(
      soloLezione({ sentences: [frase('f01', 'stanco')], vocabulary: [vocabolo('v01', 'mela')] }),
    ).toEqual([])
  })

  it('distingue testi diversi nel mezzo della frase', () => {
    expect(soloLezione({ sentences: [frase('f01', 'Io sono stanca.')] })).toEqual([])
  })
})

describe('validaLezioni — traduzioni ripetute', () => {
  it('rifiuta l’en di una frase ripetuto fra le alternatives', () => {
    const errori = soloLezione({
      sentences: [frase('f01', 'Ciao.', 'Hello.', ['Hi.', 'Hello.'])],
    })
    expect(errori).toHaveLength(1)
    expect(errori[0].file).toBe('02-prova.json')
    expect(errori[0].elemento).toBe('f01')
    expect(errori[0].messaggio).toContain('Hello.')
  })

  it('rifiuta una traduzione ripetuta in un vocabolo', () => {
    const errori = soloLezione({ vocabulary: [vocabolo('v01', 'casa', ['house', 'home', 'house'])] })
    expect(errori).toHaveLength(1)
    expect(errori[0].file).toBe('02-prova.json')
    expect(errori[0].elemento).toBe('v01')
    expect(errori[0].messaggio).toContain('house')
  })
})

describe('validaLezioni — file non JSON', () => {
  it.each(['lezione.pdf', 'foto.jpg', 'appunti.txt', 'senza-estensione'])(
    'rifiuta il file %s',
    (nome) => {
      const errori = validaLezioni([file(lezioneValida), { nome, contenuto: 'qualcosa' }])
      expect(errori).toHaveLength(1)
      expect(errori[0].file).toBe(nome)
    },
  )
})

describe('descriviErrori', () => {
  it('nomina file ed elemento di ogni errore, una riga ciascuno', () => {
    const testo = descriviErrori([
      { file: '01-a.json', elemento: 'f01', messaggio: 'primo' },
      { file: 'foto.jpg', messaggio: 'secondo' },
    ])
    expect(testo.split('\n')).toEqual(['01-a.json › f01: primo', 'foto.jpg: secondo'])
  })
})

function importaValoriDalloSchema(percorso: string, testo: string): boolean {
  const cartella = posix.dirname(percorso.split(sep).join('/'))
  for (const [istruzione, specificatore] of testo.matchAll(
    /^\s*import\b[^'"]*?['"]([^'"]+)['"]/gm,
  )) {
    if (!specificatore.startsWith('.')) continue
    const risolto = posix.join(cartella, specificatore).replace(/\.ts$/, '')
    if (risolto === 'contenuti/schema' && !/^\s*import\s+type\b/.test(istruzione)) return true
  }
  return false
}

describe('zod resta fuori dall’app', () => {
  // Letti a ogni esecuzione: un import.meta.glob finirebbe nella cache dei moduli.
  const src = fileURLToPath(new URL('../src/', import.meta.url))
  const app = (readdirSync(src, { recursive: true }) as string[])
    .filter((percorso) => /\.(ts|vue)$/.test(percorso))
    .filter((percorso) => !/^contenuti[\\/](schema|validazione)\.ts$/.test(percorso))
    .map((percorso) => [percorso, readFileSync(join(src, percorso), 'utf8')])

  it.each(app)('%s non importa zod e prende solo tipi dallo schema', (percorso, testo) => {
    expect(testo).not.toMatch(/from\s+['"]zod['"]/)
    expect(importaValoriDalloSchema(percorso, testo)).toBe(false)
  })

  it.each([
    ['contenuti/catalogo.ts', "import { schemaLezione } from './schema'", true],
    ['contenuti/catalogo.ts', "import { type Lezione } from './schema.ts'", true],
    ['views/EserciziView.vue', "import { schemaLezione } from '../contenuti/schema'", true],
    ['contenuti/catalogo.ts', "import './schema'", true],
    ['contenuti/catalogo.ts', "import type { Lezione } from './schema'", false],
    ['views/EserciziView.vue', "import type { Lezione } from '../contenuti/schema'", false],
    ['views/EserciziView.vue', "import { ref } from 'vue'\nimport { schema } from './schema'", false],
  ])('in %s riconosce «%s» come import di valori: %s', (percorso, testo, atteso) => {
    expect(importaValoriDalloSchema(percorso, testo)).toBe(atteso)
  })
})
