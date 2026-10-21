import designTokens from '../../design/tokens.json'

interface NamedValue {
  name: string
  value: string
}

interface TypeStyle {
  name: string
  fontSize: string
  lineHeight: string
  fontWeight: number | string
}

export interface DesignTokens {
  color: { tokens: NamedValue[] }
  type: { families: Record<string, string>; groups: { styles: TypeStyle[] }[] }
  spacing: { tokens: NamedValue[] }
  radius: { tokens: NamedValue[] }
}

export function tokenVariables(tokens: DesignTokens): [string, string][] {
  const variables: [string, string][] = []
  for (const { name, value } of tokens.color.tokens) {
    variables.push([`--color-${name}`, value])
  }
  for (const [name, value] of Object.entries(tokens.type.families)) {
    variables.push([`--font-${name}`, value])
  }
  for (const group of tokens.type.groups) {
    for (const style of group.styles) {
      variables.push([`--type-${style.name}-size`, style.fontSize])
      variables.push([`--type-${style.name}-line`, style.lineHeight])
      variables.push([`--type-${style.name}-weight`, String(style.fontWeight)])
    }
  }
  for (const { name, value } of [...tokens.spacing.tokens, ...tokens.radius.tokens]) {
    variables.push([`--${name}`, value])
  }
  return variables
}

export function tokensCss(tokens: DesignTokens = designTokens): string {
  const lines = tokenVariables(tokens).map(([variable, value]) => `  ${variable}: ${value};`)
  return `:root {\n${lines.join('\n')}\n}\n`
}

const STYLE_ID = 'design-tokens'

export function installTokens(doc: Document = document): void {
  if (doc.getElementById(STYLE_ID)) return
  const style = doc.createElement('style')
  style.id = STYLE_ID
  style.textContent = tokensCss()
  doc.head.prepend(style)
}
