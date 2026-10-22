// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import type { UserConfig } from 'vite'
import configurazione from '../vite.config'

const radice = fileURLToPath(new URL('..', import.meta.url))

function risolvi(mode: string): UserConfig {
  if (typeof configurazione !== 'function') throw new Error('vite.config deve dipendere dalla modalità')
  return configurazione({ mode, command: 'build', isSsrBuild: false, isPreview: false }) as UserConfig
}

function aliasLezioni(config: UserConfig): string | undefined {
  const alias = config.resolve?.alias as Record<string, string> | undefined
  return alias?.['@lezioni']
}

describe('configurazione di Vite', () => {
  it('la build principale sta alla radice e legge contenuti/lezioni', () => {
    const config = risolvi('production')
    expect(config.base).toBe('/')
    expect(config.build?.outDir ?? 'dist').toBe('dist')
    expect(aliasLezioni(config)).toBe(`${radice}contenuti/lezioni`)
  })

  it('la build kids sta sotto /kids/, esce in dist/kids e legge contenuti/kids', () => {
    const config = risolvi('kids')
    expect(config.base).toBe('/kids/')
    expect(config.build?.outDir).toBe('dist/kids')
    expect(aliasLezioni(config)).toBe(`${radice}contenuti/kids`)
  })

  it('npm run build compila tutte e due le versioni', () => {
    const pacchetto = JSON.parse(readFileSync(`${radice}package.json`, 'utf8'))
    expect(pacchetto.scripts.build).toBe('vite build && vite build --mode kids')
  })
})
