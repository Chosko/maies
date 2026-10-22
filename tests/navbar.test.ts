import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../src/App.vue'
import NavBar from '../src/components/NavBar.vue'
import { createAppRouter } from '../src/router'

const voci = [
  ['Esercizi', '/esercizi'],
  ['Vocaboli', '/vocaboli'],
  ['Dizionario', '/dizionario'],
  ['Grammatica', '/grammatica'],
]

async function mountAppAt(path: string) {
  const router = createAppRouter()
  router.addRoute({ path: '/grammatica/prova', component: { render: () => null } })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(App, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return { router, wrapper }
}

function linkVoci(wrapper: Awaited<ReturnType<typeof mountAppAt>>['wrapper']) {
  return wrapper.findAll('nav[aria-label="Sezioni"] a')
}

describe('navigation bar', () => {
  it('lists the four screens in order, each with its icon, name and address', async () => {
    const { wrapper } = await mountAppAt('/esercizi')
    const links = linkVoci(wrapper)
    expect(links.map((link) => link.text())).toEqual(voci.map(([nome]) => nome))
    links.forEach((link, i) => {
      expect(link.attributes('href')).toBe(`#${voci[i][1]}`)
      const icona = link.get('svg')
      expect(icona.attributes('aria-hidden')).toBe('true')
      expect(icona.attributes('stroke')).toBe('currentColor')
      expect(icona.attributes('stroke-width')).toBe('1.8')
    })
    wrapper.unmount()
  })

  it.each(voci)('highlights %s when its screen is shown', async (nome, path) => {
    const { wrapper } = await mountAppAt(path)
    const correnti = wrapper.findAll('nav[aria-label="Sezioni"] a[aria-current="page"]')
    expect(correnti).toHaveLength(1)
    expect(correnti[0].text()).toBe(nome)
    expect(correnti[0].classes()).toContain('voce-corrente')
    expect(wrapper.findAll('.voce-corrente')).toHaveLength(1)
    wrapper.unmount()
  })

  it('keeps the item highlighted on a sub-route of its screen', async () => {
    const { wrapper } = await mountAppAt('/grammatica/prova')
    const corrente = wrapper.get('nav[aria-label="Sezioni"] a[aria-current="page"]')
    expect(corrente.text()).toBe('Grammatica')
    wrapper.unmount()
  })

  it('moves to another screen when an item is clicked', async () => {
    const { router, wrapper } = await mountAppAt('/esercizi')
    await wrapper.get('a[href="#/dizionario"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/dizionario')
    expect(wrapper.get('h1').text()).toBe('Dizionario')
    expect(wrapper.get('a[aria-current="page"]').text()).toBe('Dizionario')
    wrapper.unmount()
  })

  it('nella versione kids mostra solo Vocaboli e Dizionario', async () => {
    const router = createAppRouter('kids')
    await router.push('/vocaboli')
    await router.isReady()
    const wrapper = mount(NavBar, { global: { plugins: [router] } })
    const links = wrapper.findAll('nav[aria-label="Sezioni"] a')
    expect(links.map((link) => link.text())).toEqual(['Vocaboli', 'Dizionario'])
    expect(links.map((link) => link.attributes('href'))).toEqual(['#/vocaboli', '#/dizionario'])
    expect(wrapper.get('a[aria-current="page"]').text()).toBe('Vocaboli')
  })

  it('shows the name maies beside the items', async () => {
    const router = createAppRouter()
    await router.push('/esercizi')
    await router.isReady()
    const wrapper = mount(NavBar, { global: { plugins: [router] } })
    expect(wrapper.get('.barra-nome').text()).toBe('maies')
  })
})

describe('application shell', () => {
  it('holds the navigation bar and the screen on the background with the dotted flag', async () => {
    const { wrapper } = await mountAppAt('/vocaboli')
    const fondo = wrapper.get('.fondo')
    expect(fondo.get('svg.bandiera').attributes('aria-hidden')).toBe('true')
    expect(fondo.find('nav[aria-label="Sezioni"]').exists()).toBe(true)
    expect(fondo.get('main').text()).toContain('Vocaboli')
    expect(wrapper.findAll('.fondo')).toHaveLength(1)
    wrapper.unmount()
  })
})
