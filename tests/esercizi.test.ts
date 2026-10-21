import { describe, it, expect, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { costruisciCatalogo } from '../src/contenuti/catalogo'
import type { Catalogo } from '../src/contenuti/catalogo'
import type { Lezione } from '../src/contenuti/schema'
import { creaArchivio } from '../src/ripasso/archivio'
import type { ArchivioProgressi } from '../src/ripasso/archivio'
import { creaSessione } from '../src/ripasso/sessione'
import { creaCiclo } from '../src/esercizi/ciclo'
import EserciziView from '../src/views/EserciziView.vue'

const fissa = (valore: number) => () => valore

// La prima frase ha una variante, le altre nessuna.
function lezione(id: string, frasi: number): Lezione {
  return {
    id,
    title: `Lezione ${id}`,
    sentences: Array.from({ length: frasi }, (_, i) => ({
      id: `f${i + 1}`,
      it: `Frase ${i + 1}.`,
      en: `Sentence ${i + 1}.`,
      alternatives: i === 0 ? [`Alternative ${i + 1}.`] : [],
    })),
    vocabulary: [{ id: 'v1', it: 'parola', en: ['word'] }],
    grammar: [],
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

// Con casualità 0 la sessione propone il primo candidato ammesso: f1, poi f2.
// `catalogoTitoli` sostituisce il catalogo da cui il ciclo ricava il titolo della lezione.
function monta(catalogo: Catalogo, catalogoTitoli: Catalogo = catalogo) {
  const archivio: ArchivioProgressi = creaArchivio(null)
  let cicliCreati = 0
  const fabbrica = () => {
    cicliCreati++
    return creaCiclo({
      catalogo: catalogoTitoli,
      creaSessione: (tipo) => creaSessione(tipo, { catalogo, archivio, casualita: fissa(0) }),
    })
  }
  const nuovoMontaggio = () => {
    const wrapper = mount(EserciziView, {
      props: { creaCiclo: fabbrica },
      attachTo: document.body,
    })
    montate.push(wrapper)
    return wrapper
  }
  return { wrapper: nuovoMontaggio(), nuovoMontaggio, archivio, cicliCreati: () => cicliCreati }
}

function bottone(wrapper: VueWrapper, testo: string) {
  const trovato = wrapper.findAll('button').find((b) => b.text() === testo)
  if (!trovato) throw new Error(`Nessun bottone "${testo}"`)
  return trovato
}

async function conferma(wrapper: VueWrapper, testo: string) {
  await wrapper.get('input').setValue(testo)
  await bottone(wrapper, 'Conferma').trigger('click')
  await flushPromises()
}

describe('schermata Esercizi', () => {
  it('mostra la domanda: titolo della lezione, frase, campo e Conferma', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Esercizi')
    const carta = wrapper.get('main .carta')
    expect(carta.text()).toContain('Lezione 01-a')
    expect(carta.text()).toContain('Frase 1.')
    const input = wrapper.get('input')
    const etichetta = wrapper.get('label')
    expect(etichetta.text()).toBe('La tua traduzione')
    expect(etichetta.attributes('for')).toBe(input.attributes('id'))
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(input.attributes('lang')).toBe('en')
    expect(bottone(wrapper, 'Conferma').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Giusta')
    expect(document.activeElement).toBe(input.element)
  })

  it('crea e avvia un ciclo nuovo a ogni montaggio', async () => {
    const { wrapper, nuovoMontaggio, cicliCreati } = monta(catalogoDi(lezione('01-a', 2)))
    expect(cicliCreati()).toBe(1)
    expect(wrapper.text()).toContain('Frase 1.')
    wrapper.unmount()
    montate = montate.filter((w) => w !== wrapper)

    const secondo = nuovoMontaggio()
    expect(cicliCreati()).toBe(2)
    expect(secondo.text()).toContain('Frase 1.')
  })

  it('Conferma mostra la soluzione con le varianti', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'My answer.')

    expect(wrapper.find('input').exists()).toBe(false)
    const carta = wrapper.get('main .carta')
    expect(carta.text()).toContain('Lezione 01-a')
    expect(carta.text()).toContain('Frase 1.')
    expect(carta.text()).toContain('La tua risposta')
    expect(carta.text()).toContain('My answer.')
    expect(carta.text()).toContain('Corretta')
    expect(carta.text()).toContain('Sentence 1.')
    expect(carta.text()).toContain('Va bene anche')
    expect(carta.text()).toContain('Alternative 1.')
    expect(bottone(wrapper, 'Giusta').exists()).toBe(true)
    expect(bottone(wrapper, 'Sbagliata').exists()).toBe(true)
    expect(wrapper.findAll('button').map((b) => b.text())).not.toContain('Conferma')
  })

  it('Invio nel campo conferma come il pulsante', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    const input = wrapper.get('input')
    await input.setValue('Typed answer.')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.text()).toContain('Typed answer.')
    expect(wrapper.text()).toContain('Sentence 1.')
  })

  it('con il campo vuoto conferma comunque e mostra la soluzione', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, '')

    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.text()).toContain('La tua risposta')
    expect(wrapper.text()).toContain('Sentence 1.')
    expect(bottone(wrapper, 'Giusta').exists()).toBe(true)
  })

  it('senza varianti la soluzione non mostra "Va bene anche"', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'x')
    await bottone(wrapper, 'Giusta').trigger('click')
    await flushPromises()
    await conferma(wrapper, 'Sentence 2.')

    expect(wrapper.text()).toContain('Sentence 2.')
    expect(wrapper.text()).toContain('Corretta')
    expect(wrapper.text()).not.toContain('Va bene anche')
  })

  it('senza la lezione della frase la soluzione omette il titolo', async () => {
    const catalogo = catalogoDi(lezione('01-a', 2))
    const senzaLezioni: Catalogo = { ...catalogo, lezione: () => undefined }
    const { wrapper } = monta(catalogo, senzaLezioni)
    await conferma(wrapper, 'x')

    expect(wrapper.text()).not.toContain('Lezione 01-a')
    expect(wrapper.text()).toContain('Frase 1.')
    expect(wrapper.text()).toContain('Sentence 1.')
    expect(bottone(wrapper, 'Giusta').exists()).toBe(true)
  })

  it.each([
    ['Giusta', 'consolidato'],
    ['Sbagliata', 'da-ripassare'],
  ])(
    '%s registra l’esito e porta alla frase successiva con il campo vuoto e a fuoco',
    async (testo, livello) => {
      const { wrapper, archivio } = monta(catalogoDi(lezione('01-a', 2)))
      await conferma(wrapper, 'Something.')
      await bottone(wrapper, testo).trigger('click')
      await flushPromises()

      expect(archivio.leggiLivello('01-a/f1')).toBe(livello)
      expect(wrapper.text()).toContain('Frase 2.')
      expect(wrapper.text()).not.toContain('Frase 1.')
      const input = wrapper.get('input')
      expect((input.element as HTMLInputElement).value).toBe('')
      expect(document.activeElement).toBe(input.element)
      expect(bottone(wrapper, 'Conferma').exists()).toBe(true)
    },
  )

  it('senza frasi mostra il messaggio di nessun materiale', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 0)))
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Esercizi')
    expect(wrapper.get('h2').text()).toBe('Ancora nessuna frase da tradurre')
    expect(wrapper.text()).toContain(
      'Le frasi compaiono qui quando arriva il materiale di una lezione.',
    )
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('senza alcuna lezione mostra il messaggio di nessun materiale', async () => {
    const { wrapper } = monta(catalogoDi())
    await flushPromises()
    expect(wrapper.text()).toContain('Ancora nessuna frase da tradurre')
  })
})
