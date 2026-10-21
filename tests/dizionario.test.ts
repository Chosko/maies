import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { costruisciCatalogo } from '../src/contenuti/catalogo'
import type { Catalogo } from '../src/contenuti/catalogo'
import type { Lezione, Vocabolo } from '../src/contenuti/schema'
import DizionarioView from '../src/views/DizionarioView.vue'

function lezione(id: string, vocabulary: Vocabolo[]): Lezione {
  return { id, title: `Lezione ${id}`, sentences: [], vocabulary, grammar: [] }
}

function catalogoDi(...lezioni: Lezione[]): Catalogo {
  return costruisciCatalogo(
    Object.fromEntries(lezioni.map((l) => [`../../contenuti/lezioni/${l.id}.json`, l])),
  )
}

// Vocaboli fuori ordine, divisi fra due lezioni.
const catalogoFinto = catalogoDi(
  lezione('2026-09-01', [
    { id: 'v1', it: 'viaggio', en: ['trip', 'journey'] },
    { id: 'v2', it: 'amico', en: ['friend'] },
  ]),
  lezione('2026-09-08', [
    { id: 'v1', it: 'perché', en: ['why', 'because'] },
    { id: 'v2', it: 'biblioteca', en: ['library'] },
  ]),
)

let montate: VueWrapper[] = []

afterEach(() => {
  for (const wrapper of montate) wrapper.unmount()
  montate = []
})

function monta(catalogo: Catalogo = catalogoFinto) {
  const wrapper = mount(DizionarioView, { props: { catalogo }, attachTo: document.body })
  montate.push(wrapper)
  return wrapper
}

const parole = (wrapper: VueWrapper) =>
  wrapper.findAll('.dizionario-voce-it').map((parola) => parola.text())

describe('schermata Dizionario', () => {
  it('mostra tutti i vocaboli in ordine alfabetico della parola italiana', () => {
    const wrapper = monta()
    expect(wrapper.get('h1').text()).toBe('Dizionario')
    expect(parole(wrapper)).toEqual(['amico', 'biblioteca', 'perché', 'viaggio'])
  })

  it('mostra la traduzione principale e, solo se ci sono, le altre traduzioni', () => {
    const wrapper = monta()
    const voci = wrapper.findAll('.dizionario-voce')
    const amico = voci[0]!
    expect(amico.get('.dizionario-voce-principale').text()).toBe('friend')
    expect(amico.find('.dizionario-voce-altre').exists()).toBe(false)
    const viaggio = voci[3]!
    expect(viaggio.get('.dizionario-voce-principale').text()).toBe('trip')
    expect(viaggio.get('.dizionario-voce-altre').text()).toBe(', journey')
    expect(viaggio.get('.dizionario-voce-en').text()).toBe('trip, journey')
  })

  it('mette la lista in una carta, sotto il campo di ricerca', () => {
    const wrapper = monta()
    const lista = wrapper.get('section.carta.dizionario-lista')
    expect(lista.findAll('.dizionario-voce')).toHaveLength(4)
    const campo = wrapper.get('input').element
    expect(campo.compareDocumentPosition(lista.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('ha un campo di ricerca senza correzioni né maiuscole automatiche', () => {
    const campo = monta().get('input')
    expect(campo.attributes('type')).toBe('search')
    expect(campo.attributes('placeholder')).toBe('Cerca in italiano o in inglese')
    expect(campo.attributes('autocomplete')).toBe('off')
    expect(campo.attributes('autocorrect')).toBe('off')
    expect(campo.attributes('autocapitalize')).toBe('off')
    expect(campo.attributes('spellcheck')).toBe('false')
    expect(monta().find('button').exists()).toBe(false)
  })

  it('filtra a ogni carattere scritto', async () => {
    const wrapper = monta()
    const campo = wrapper.get('input')
    await campo.setValue('p')
    expect(parole(wrapper)).toEqual(['perché', 'viaggio'])
    await campo.setValue('pe')
    expect(parole(wrapper)).toEqual(['perché'])
    await campo.setValue('a')
    expect(parole(wrapper)).toEqual(['amico', 'biblioteca', 'perché', 'viaggio'])
    await campo.setValue('am')
    expect(parole(wrapper)).toEqual(['amico'])
  })

  it('filtra anche sulle traduzioni inglesi, comprese le altre', async () => {
    const wrapper = monta()
    const campo = wrapper.get('input')
    await campo.setValue('journ')
    expect(parole(wrapper)).toEqual(['viaggio'])
    await campo.setValue('because')
    expect(parole(wrapper)).toEqual(['perché'])
  })

  it('senza risultati mostra il messaggio sotto il campo, ancora modificabile', async () => {
    const wrapper = monta()
    const campo = wrapper.get('input')
    await campo.setValue('biscotto')
    expect(wrapper.findAll('.dizionario-voce')).toHaveLength(0)
    const messaggio = wrapper.get('.dizionario-nessun-risultato')
    expect(messaggio.text()).toContain('Nessun vocabolo contiene “biscotto”')
    expect(messaggio.text()).toContain('Controlla come l’hai scritto.')
    expect(
      campo.element.compareDocumentPosition(messaggio.element) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(campo.attributes('disabled')).toBeUndefined()
    expect(campo.attributes('readonly')).toBeUndefined()
    await campo.setValue('amic')
    expect(parole(wrapper)).toEqual(['amico'])
    expect(wrapper.find('.dizionario-nessun-risultato').exists()).toBe(false)
  })

  it('svuotando il campo torna tutta la lista', async () => {
    const wrapper = monta()
    const campo = wrapper.get('input')
    await campo.setValue('viag')
    expect(parole(wrapper)).toEqual(['viaggio'])
    await campo.setValue('')
    expect(parole(wrapper)).toEqual(['amico', 'biblioteca', 'perché', 'viaggio'])
  })

  it('a ogni montaggio riparte con il campo vuoto', async () => {
    const prima = monta()
    await prima.get('input').setValue('viag')
    prima.unmount()
    montate = montate.filter((wrapper) => wrapper !== prima)
    const dopo = monta()
    expect((dopo.get('input').element as HTMLInputElement).value).toBe('')
    expect(parole(dopo)).toHaveLength(4)
  })

  it('senza vocaboli mostra il messaggio di nessun materiale, senza campo né lista', () => {
    const wrapper = monta(
      catalogoDi({
        id: '2026-09-01',
        title: 'Solo frasi',
        sentences: [{ id: 'f1', it: 'Ciao.', en: 'Hello.', alternatives: [] }],
        vocabulary: [],
        grammar: [],
      }),
    )
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.find('.dizionario-lista').exists()).toBe(false)
    const vuoto = wrapper.get('.carta')
    expect(vuoto.get('h2').text()).toBe('Ancora nessun vocabolo')
  })

  it('senza alcuna lezione mostra il messaggio di nessun materiale', () => {
    const wrapper = monta(catalogoDi())
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.get('.carta h2').text()).toBe('Ancora nessun vocabolo')
  })
})
