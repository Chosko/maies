// @vitest-environment node
/// <reference types="node" />
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { validaLezioni, descriviErrori } from '../src/contenuti/validazione'

// Lette a ogni esecuzione e non con import.meta.glob, il cui risultato finisce
// nella cache dei moduli di Vitest e non vedrebbe un file appena aggiunto.
// Ogni cartella è un'edizione del sito: i vincoli tra file valgono al suo interno.
const cartelle = ['lezioni', 'kids']

function leggiCartella(cartella: string) {
  if (!existsSync(cartella)) return []
  return readdirSync(cartella, { withFileTypes: true })
    .filter((voce) => !voce.isDirectory())
    .map((voce) => ({ nome: voce.name, contenuto: readFileSync(join(cartella, voce.name), 'utf8') }))
}

describe.each(cartelle)('contenuti/%s', (nome) => {
  it('ogni file di lezione è valido', () => {
    const cartella = fileURLToPath(new URL(`../contenuti/${nome}/`, import.meta.url))
    const errori = validaLezioni(leggiCartella(cartella))
    expect(errori, descriviErrori(errori)).toEqual([])
  })
})
