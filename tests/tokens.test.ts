import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import designTokens from '../design/tokens.json'
import { installTokens, tokensCss } from '../src/styles/tokens'
import App from '../src/App.vue'
import { createAppRouter } from '../src/router'

function declarations(css: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const match of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    map.set(match[1], match[2].trim())
  }
  return map
}

function expectedVariables(): [string, string][] {
  const expected: [string, string][] = []
  for (const token of designTokens.color.tokens) {
    expected.push([`--color-${token.name}`, token.value])
  }
  for (const [name, value] of Object.entries(designTokens.type.families)) {
    expected.push([`--font-${name}`, value])
  }
  for (const group of designTokens.type.groups) {
    for (const style of group.styles) {
      expected.push([`--type-${style.name}-size`, style.fontSize])
      expected.push([`--type-${style.name}-line`, style.lineHeight])
      expected.push([`--type-${style.name}-weight`, String(style.fontWeight)])
    }
  }
  for (const token of designTokens.spacing.tokens) {
    expected.push([`--${token.name}`, token.value])
  }
  for (const token of designTokens.radius.tokens) {
    expected.push([`--${token.name}`, token.value])
  }
  return expected
}

describe('design tokens', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  it('declares every token of design/tokens.json on :root with its value', () => {
    installTokens(document)
    const styles = document.head.querySelectorAll('style')
    expect(styles).toHaveLength(1)
    const css = styles[0].textContent ?? ''
    expect(css.trim().startsWith(':root')).toBe(true)
    const declared = declarations(css)
    const expected = expectedVariables()
    expect(expected.length).toBeGreaterThan(0)
    for (const [variable, value] of expected) {
      expect(declared.get(variable), variable).toBe(value)
    }
    expect(declared.size).toBe(expected.length)
  })

  it('generates the variables from the token data it is given', () => {
    const copy = structuredClone(designTokens)
    copy.color.tokens[0].value = '#123456'
    copy.spacing.tokens.push({ name: 'space-9', value: '40px', usage: '' })
    const declared = declarations(tokensCss(copy))
    expect(declared.get(`--color-${copy.color.tokens[0].name}`)).toBe('#123456')
    expect(declared.get('--space-9')).toBe('40px')
  })

  it('installs the tokens only once', () => {
    installTokens(document)
    installTokens(document)
    expect(document.head.querySelectorAll('style')).toHaveLength(1)
  })
})

const cssFiles = import.meta.glob('../src/**/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>
const vueFiles = import.meta.glob('../src/**/*.vue', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function stylesheets(): [string, string][] {
  const sheets: [string, string][] = Object.entries(cssFiles)
  for (const [path, source] of Object.entries(vueFiles)) {
    for (const match of source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
      sheets.push([path, match[1]])
    }
  }
  return sheets.map(([path, css]) => [path, css.replace(/\/\*[\s\S]*?\*\//g, '')])
}

function propertyValues(css: string): [string, string][] {
  return [...css.matchAll(/(?<=^|[;{\s])([a-z-]+)\s*:\s*([^;{}]+)(?=[;}])/g)].map((m) => [
    m[1],
    m[2].trim(),
  ])
}

function topLevelParts(value: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const char of value) {
    if (char === '(') depth++
    if (char === ')') depth--
    if (/\s/.test(char) && depth === 0) {
      if (current) parts.push(current)
      current = ''
    } else {
      current += char
    }
  }
  if (current) parts.push(current)
  return parts
}

function bareLengths(value: string): string[] {
  const withoutVariables = value.replace(/var\(--[\w-]+\)/g, '')
  return withoutVariables.match(/\d*\.?\d+(px|rem|em|vw|vh|%)/g) ?? []
}

describe('stylesheets', () => {
  it('exist', () => {
    expect(Object.keys(cssFiles).length).toBeGreaterThan(0)
  })

  it('write no colour by hand', () => {
    for (const [path, css] of stylesheets()) {
      expect(css, path).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(css, path).not.toMatch(/\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/)
    }
  })

  it('take fonts, radii and spaces only from the token variables', () => {
    const tokenOnly = /^(font-family|font-size|line-height|border-radius)$/
    const spacing = /^(padding|margin|gap|row-gap|column-gap)(-[a-z-]+)?$|^(left|right)$/
    for (const [path, css] of stylesheets()) {
      for (const [property, value] of propertyValues(css)) {
        expect(property, path).not.toBe('font')
        if (tokenOnly.test(property)) {
          expect(value, `${path}: ${property}`).toMatch(/var\(--|^inherit$/)
          expect(bareLengths(value), `${path}: ${property}`).toEqual([])
        }
        if (property === 'font-weight') {
          expect(value, `${path}: ${property}`).toMatch(/var\(--|^[4-6]00$/)
        }
        if (spacing.test(property)) {
          for (const part of topLevelParts(value)) {
            expect(part, `${path}: ${property}`).toMatch(/var\(--|^0$|^auto$/)
          }
          expect(bareLengths(value), `${path}: ${property}`).toEqual([])
        }
      }
    }
  })

  it('declare the single 768px breakpoint in one place', () => {
    const queries = stylesheets().flatMap(([path, css]) =>
      [...css.matchAll(/@media[^{]*\b(?:min|max)-width[^{]*/g)].map((m) => [path, m[0].trim()]),
    )
    expect(queries).toEqual([[expect.any(String), '@media (min-width: 768px)']])
  })
})

function sheet(name: string): string {
  const entry = stylesheets().find(([path]) => path.endsWith(`/styles/${name}`))
  if (!entry) throw new Error(`missing stylesheet ${name}`)
  return entry[1]
}

function ruleBody(css: string, selector: string): string | undefined {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return css.match(new RegExp(`(?:^|[}\\s])${escaped}\\s*\\{([^}]*)\\}`))?.[1]
}

function pixels(value: string): number {
  const variables = new Map(expectedVariables())
  const expression = value
    .replace(/var\((--[\w-]+)\)/g, (_, name: string) => variables.get(name) ?? 'NaN')
    .replace(/calc/g, '')
    .replace(/px/g, '')
  return Number(new Function(`return (${expression})`)())
}

describe('screen title', () => {
  it('keeps the centred screen-title style on the phone', () => {
    const body = ruleBody(sheet('base.css'), '.titolo-schermata') ?? ''
    const values = new Map(propertyValues(body))
    expect(values.get('text-align')).toBe('center')
    expect(values.get('font-size')).toBe('var(--type-screen-title-size)')
    expect(values.get('line-height')).toBe('var(--type-screen-title-line)')
  })

  it('is 24px on 32px and left-aligned on the computer', () => {
    const computer = sheet('computer.css')
    const media = computer.slice(computer.indexOf('@media (min-width: 768px)'))
    const body = ruleBody(media, '.titolo-schermata')
    expect(body).toBeDefined()
    const values = new Map(propertyValues(body ?? ''))
    expect(values.get('text-align')).toBe('left')
    expect(pixels(values.get('font-size') ?? '')).toBe(24)
    expect(pixels(values.get('line-height') ?? '')).toBe(32)
  })
})

describe('placeholder screens', () => {
  it.each(['/esercizi', '/vocaboli', '/dizionario', '/grammatica'])(
    'stand on the background with the flag and inside a card at %s',
    async (path) => {
      const router = createAppRouter()
      await router.push(path)
      await router.isReady()
      const wrapper = mount(App, { global: { plugins: [router] } })
      await flushPromises()
      const fondo = wrapper.get('.fondo')
      expect(fondo.find('svg.bandiera').exists()).toBe(true)
      expect(fondo.find('main .carta').exists()).toBe(true)
    },
  )
})
