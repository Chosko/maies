// @vitest-environment node
/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const percorso = fileURLToPath(new URL('../.claude/skills/aggiunta-materiale/SKILL.md', import.meta.url))

function leggiSkill() {
  const testo = readFileSync(percorso, 'utf8')
  const parti = testo.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!parti) throw new Error('SKILL.md senza frontmatter')
  const campi = new Map<string, string>()
  for (const riga of parti[1].split('\n')) {
    const campo = riga.match(/^(\w+):\s*(.*)$/)
    if (campo) campi.set(campo[1], campo[2].trim())
  }
  return { campi, corpo: parti[2] }
}

describe('skill aggiunta-materiale', () => {
  it('esiste', () => {
    expect(existsSync(percorso)).toBe(true)
  })

  it('ha nel frontmatter il nome e una descrizione che nomina il materiale', () => {
    const { campi } = leggiSkill()
    expect(campi.get('name')).toBe('aggiunta-materiale')
    const descrizione = campi.get('description') ?? ''
    for (const parola of ['PDF', 'foto', 'vocabolo', 'correzione']) {
      expect(descrizione).toContain(parola)
    }
  })

  it('rimanda al documento di feature e nomina il test di validità', () => {
    const { corpo } = leggiSkill()
    expect(corpo).toContain('.claude/domain/features/aggiunta-materiale-lezione.md')
    expect(corpo).toContain('npm test')
  })

  it('manda il materiale per i kids nella sua cartella', () => {
    const { campi, corpo } = leggiSkill()
    expect(campi.get('description') ?? '').toContain('kids')
    expect(corpo).toContain('contenuti/kids/')
  })

  it('non ricopia il formato dei file di lezione', () => {
    const { corpo } = leggiSkill()
    for (const chiave of ['"sentences"', '"vocabulary"', '"grammar"', '"alternatives"']) {
      expect(corpo).not.toContain(chiave)
    }
  })
})
