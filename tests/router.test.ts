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

  it('uses hash history', () => {
    const router = createAppRouter()
    expect(router.options.history.base).toContain('#')
  })
})
