import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { costruisciCatalogo } from '../src/contenuti/catalogo'
import type { Catalogo } from '../src/contenuti/catalogo'
import type { Lezione } from '../src/contenuti/schema'
import GrammaticaView from '../src/views/GrammaticaView.vue'

// `schede` sono i titoli delle schede, nell'ordine in cui compaiono nel file.
function lezione(id: string, title: string, schede: { id: string; title: string }[]): Lezione {
  return {
    id,
    title,
    sentences: [{ id: 'f1', it: `Frase di ${id}.`, en: `Sentence of ${id}.`, alternatives: [] }],
    vocabulary: [],
    grammar: schede.map((scheda) => ({ ...scheda, body: `Testo di ${scheda.title}.` })),
  }
}

function catalogoDi(...lezioni: Lezione[]): Catalogo {
  return costruisciCatalogo(
    Object.fromEntries(lezioni.map((l) => [`../../contenuti/lezioni/${l.id}.json`, l])),
  )
}

let montate: VueWrapper[] = []

afterEach(() => {
  for (const wrapper of montate) wrapper.unmount()
  montate = []
})

function monta(catalogo: Catalogo) {
  const wrapper = mount(GrammaticaView, { props: { catalogo } })
  montate.push(wrapper)
  return wrapper
}

function voci(wrapper: VueWrapper) {
  return wrapper.findAll('a.grammatica-voce')
}

const presentarsi = lezione('01-presentarsi', 'Presentarsi', [
  { id: 'g2', title: 'Pronomi personali soggetto' },
  { id: 'g1', title: 'Verbo to be' },
])
const senzaSchede = lezione('02-numeri', 'I numeri', [])
const routine = lezione('03-routine', 'La routine quotidiana', [
  { id: 'g1', title: 'Present simple' },
  { id: 'g2', title: 'Avverbi di frequenza' },
])

describe('schermata Grammatica', () => {
  it('mostra il titolo della schermata', () => {
    const wrapper = monta(catalogoDi(presentarsi))
    expect(wrapper.get('h1').text()).toBe('Grammatica')
  })

  it('elenca le lezioni con schede nell’ordine di arrivo', () => {
    const wrapper = monta(catalogoDi(routine, presentarsi))
    expect(voci(wrapper).map((v) => v.get('.grammatica-voce-titolo').text())).toEqual([
      'Presentarsi',
      'La routine quotidiana',
    ])
  })

  it('mostra sotto ogni lezione i titoli delle sue schede, in ordine di id', () => {
    const wrapper = monta(catalogoDi(presentarsi, routine))
    const schede = voci(wrapper).map((v) =>
      v.findAll('.grammatica-voce-scheda').map((s) => s.text()),
    )
    expect(schede).toEqual([
      ['Verbo to be', 'Pronomi personali soggetto'],
      ['Present simple', 'Avverbi di frequenza'],
    ])
  })

  it('non mostra una lezione senza schede', () => {
    const wrapper = monta(catalogoDi(presentarsi, senzaSchede, routine))
    expect(voci(wrapper)).toHaveLength(2)
    expect(wrapper.text()).not.toContain('I numeri')
  })

  it('fa di ogni lezione un collegamento alla sua pagina', () => {
    const wrapper = monta(catalogoDi(presentarsi, routine))
    expect(voci(wrapper).map((v) => v.attributes('href'))).toEqual([
      '#/grammatica/01-presentarsi',
      '#/grammatica/03-routine',
    ])
    expect(wrapper.get('a.grammatica-voce').classes()).toContain('carta')
  })

  it('non mostra il messaggio senza schede quando ci sono lezioni', () => {
    const wrapper = monta(catalogoDi(presentarsi))
    expect(wrapper.find('.grammatica-vuota').exists()).toBe(false)
  })

  it.each([
    ['nessuna lezione', catalogoDi()],
    ['solo lezioni senza schede', catalogoDi(senzaSchede)],
  ])('con %s mostra il messaggio che non ci sono ancora schede', (_caso, catalogo) => {
    const wrapper = monta(catalogo)
    expect(voci(wrapper)).toHaveLength(0)
    const vuota = wrapper.get('.grammatica-vuota .carta')
    expect(vuota.get('h2').text()).toBe('Ancora nessuna scheda di grammatica')
    expect(vuota.text()).toContain('Le schede compaiono qui')
    expect(wrapper.text()).not.toContain('in arrivo')
  })
})
