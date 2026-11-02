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

  function sezione(corpo: string, titolo: string) {
    const inizio = corpo.indexOf(`## ${titolo}`)
    if (inizio < 0) throw new Error(`sezione mancante: ${titolo}`)
    const fine = corpo.indexOf('\n## ', inizio + 1)
    return corpo.slice(inizio, fine < 0 ? undefined : fine)
  }

  it('dà un aiuto a ogni frase e frase d\'esempio e trucco ai vocaboli della lezione da PDF', () => {
    const testo = sezione(leggiSkill().corpo, 'Una lezione da PDF o foto')
    expect(testo).toContain('aiuto')
    expect(testo).toContain("frase d'esempio")
    expect(testo).toContain('trucco')
    expect(testo).toMatch(/^8\. /m)
  })

  it('dà frasi d\'esempio e trucchi adatti a una bambina ai vocaboli dei kids', () => {
    const testo = sezione(leggiSkill().corpo, 'Una lista di vocaboli per i kids')
    expect(testo).toContain("frasi d'esempio")
    expect(testo).toContain('trucchi')
    expect(testo).toContain('bambina')
  })

  it('dà frase d\'esempio e trucco al vocabolo singolo', () => {
    const testo = sezione(leggiSkill().corpo, 'Un vocabolo singolo')
    expect(testo).toContain("frase d'esempio")
    expect(testo).toContain('trucco')
  })

  it('descrive il completamento del materiale esistente senza cambiare gli id', () => {
    const testo = sezione(leggiSkill().corpo, 'Il completamento del materiale esistente')
    for (const parola of ['aiuto', "frase d'esempio", 'trucco', 'contenuti/lezioni/', 'contenuti/kids/']) {
      expect(testo).toContain(parola)
    }
    expect(testo).toMatch(/id non cambiano/)
  })

  it('non ricopia il formato dei file di lezione', () => {
    const { corpo } = leggiSkill()
    for (const chiave of ['"sentences"', '"vocabulary"', '"grammar"', '"alternatives"']) {
      expect(corpo).not.toContain(chiave)
    }
  })
})
