// @vitest-environment node
/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const radice = fileURLToPath(new URL('..', import.meta.url))

describe("icona dell'app", () => {
  it('i file dell’icona stanno in public/', () => {
    expect(existsSync(`${radice}public/maies-icona.svg`)).toBe(true)
    expect(existsSync(`${radice}public/maies-icona-512.png`)).toBe(true)
  })

  it('index.html la dichiara come favicon e icona della schermata home', () => {
    const html = readFileSync(`${radice}index.html`, 'utf8')
    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/maies-icona.svg" />')
    expect(html).toContain('<link rel="apple-touch-icon" href="/maies-icona-512.png" />')
  })
})
