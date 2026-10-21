// @vitest-environment node
/// <reference types="node" />
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { validaLezioni, descriviErrori } from '../src/contenuti/validazione'

// Letta a ogni esecuzione e non con import.meta.glob, il cui risultato finisce
// nella cache dei moduli di Vitest e non vedrebbe un file appena aggiunto.
const cartella = fileURLToPath(new URL('../contenuti/lezioni/', import.meta.url))

function leggiCartella() {
  if (!existsSync(cartella)) return []
  return readdirSync(cartella, { withFileTypes: true })
    .filter((voce) => !voce.isDirectory())
    .map((voce) => ({ nome: voce.name, contenuto: readFileSync(join(cartella, voce.name), 'utf8') }))
}

describe('contenuti/lezioni', () => {
  it('ogni file di lezione è valido', () => {
    const errori = validaLezioni(leggiCartella())
    expect(errori, descriviErrori(errori)).toEqual([])
  })
})
