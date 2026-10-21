import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../src/App.vue'
import { createAppRouter } from '../src/router'

async function mountAt(path: string) {
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

  it.each([
    ['/vocaboli', 'Allenamento vocaboli'],
    ['/dizionario', 'Dizionario dei vocaboli'],
  ])('renders the screen at %s with its title', async (path, title) => {
    const { router, wrapper } = await mountAt(path)
    expect(router.currentRoute.value.path).toBe(path)
    expect(wrapper.get('h1').text()).toBe(title)
    expect(wrapper.text()).toContain('in arrivo')
  })

  it('renders the grammar screen at /grammatica', async () => {
    const { router, wrapper } = await mountAt('/grammatica')
    expect(router.currentRoute.value.path).toBe('/grammatica')
    expect(wrapper.get('h1').text()).toBe('Grammatica')
    expect(wrapper.find('main .carta').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('in arrivo')
  })

  it('uses hash history', () => {
    const router = createAppRouter()
    expect(router.options.history.base).toContain('#')
  })
})
