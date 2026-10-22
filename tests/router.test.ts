import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../src/App.vue'
import { createAppRouter } from '../src/router'

async function mountAt(path: string) {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  const router = createAppRouter()
  await router.push(path)
  await router.isReady()
  const wrapper = mount(App, { global: { plugins: [router] } })
  await flushPromises()
  return { router, wrapper }
}

describe('router', () => {
  it('redirects / to /esercizi', async () => {
    const { router } = await mountAt('/')
    expect(router.currentRoute.value.path).toBe('/esercizi')
  })

  it('redirects an unknown address to /esercizi', async () => {
    const { router } = await mountAt('/indirizzo-inesistente')
    expect(router.currentRoute.value.path).toBe('/esercizi')
  })

  it('renders the exercises screen at /esercizi', async () => {
    const { router, wrapper } = await mountAt('/esercizi')
    expect(router.currentRoute.value.path).toBe('/esercizi')
    expect(wrapper.get('h1').text()).toBe('Esercizi')
    expect(wrapper.find('main .carta').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('in arrivo')
  })

  it('renders the vocabulary screen at /vocaboli', async () => {
    const { router, wrapper } = await mountAt('/vocaboli')
    expect(router.currentRoute.value.path).toBe('/vocaboli')
    expect(wrapper.get('h1').text()).toBe('Vocaboli')
    expect(wrapper.find('main .carta').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('in arrivo')
  })

  it('renders the dictionary screen at /dizionario', async () => {
    const { router, wrapper } = await mountAt('/dizionario')
    expect(router.currentRoute.value.path).toBe('/dizionario')
    expect(wrapper.get('h1').text()).toBe('Dizionario')
    expect(wrapper.find('main .carta').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('in arrivo')
  })

  it('renders the grammar screen at /grammatica', async () => {
    const { router, wrapper } = await mountAt('/grammatica')
    expect(router.currentRoute.value.path).toBe('/grammatica')
    expect(wrapper.get('h1').text()).toBe('Grammatica')
    expect(wrapper.find('main .carta').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('in arrivo')
  })

  it('renders the lesson page at /grammatica/<id>', async () => {
    const { router, wrapper } = await mountAt('/grammatica/01-lezione')
    expect(router.currentRoute.value.path).toBe('/grammatica/01-lezione')
    expect(wrapper.find('a[aria-label="Torna all’elenco della grammatica"]').exists()).toBe(true)
    expect(wrapper.find('main .carta').exists()).toBe(true)
    expect(wrapper.get('a.voce-corrente').text()).toBe('Grammatica')
  })

  it('uses hash history', () => {
    const router = createAppRouter()
    expect(router.options.history.base).toContain('#')
  })
})

describe('router della versione kids', () => {
  async function vaiA(path: string) {
    const router = createAppRouter('kids')
    await router.push(path)
    await router.isReady()
    return router
  }

  it('ha solo le rotte di Vocaboli e Dizionario', () => {
    const router = createAppRouter('kids')
    expect(router.hasRoute('vocaboli')).toBe(true)
    expect(router.hasRoute('dizionario')).toBe(true)
    expect(router.hasRoute('esercizi')).toBe(false)
    expect(router.hasRoute('grammatica')).toBe(false)
    expect(router.hasRoute('grammatica-lezione')).toBe(false)
  })

  it.each(['/', '/esercizi', '/grammatica', '/grammatica/01-lezione', '/indirizzo-inesistente'])(
    'porta %s a /vocaboli',
    async (path) => {
      const router = await vaiA(path)
      expect(router.currentRoute.value.path).toBe('/vocaboli')
    },
  )

  it('apre il dizionario a /dizionario', async () => {
    const router = await vaiA('/dizionario')
    expect(router.currentRoute.value.path).toBe('/dizionario')
  })
})
