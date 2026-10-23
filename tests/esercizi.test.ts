import { describe, it, expect, afterEach, vi } from 'vitest'
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
function monta(
  catalogo: Catalogo,
  catalogoTitoli: Catalogo = catalogo,
  archivio: ArchivioProgressi = creaArchivio(null),
) {
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

function rigaImportanza(wrapper: VueWrapper) {
  return wrapper.find('[role="group"][aria-label="Importanza"]')
}

function valoreImportanza(wrapper: VueWrapper, valore: number) {
  const trovato = rigaImportanza(wrapper)
    .findAll('button')
    .find((b) => b.text() === String(valore))
  if (!trovato) throw new Error(`Nessun valore d'importanza ${valore}`)
  return trovato
}

function valoreSelezionato(wrapper: VueWrapper) {
  return rigaImportanza(wrapper)
    .findAll('button')
    .filter((b) => b.attributes('aria-pressed') === 'true')
    .map((b) => b.text())
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
    expect(wrapper.text()).not.toContain('Hai tolto tutte le frasi dagli esercizi')
  })

  it('senza alcuna lezione mostra il messaggio di nessun materiale', async () => {
    const { wrapper } = monta(catalogoDi())
    await flushPromises()
    expect(wrapper.text()).toContain('Ancora nessuna frase da tradurre')
  })
})

describe('schermata Esercizi: importanza', () => {
  it('la riga dell’importanza c’è solo nella soluzione, sotto Giusta e Sbagliata e fuori dal loro gruppo', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    await flushPromises()
    expect(rigaImportanza(wrapper).exists()).toBe(false)

    await conferma(wrapper, 'x')

    const riga = rigaImportanza(wrapper)
    expect(riga.exists()).toBe(true)
    expect(riga.findAll('button').map((b) => b.text())).toEqual(['0', '1', '2', '3'])
    const esito = wrapper.get('.esercizio-esito')
    expect(esito.find('[role="group"]').exists()).toBe(false)
    expect(wrapper.get('main .carta').find('[role="group"]').exists()).toBe(false)
    const posizione = bottone(wrapper, 'Giusta').element.compareDocumentPosition(riga.element)
    expect(posizione & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('seleziona il valore attuale della frase', async () => {
    const archivio = creaArchivio(null)
    archivio.salvaImportanza('01-a/f2', 3)
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)), undefined, archivio)

    await conferma(wrapper, 'x')
    expect(valoreSelezionato(wrapper)).toEqual(['2'])

    await bottone(wrapper, 'Giusta').trigger('click')
    await flushPromises()
    await conferma(wrapper, 'x')
    expect(wrapper.text()).toContain('Frase 2.')
    expect(valoreSelezionato(wrapper)).toEqual(['3'])
  })

  it.each([1, 2, 3])(
    'toccare %i registra l’importanza, la seleziona e non cambia fase',
    async (valore) => {
      const { wrapper, archivio } = monta(catalogoDi(lezione('01-a', 2)))
      await conferma(wrapper, 'My answer.')

      await valoreImportanza(wrapper, valore).trigger('click')
      await flushPromises()

      expect(archivio.leggiImportanza('01-a/f1')).toBe(valore)
      expect(valoreSelezionato(wrapper)).toEqual([String(valore)])
      expect(wrapper.find('input').exists()).toBe(false)
      expect(wrapper.text()).toContain('Frase 1.')
      expect(wrapper.text()).toContain('My answer.')
      expect(bottone(wrapper, 'Giusta').exists()).toBe(true)
      expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false)
      expect(archivio.leggiLivello('01-a/f1')).toBe(creaArchivio(null).leggiLivello('01-a/f1'))
    },
  )

  it('toccare 0 apre la conferma nella pagina e lascia la soluzione', async () => {
    const confirm = vi.spyOn(window, 'confirm')
    const { wrapper, archivio } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'x')

    await valoreImportanza(wrapper, 0).trigger('click')
    await flushPromises()

    const dialogo = wrapper.get('[role="alertdialog"]')
    expect(dialogo.text()).toContain('Togliere la frase dagli esercizi?')
    expect(bottone(wrapper, 'Togli').exists()).toBe(true)
    expect(bottone(wrapper, 'Annulla').exists()).toBe(true)
    expect(confirm).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Frase 1.')
    expect(archivio.leggiImportanza('01-a/f1')).toBe(2)
    confirm.mockRestore()
  })

  it.each(['Giusta', 'Sbagliata'])(
    'con la conferma aperta %s non ha effetto',
    async (testo) => {
      const { wrapper, archivio } = monta(catalogoDi(lezione('01-a', 2)))
      await conferma(wrapper, 'x')
      await valoreImportanza(wrapper, 0).trigger('click')
      await flushPromises()

      await bottone(wrapper, testo).trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Frase 1.')
      expect(wrapper.find('input').exists()).toBe(false)
      expect(wrapper.find('[role="alertdialog"]').exists()).toBe(true)
      expect(archivio.leggiLivello('01-a/f1')).toBe(creaArchivio(null).leggiLivello('01-a/f1'))
    },
  )

  it('Annulla chiude la conferma e non cambia nulla', async () => {
    const { wrapper, archivio } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'x')
    await valoreImportanza(wrapper, 0).trigger('click')
    await flushPromises()

    await bottone(wrapper, 'Annulla').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false)
    expect(archivio.leggiImportanza('01-a/f1')).toBe(2)
    expect(valoreSelezionato(wrapper)).toEqual(['2'])
    expect(wrapper.text()).toContain('Frase 1.')
    expect(bottone(wrapper, 'Giusta').exists()).toBe(true)

    await bottone(wrapper, 'Giusta').trigger('click')
    await flushPromises()
    expect(archivio.leggiLivello('01-a/f1')).toBe('consolidato')
    expect(wrapper.text()).toContain('Frase 2.')
  })

  it('Togli toglie la frase senza registrare un esito e passa alla successiva', async () => {
    const { wrapper, archivio } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'x')
    await valoreImportanza(wrapper, 0).trigger('click')
    await flushPromises()

    await bottone(wrapper, 'Togli').trigger('click')
    await flushPromises()

    expect(archivio.leggiImportanza('01-a/f1')).toBe(0)
    expect(archivio.leggiLivello('01-a/f1')).toBe(creaArchivio(null).leggiLivello('01-a/f1'))
    expect(wrapper.text()).toContain('Frase 2.')
    const input = wrapper.get('input')
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(document.activeElement).toBe(input.element)
    expect(rigaImportanza(wrapper).exists()).toBe(false)
  })
})

