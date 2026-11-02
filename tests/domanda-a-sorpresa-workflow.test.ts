// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const radice = fileURLToPath(new URL('..', import.meta.url))
const workflow = readFileSync(`${radice}scripts/domanda-a-sorpresa.workflow.yml`, 'utf8')

/** Righe del file senza commenti né righe vuote, con il rientro conservato. */
const righe = workflow
  .split('\n')
  .map((riga) => riga.replace(/\s+#.*$/, '').replace(/^\s*#.*$/, ''))
  .filter((riga) => riga.trim() !== '')

/** Le righe del blocco che segue la chiave di primo livello `chiave:`. */
function blocco(chiave: string): string[] {
  const inizio = righe.findIndex((riga) => riga === `${chiave}:`)
  if (inizio === -1) return []
  const fine = righe.findIndex((riga, i) => i > inizio && !riga.startsWith(' '))
  return righe.slice(inizio + 1, fine === -1 ? undefined : fine).map((riga) => riga.trim())
}

describe('workflow della domanda a sorpresa', () => {
  it('gira alle 09:17, 13:47 e 18:23 UTC', () => {
    const orari = blocco('on')
      .map((riga) => /^- cron: ['"](.+)['"]$/.exec(riga)?.[1])
      .filter((orario): orario is string => orario !== undefined)
    expect(orari.sort()).toEqual(['17 9 * * *', '23 18 * * *', '47 13 * * *'])
  })

  it('si può avviare a mano e non parte a ogni push', () => {
    const attivazioni = blocco('on')
    expect(attivazioni).toContain('workflow_dispatch:')
    expect(attivazioni).toContain('schedule:')
    expect(attivazioni.some((riga) => /^(push|pull_request)\b/.test(riga))).toBe(false)
  })

  it('ha permessi di sola lettura', () => {
    expect(blocco('permissions')).toEqual(['contents: read'])
    expect(righe.filter((riga) => /\bwrite\b/.test(riga))).toEqual([])
  })

  it('installa le dipendenze ed esegue lo script con il segreto NTFY_TOPIC', () => {
    const passi = righe.map((riga) => riga.trim())
    expect(passi).toContain('- run: npm ci')
    expect(passi).toContain('- run: npm run domanda-a-sorpresa')
    expect(passi).toContain('NTFY_TOPIC: ${{ secrets.NTFY_TOPIC }}')
  })

  it('non pubblica il sito', () => {
    expect(workflow).not.toMatch(/pages|npm run build|deploy/i)
  })
})
