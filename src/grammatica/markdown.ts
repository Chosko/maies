import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt('commonmark', { html: false })

export function html(body: string): string {
  return markdown.render(body)
}