describe('schermata Esercizi: tutte le frasi tolte', () => {
  it('con tutte le frasi tolte mostra il suo messaggio, nella forma di quello senza materiale', async () => {
    const archivio = creaArchivio(null)
    archivio.salvaImportanza('01-a/f1', 0)
    archivio.salvaImportanza('01-a/f2', 0)
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)), undefined, archivio)
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Esercizi')
    const carta = wrapper.get('.esercizio-vuoto .carta.esercizio-vuoto-carta')
    expect(carta.find('.esercizio-vuoto-icona svg').exists()).toBe(true)
    expect(carta.get('h2.esercizio-vuoto-titolo').text()).toBe(
      'Hai tolto tutte le frasi dagli esercizi',
    )
    expect(carta.find('.esercizio-vuoto-testo').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Ancora nessuna frase da tradurre')
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('togliere l’ultima frase rimasta porta al messaggio delle frasi tolte', async () => {
    const archivio = creaArchivio(null)
    archivio.salvaImportanza('01-a/f2', 0)
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)), undefined, archivio)
    await conferma(wrapper, 'x')
    await valoreImportanza(wrapper, 0).trigger('click')
    await flushPromises()
    await bottone(wrapper, 'Togli').trigger('click')
    await flushPromises()

    expect(wrapper.get('h2').text()).toBe('Hai tolto tutte le frasi dagli esercizi')
    expect(wrapper.text()).not.toContain('Ancora nessuna frase da tradurre')
  })
})
