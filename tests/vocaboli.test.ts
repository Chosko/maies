import { describe, it, expect, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { costruisciCatalogo } from '../src/contenuti/catalogo'
import type { Catalogo } from '../src/contenuti/catalogo'
import type { Lezione } from '../src/contenuti/schema'
import { creaArchivio } from '../src/ripasso/archivio'
import type { ArchivioProgressi } from '../src/ripasso/archivio'
import { creaSessione } from '../src/ripasso/sessione'
import { creaCiclo } from '../src/vocaboli/ciclo'
import VocaboliView from '../src/views/VocaboliView.vue'

const fissa = (valore: number) => () => valore

// Il primo vocabolo ha due traduzioni, gli altri una sola.
function lezione(id: string, vocaboli: number): Lezione {
  return {
    id,
    title: `Lezione ${id}`,
    sentences: [{ id: 'f1', it: 'Frase.', en: 'Sentence.', alternatives: [] }],
    vocabulary: Array.from({ length: vocaboli }, (_, i) => ({
      id: `v${i + 1}`,
      it: `parola ${i + 1}`,
      en: i === 0 ? [`word ${i + 1}`, `term ${i + 1}`] : [`word ${i + 1}`],
    })),
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

// Con casualità 0 la sessione propone il primo candidato ammesso: v1, poi v2.
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
    const wrapper = mount(VocaboliView, {
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

function testi(wrapper: VueWrapper, selettore: string) {
  return wrapper.findAll(selettore).map((e) => e.text())
}

describe('schermata Vocaboli', () => {
  it('mostra la domanda: titolo della lezione, parola, campo e Conferma', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Vocaboli')
    const carta = wrapper.get('main .carta')
    expect(carta.text()).toContain('Lezione 01-a')
    expect(carta.text()).toContain('parola 1')
    const input = wrapper.get('input')
    const etichetta = wrapper.get('label')
    expect(etichetta.text()).toBe('Traduzione inglese')
    expect(etichetta.attributes('for')).toBe(input.attributes('id'))
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(input.attributes('lang')).toBe('en')
    expect(input.attributes('autocomplete')).toBe('off')
    expect(input.attributes('autocorrect')).toBe('off')
    expect(input.attributes('autocapitalize')).toBe('off')
    expect(input.attributes('spellcheck')).toBe('false')
    expect(bottone(wrapper, 'Conferma').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Giusta')
    expect(wrapper.text()).not.toContain('Avanti')
    expect(document.activeElement).toBe(input.element)
  })

  it('crea e avvia un ciclo nuovo a ogni montaggio', async () => {
    const { wrapper, nuovoMontaggio, cicliCreati } = monta(catalogoDi(lezione('01-a', 2)))
    expect(cicliCreati()).toBe(1)
    expect(wrapper.text()).toContain('parola 1')
    wrapper.unmount()
    montate = montate.filter((w) => w !== wrapper)

    const secondo = nuovoMontaggio()
    expect(cicliCreati()).toBe(2)
    expect(secondo.text()).toContain('parola 1')
  })

  it('una risposta giusta mostra l’esito con le altre traduzioni', async () => {
    const { wrapper, archivio } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'Term 1')

    expect(wrapper.find('input').exists()).toBe(false)
    const carta = wrapper.get('main .carta')
    expect(carta.text()).toContain('Giusta')
    expect(carta.text()).not.toContain('Sbagliata')
    expect(carta.text()).toContain('Lezione 01-a')
    expect(carta.text()).toContain('parola 1')
    expect(carta.text()).toContain('La tua risposta')
    expect(testi(wrapper, '.vocabolo-risposta-sara')).toEqual(['Term 1'])
    expect(carta.text()).toContain('Traduzione')
    expect(testi(wrapper, '.vocabolo-traduzione')).toEqual(['word 1'])
    expect(carta.text()).toContain('Accettata anche')
    expect(testi(wrapper, '.vocabolo-alternativa')).toEqual(['term 1'])
    expect(bottone(wrapper, 'Avanti').exists()).toBe(true)
    expect(wrapper.findAll('button').map((b) => b.text())).not.toContain('Conferma')
    expect(carta.classes()).not.toContain('vocabolo-carta-sbagliata')
    expect(archivio.leggiLivello('01-a/v1')).toBe('consolidato')
  })

  it('una risposta sbagliata mostra l’esito nello stesso formato', async () => {
    const { wrapper, archivio } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'wrd')

    const carta = wrapper.get('main .carta')
    expect(carta.text()).toContain('Sbagliata')
    expect(carta.text()).not.toContain('Giusta')
    expect(carta.text()).toContain('Lezione 01-a')
    expect(carta.text()).toContain('parola 1')
    expect(testi(wrapper, '.vocabolo-risposta-sara')).toEqual(['wrd'])
    expect(testi(wrapper, '.vocabolo-traduzione')).toEqual(['word 1'])
    expect(testi(wrapper, '.vocabolo-alternativa')).toEqual(['term 1'])
    expect(bottone(wrapper, 'Avanti').exists()).toBe(true)
    expect(carta.classes()).toContain('vocabolo-carta-sbagliata')
    expect(archivio.leggiLivello('01-a/v1')).toBe('da-ripassare')
  })

  it('senza altre traduzioni l’esito non mostra "Accettata anche"', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'x')
    await bottone(wrapper, 'Avanti').trigger('click')
    await flushPromises()

    await conferma(wrapper, 'word 2')
    expect(wrapper.text()).toContain('Giusta')
    expect(testi(wrapper, '.vocabolo-traduzione')).toEqual(['word 2'])
    expect(wrapper.text()).not.toContain('Accettata anche')
    expect(wrapper.find('.vocabolo-alternativa').exists()).toBe(false)
  })

  it('senza altre traduzioni anche l’esito sbagliato omette "Accettata anche"', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'x')
    await bottone(wrapper, 'Avanti').trigger('click')
    await flushPromises()

    await conferma(wrapper, 'nope')
    expect(wrapper.text()).toContain('Sbagliata')
    expect(testi(wrapper, '.vocabolo-traduzione')).toEqual(['word 2'])
    expect(wrapper.text()).not.toContain('Accettata anche')
  })

  it('Invio nel campo conferma come il pulsante', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    const input = wrapper.get('input')
    await input.setValue('word 1')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.text()).toContain('Giusta')
    expect(testi(wrapper, '.vocabolo-risposta-sara')).toEqual(['word 1'])
  })

  it('con il campo vuoto la conferma mostra "Sbagliata"', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, '')

    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.text()).toContain('Sbagliata')
    expect(testi(wrapper, '.vocabolo-traduzione')).toEqual(['word 1'])
    expect(bottone(wrapper, 'Avanti').exists()).toBe(true)
  })

  it('senza la lezione del vocabolo l’esito omette il titolo', async () => {
    const catalogo = catalogoDi(lezione('01-a', 2))
    const senzaLezioni: Catalogo = { ...catalogo, lezione: () => undefined }
    const { wrapper } = monta(catalogo, senzaLezioni)
    await conferma(wrapper, 'x')

    expect(wrapper.text()).not.toContain('Lezione 01-a')
    expect(wrapper.text()).toContain('parola 1')
    expect(testi(wrapper, '.vocabolo-traduzione')).toEqual(['word 1'])
    expect(bottone(wrapper, 'Avanti').exists()).toBe(true)
  })

  it('l’esito mette il fuoco su "Avanti"', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'x')
    expect(document.activeElement).toBe(bottone(wrapper, 'Avanti').element)
  })

  it.each([
    ['il pulsante', (b: ReturnType<typeof bottone>) => b.trigger('click')],
    ['Invio', (b: ReturnType<typeof bottone>) => b.trigger('keydown', { key: 'Enter' })],
  ])(
    'Avanti con %s porta al vocabolo successivo con il campo vuoto e a fuoco',
    async (_, premi) => {
      const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
      await conferma(wrapper, 'Something')
      await premi(bottone(wrapper, 'Avanti'))
      await flushPromises()

      expect(wrapper.text()).toContain('parola 2')
      expect(wrapper.text()).not.toContain('parola 1')
      const input = wrapper.get('input')
      expect((input.element as HTMLInputElement).value).toBe('')
      expect(document.activeElement).toBe(input.element)
      expect(bottone(wrapper, 'Conferma').exists()).toBe(true)
      expect(wrapper.text()).not.toContain('Avanti')
    },
  )

  it('un doppio Invio nel campo non salta l’esito', async () => {
    const { wrapper, archivio } = monta(catalogoDi(lezione('01-a', 2)))
    const input = wrapper.get('input')
    await input.setValue('word 1')
    // Due Invio di fila, prima che la schermata si aggiorni.
    void input.trigger('keydown', { key: 'Enter' })
    void input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.text()).toContain('Giusta')
    expect(wrapper.text()).toContain('parola 1')
    expect(bottone(wrapper, 'Avanti').exists()).toBe(true)
    expect(archivio.leggiLivello('01-a/v1')).toBe('consolidato')
    expect(archivio.leggiLivello('01-a/v2')).toBe('normale')
  })

  it('un Invio tenuto premuto non conferma né passa avanti', async () => {
    const { wrapper, archivio } = monta(catalogoDi(lezione('01-a', 2)))
    const input = wrapper.get('input')
    await input.setValue('word 1')
    await input.trigger('keydown', { key: 'Enter', repeat: true })
    await flushPromises()
    expect(wrapper.find('input').exists()).toBe(true)
    expect(archivio.leggiLivello('01-a/v1')).toBe('normale')

    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    await bottone(wrapper, 'Avanti').trigger('keydown', { key: 'Enter', repeat: true })
    await flushPromises()
    expect(wrapper.text()).toContain('Giusta')
    expect(wrapper.text()).toContain('parola 1')
    expect(bottone(wrapper, 'Avanti').exists()).toBe(true)
  })

  it('senza vocaboli mostra il messaggio di nessun materiale', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 0)))
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Vocaboli')
    expect(wrapper.get('h2').text()).toBe('Ancora nessun vocabolo su cui allenarti')
    expect(wrapper.text()).toContain(
      'I vocaboli compaiono qui quando arriva il materiale di una lezione.',
    )
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('senza alcuna lezione mostra il messaggio di nessun materiale', async () => {
    const { wrapper } = monta(catalogoDi())
    await flushPromises()
    expect(wrapper.text()).toContain('Ancora nessun vocabolo su cui allenarti')
  })
})
