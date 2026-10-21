// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { html } from '../src/grammatica/markdown'

describe('conversione del Markdown delle schede', () => {
  it('converte le intestazioni', () => {
    expect(html('# Titolo\n\n## Sottotitolo\n\n### Terzo')).toBe(
      '<h1>Titolo</h1>\n<h2>Sottotitolo</h2>\n<h3>Terzo</h3>\n',
    )
  })

  it('converte i paragrafi', () => {
    expect(html('Primo paragrafo.\n\nSecondo paragrafo.')).toBe(
      '<p>Primo paragrafo.</p>\n<p>Secondo paragrafo.</p>\n',
    )
  })

  it('converte gli elenchi puntati e numerati', () => {
    expect(html('- uno\n- due')).toBe('<ul>\n<li>uno</li>\n<li>due</li>\n</ul>\n')
    expect(html('1. primo\n2. secondo')).toBe(
      '<ol>\n<li>primo</li>\n<li>secondo</li>\n</ol>\n',
    )
  })

  it('converte enfasi e grassetto', () => {
    expect(html('Una *parola* e una **frase**.')).toBe(
      '<p>Una <em>parola</em> e una <strong>frase</strong>.</p>\n',
    )
  })

  it('converte le citazioni', () => {
    expect(html('> I am tired.')).toBe('<blockquote>\n<p>I am tired.</p>\n</blockquote>\n')
  })

  it('converte il codice in linea', () => {
    expect(html('Si scrive `to be`.')).toBe('<p>Si scrive <code>to be</code>.</p>\n')
  })

  it('mostra come testo un tag HTML scritto nel testo', () => {
    const risultato = html('Una <b>parola</b> in grassetto.')
    expect(risultato).not.toContain('<b>')
    expect(risultato).toContain('&lt;b&gt;parola&lt;/b&gt;')
  })

  it('mostra come testo uno <script> scritto nel testo', () => {
    const risultato = html('<script>alert("x")</script>')
    expect(risultato).not.toContain('<script')
    expect(risultato).toContain('&lt;script&gt;')
    expect(risultato).toContain('&lt;/script&gt;')
  })

  it('non trasforma una tabella Markdown in <table>', () => {
    const risultato = html('| io | sono |\n| --- | --- |\n| tu | sei |')
    expect(risultato).not.toContain('<table')
    expect(risultato).toContain('| io | sono |')
  })

  it('restituisce una stringa vuota per il testo vuoto', () => {
    expect(html('')).toBe('')
  })
})

describe('la libreria Markdown', () => {
  function fileSorgente(cartella: string): string[] {
    return readdirSync(cartella).flatMap((nome) => {
      const percorso = join(cartella, nome)
      return statSync(percorso).isDirectory() ? fileSorgente(percorso) : [percorso]
    })
  }

  it('è importata solo da src/grammatica/markdown.ts', () => {
    const importatori = fileSorgente('src')
      .filter((percorso) => /\.(ts|vue)$/.test(percorso))
      .filter((percorso) => /from\s+['"]markdown-it['"]|import\(\s*['"]markdown-it['"]/.test(readFileSync(percorso, 'utf8')))
      .map((percorso) => percorso.split('\\').join('/'))
    expect(importatori).toEqual(['src/grammatica/markdown.ts'])
  })
})
