import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createRouter, createWebHashHistory, RouterView } from 'vue-router'
import { costruisciCatalogo } from '../src/contenuti/catalogo'
import type { Catalogo } from '../src/contenuti/catalogo'
import type { Lezione } from '../src/contenuti/schema'
import { html } from '../src/grammatica/markdown'
import GrammaticaView from '../src/views/GrammaticaView.vue'
import GrammaticaLezioneView from '../src/views/GrammaticaLezioneView.vue'

// `schede` nell'ordine in cui compaiono nel file.
function lezione(
  id: string,
  title: string,
  schede: { id: string; title: string; body: string }[],
): Lezione {
  return {
    id,
    title,
    sentences: [{ id: 'f1', it: `Frase di ${id}.`, en: `Sentence of ${id}.`, alternatives: [] }],
    vocabulary: [],
    grammar: schede,
  }
}

function catalogoDi(...lezioni: Lezione[]): Catalogo {
  return costruisciCatalogo(
    Object.fromEntries(lezioni.map((l) => [`../../contenuti/lezioni/${l.id}.json`, l])),
  )
}

const presentarsi = lezione('01-presentarsi', 'Presentarsi', [
  { id: 'g2', title: 'Pronomi personali soggetto', body: 'I, *you*, he, she.' },
  {
    id: 'g1',
    title: 'Verbo to be',
    body: 'Si usa **sempre**.\n\n## Negativa\n\n- I am not\n- She is not',
  },
])
const senzaSchede = lezione('02-numeri', 'I numeri', [])
const routine = lezione('03-routine', 'La routine quotidiana', [
  { id: 'g1', title: 'Present simple', body: 'Abitudini e fatti.' },
])

let montate: VueWrapper[] = []
let scrollTo: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

afterEach(() => {
  for (const wrapper of montate) wrapper.unmount()
  montate = []
  vi.restoreAllMocks()
})

async function montaA(path: string, catalogo: Catalogo) {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/grammatica', component: GrammaticaView, props: { catalogo } },
      { path: '/grammatica/:id', component: GrammaticaLezioneView, props: { catalogo } },
    ],
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(RouterView, { global: { plugins: [router] }, attachTo: document.body })
  montate.push(wrapper)
  await flushPromises()
  return { router, wrapper }
}

function schede(wrapper: VueWrapper) {
  return wrapper.findAll('article.scheda')
}

describe('pagina della lezione di grammatica', () => {
  it('mostra il titolo della lezione', async () => {
    const { wrapper } = await montaA('/grammatica/01-presentarsi', catalogoDi(presentarsi))
    expect(wrapper.get('h1').text()).toBe('Presentarsi')
  })

  it('mostra le schede in ordine di id, ognuna con il titolo e il testo convertito', async () => {
    const { wrapper } = await montaA('/grammatica/01-presentarsi', catalogoDi(presentarsi))
    const articoli = schede(wrapper)
    expect(articoli.map((a) => a.get('h2').text())).toEqual([
      'Verbo to be',
      'Pronomi personali soggetto',
    ])
    expect(articoli.map((a) => a.classes())).toEqual([
      expect.arrayContaining(['carta']),
      expect.arrayContaining(['carta']),
    ])
    expect(articoli[0].get('.scheda-testo').element.innerHTML).toBe(
      html(presentarsi.grammar[1].body),
    )
    expect(articoli[0].find('.scheda-testo strong').text()).toBe('sempre')
    expect(articoli[0].findAll('.scheda-testo li').map((li) => li.text())).toEqual([
      'I am not',
      'She is not',
    ])
    expect(articoli[1].find('.scheda-testo em').text()).toBe('you')
  })

  it('ha in cima il collegamento all’elenco della grammatica', async () => {
    const { wrapper } = await montaA('/grammatica/01-presentarsi', catalogoDi(presentarsi))
    const indietro = wrapper.get('a[aria-label="Torna all’elenco della grammatica"]')
    expect(indietro.attributes('href')).toBe('#/grammatica')
    expect(indietro.classes()).toContain('cerchio-icona')
  })

  it('cambia contenuto se cambia l’id nell’indirizzo', async () => {
    const { router, wrapper } = await montaA(
      '/grammatica/01-presentarsi',
      catalogoDi(presentarsi, routine),
    )
    await router.push('/grammatica/03-routine')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('La routine quotidiana')
    expect(schede(wrapper).map((a) => a.get('h2').text())).toEqual(['Present simple'])
  })

  it('parte dall’inizio all’ingresso e a ogni cambio di lezione', async () => {
    const { router } = await montaA('/grammatica/01-presentarsi', catalogoDi(presentarsi, routine))
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0)
    await router.push('/grammatica/03-routine')
    await flushPromises()
    expect(scrollTo).toHaveBeenCalledTimes(2)
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0)
  })

  it('con un id sconosciuto dice che la lezione non esiste', async () => {
    const { wrapper } = await montaA('/grammatica/99-inesistente', catalogoDi(presentarsi))
    expect(schede(wrapper)).toHaveLength(0)
    const vuota = wrapper.get('.esercizio-vuoto .carta')
    expect(vuota.get('h2').text()).toBe('Questa lezione non esiste')
    expect(wrapper.find('a[aria-label="Torna all’elenco della grammatica"]').exists()).toBe(true)
  })

  it('con una lezione senza schede mostra il titolo e dice che non ha schede', async () => {
    const { wrapper } = await montaA('/grammatica/02-numeri', catalogoDi(senzaSchede))
    expect(wrapper.get('h1').text()).toBe('I numeri')
    expect(schede(wrapper)).toHaveLength(0)
    const vuota = wrapper.get('.esercizio-vuoto .carta')
    expect(vuota.get('h2').text()).toBe('Questa lezione non ha schede')
    expect(wrapper.find('a[aria-label="Torna all’elenco della grammatica"]').exists()).toBe(true)
  })

  it('si apre dall’elenco toccando una lezione', async () => {
    const { router, wrapper } = await montaA('/grammatica', catalogoDi(presentarsi, routine))
    const voce = wrapper.findAll('a.grammatica-voce')[1]
    expect(voce.attributes('href')).toBe('#/grammatica/03-routine')
    await voce.trigger('click')
    // Il browser naviga sull'indirizzo dopo il tocco, e il router lo segue.
    await vi.waitFor(() =>
      expect(router.currentRoute.value.path).toBe('/grammatica/03-routine'),
    )
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('La routine quotidiana')
    expect(schede(wrapper)).toHaveLength(1)
  })
})
