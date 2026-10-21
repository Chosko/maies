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

  it.each([
    ['/esercizi', 'Esercizi di traduzione'],
    ['/vocaboli', 'Allenamento vocaboli'],
    ['/dizionario', 'Dizionario dei vocaboli'],
    ['/grammatica', 'Schede di grammatica'],
  ])('renders the screen at %s with its title', async (path, title) => {
    const { router, wrapper } = await mountAt(path)
    expect(router.currentRoute.value.path).toBe(path)
    expect(wrapper.get('h1').text()).toBe(title)
    expect(wrapper.text()).toContain('in arrivo')
  })

  it('uses hash history', () => {
    const router = createAppRouter()
    expect(router.options.history.base).toContain('#')
  })
})
