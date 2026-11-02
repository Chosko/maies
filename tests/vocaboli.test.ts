import { describe, it, expect, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHashHistory, RouterView } from 'vue-router'
import type { VueWrapper } from '@vue/test-utils'
import { costruisciCatalogo } from '../src/contenuti/catalogo'
import type { Catalogo } from '../src/contenuti/catalogo'
import type { Lezione } from '../src/contenuti/schema'
import { creaArchivio } from '../src/ripasso/archivio'
import type { ArchivioProgressi } from '../src/ripasso/archivio'
import { creaSessione } from '../src/ripasso/sessione'
import { creaCiclo } from '../src/vocaboli/ciclo'
import VocaboliView from '../src/views/VocaboliView.vue'
import type { Edizione } from '../src/edizione'
import { creaPronuncia } from '../src/vocaboli/pronuncia'
import type { Pronuncia } from '../src/vocaboli/pronuncia'

const fissa = (valore: number) => () => valore

const serie = (valore: 0 | 1 | 2) => ({ stato: 'nel-gruppo' as const, serie: valore })

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
// `edizione` sostituisce quella di compilazione; senza, la schermata legge la costante.
// `pronuncia` sostituisce la sintesi vocale del browser; senza, la schermata usa quella vera.
function monta(
  catalogo: Catalogo,
  catalogoTitoli: Catalogo = catalogo,
  {
    edizione,
    archivio = creaArchivio(null),
    pronuncia,
  }: { edizione?: Edizione; archivio?: ArchivioProgressi; pronuncia?: Pronuncia } = {},
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
    const wrapper = mount(VocaboliView, {
      props: {
        creaCiclo: fabbrica,
        ...(edizione ? { edizione } : {}),
        ...(pronuncia ? { pronuncia } : {}),
      },
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

function bottoniImportanza(wrapper: VueWrapper) {
  return wrapper.get('.importanza [role="group"]').findAll('button')
}

function valoreScelto(wrapper: VueWrapper) {
  return bottoniImportanza(wrapper)
    .filter((b) => b.attributes('aria-pressed') === 'true')
    .map((b) => b.text())
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
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(1))
  })

  it('una risposta sbagliata mostra l’esito nello stesso formato, con la riscrittura al posto di Avanti', async () => {
    const archivio = creaArchivio(null)
    archivio.salvaStato('01-a/v1', serie(1))
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)), undefined, { archivio })
    await conferma(wrapper, 'wrd')

    const carta = wrapper.get('main .carta')
    expect(carta.text()).toContain('Sbagliata')
    expect(carta.text()).not.toContain('Giusta')
    expect(carta.text()).toContain('Lezione 01-a')
    expect(carta.text()).toContain('parola 1')
    expect(testi(wrapper, '.vocabolo-risposta-sara')).toEqual(['wrd'])
    expect(testi(wrapper, '.vocabolo-traduzione')).toEqual(['word 1'])
    expect(testi(wrapper, '.vocabolo-alternativa')).toEqual(['term 1'])
    expect(bottone(wrapper, 'Controlla').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Avanti')
    expect(carta.classes()).toContain('vocabolo-carta-sbagliata')
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))
  })

  it('senza altre traduzioni l’esito non mostra "Accettata anche"', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'word 1')
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
    await conferma(wrapper, 'word 1')
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

    expect(wrapper.text()).toContain('Sbagliata')
    expect(testi(wrapper, '.vocabolo-traduzione')).toEqual(['word 1'])
    expect(wrapper.findAll('input')).toHaveLength(1)
    expect(wrapper.get('input').classes()).toContain('vocabolo-riscrittura-campo')
    expect(bottone(wrapper, 'Controlla').exists()).toBe(true)
  })

  it('senza la lezione del vocabolo l’esito omette il titolo', async () => {
    const catalogo = catalogoDi(lezione('01-a', 2))
    const senzaLezioni: Catalogo = { ...catalogo, lezione: () => undefined }
    const { wrapper } = monta(catalogo, senzaLezioni)
    await conferma(wrapper, 'word 1')

    expect(wrapper.text()).not.toContain('Lezione 01-a')
    expect(wrapper.text()).toContain('parola 1')
    expect(testi(wrapper, '.vocabolo-traduzione')).toEqual(['word 1'])
    expect(bottone(wrapper, 'Avanti').exists()).toBe(true)
  })

  it('l’esito giusto mette il fuoco su "Avanti"', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'word 1')
    expect(document.activeElement).toBe(bottone(wrapper, 'Avanti').element)
  })

  it.each([
    ['il pulsante', (b: ReturnType<typeof bottone>) => b.trigger('click')],
    ['Invio', (b: ReturnType<typeof bottone>) => b.trigger('keydown', { key: 'Enter' })],
  ])(
    'Avanti con %s porta al vocabolo successivo con il campo vuoto e a fuoco',
    async (_, premi) => {
      const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
      await conferma(wrapper, 'word 1')
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
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(1))
    expect(archivio.leggiStato('01-a/v2')).toEqual(serie(0))
  })

  it('un Invio tenuto premuto non conferma né passa avanti', async () => {
    const { wrapper, archivio } = monta(catalogoDi(lezione('01-a', 2)))
    const input = wrapper.get('input')
    await input.setValue('word 1')
    await input.trigger('keydown', { key: 'Enter', repeat: true })
    await flushPromises()
    expect(wrapper.find('input').exists()).toBe(true)
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))

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

describe("schermata Vocaboli: l'importanza nell'esito", () => {
  it("nell'edizione principale l'esito mostra la riga sotto Avanti, staccata da lui", async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)), undefined, { edizione: 'principale' })
    expect(wrapper.find('.importanza').exists()).toBe(false)

    await conferma(wrapper, 'word 1')
    const riga = wrapper.get('.importanza')
    expect(riga.find('[role="group"]').attributes('aria-label')).toBe('Importanza')
    expect(bottoniImportanza(wrapper).map((b) => b.text())).toEqual(['0', '1', '2', '3'])
    // La riga non sta nella carta né accanto ad Avanti: viene dopo, come elemento a sé.
    expect(wrapper.get('main .carta').find('.importanza').exists()).toBe(false)
    const avanti = bottone(wrapper, 'Avanti').element
    expect(avanti.contains(riga.element)).toBe(false)
    expect(
      avanti.compareDocumentPosition(riga.element) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it("senza edizione passata la schermata legge quella di compilazione (la principale)", async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'word 1')
    expect(wrapper.find('.importanza').exists()).toBe(true)
  })

  it("nell'edizione kids la riga non compare", async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)), undefined, { edizione: 'kids' })
    await conferma(wrapper, 'word 1')

    expect(wrapper.text()).toContain('Giusta')
    expect(bottone(wrapper, 'Avanti').exists()).toBe(true)
    expect(wrapper.find('.importanza').exists()).toBe(false)
    expect(wrapper.findAll('button').map((b) => b.text())).toEqual(['Avanti'])
  })

  it('seleziona il valore attuale del vocabolo', async () => {
    const archivio = creaArchivio(null)
    archivio.salvaImportanza('01-a/v1', 3)
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)), undefined, { archivio })
    await conferma(wrapper, 'word 1')
    expect(valoreScelto(wrapper)).toEqual(['3'])
  })

  it.each([1, 2, 3] as const)(
    'toccare %i registra l’importanza, la seleziona e non passa avanti',
    async (valore) => {
      const archivio = creaArchivio(null)
      archivio.salvaImportanza('01-a/v1', valore === 1 ? 3 : 1)
      const { wrapper } = monta(catalogoDi(lezione('01-a', 2)), undefined, { archivio })
      await conferma(wrapper, 'word 1')

      await bottoniImportanza(wrapper)[valore].trigger('click')
      await flushPromises()

      expect(archivio.leggiImportanza('01-a/v1')).toBe(valore)
      expect(valoreScelto(wrapper)).toEqual([String(valore)])
      expect(wrapper.text()).toContain('Giusta')
      expect(wrapper.text()).toContain('parola 1')
      expect(bottone(wrapper, 'Avanti').exists()).toBe(true)
      expect(wrapper.find('input').exists()).toBe(false)
    },
  )

  it("0 apre la conferma dentro la pagina, che chiede di togliere il vocabolo dall'allenamento", async () => {
    const { wrapper, archivio } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'word 1')

    await bottoniImportanza(wrapper)[0].trigger('click')
    await flushPromises()

    const dialogo = wrapper.get('.importanza [role="alertdialog"]')
    expect(dialogo.text()).toContain("Togliere il vocabolo dall'allenamento?")
    expect(archivio.leggiImportanza('01-a/v1')).toBe(2)
    expect(wrapper.text()).toContain('parola 1')
    expect(bottone(wrapper, 'Avanti').exists()).toBe(true)
  })

  it('Annulla chiude la conferma senza togliere il vocabolo', async () => {
    const { wrapper, archivio } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'word 1')
    await bottoniImportanza(wrapper)[0].trigger('click')

    await bottone(wrapper, 'Annulla').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false)
    expect(archivio.leggiImportanza('01-a/v1')).toBe(2)
    expect(valoreScelto(wrapper)).toEqual(['2'])
    expect(wrapper.text()).toContain('parola 1')
    expect(bottone(wrapper, 'Avanti').exists()).toBe(true)
  })

  it('Togli registra 0 e passa al vocabolo successivo', async () => {
    const { wrapper, archivio } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'word 1')
    await bottoniImportanza(wrapper)[0].trigger('click')

    await bottone(wrapper, 'Togli').trigger('click')
    await flushPromises()

    expect(archivio.leggiImportanza('01-a/v1')).toBe(0)
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(1))
    expect(wrapper.text()).toContain('parola 2')
    const input = wrapper.get('input')
    expect(document.activeElement).toBe(input.element)
    expect(wrapper.find('.importanza').exists()).toBe(false)
  })

  it.each([
    ['il pulsante', (b: ReturnType<typeof bottone>) => b.trigger('click')],
    ['Invio', (b: ReturnType<typeof bottone>) => b.trigger('keydown', { key: 'Enter' })],
  ])('a conferma aperta Avanti con %s non passa avanti', async (_, premi) => {
    const { wrapper, archivio } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'word 1')
    await bottoniImportanza(wrapper)[0].trigger('click')
    await flushPromises()

    await premi(bottone(wrapper, 'Avanti'))
    await flushPromises()

    expect(wrapper.text()).toContain('parola 1')
    expect(wrapper.text()).not.toContain('parola 2')
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(true)
    expect(archivio.leggiImportanza('01-a/v1')).toBe(2)
  })

  it('a conferma chiusa Invio su Avanti passa ancora avanti', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'word 1')
    await bottoniImportanza(wrapper)[3].trigger('click')
    await bottoniImportanza(wrapper)[0].trigger('click')
    await bottone(wrapper, 'Annulla').trigger('click')
    await flushPromises()

    await bottone(wrapper, 'Avanti').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.text()).toContain('parola 2')
  })

  it("togliere l'ultimo vocabolo mostra il messaggio dei vocaboli tolti, distinto da quello senza materiale", async () => {
    const archivio = creaArchivio(null)
    archivio.salvaImportanza('01-a/v2', 0)
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)), undefined, { archivio })
    await conferma(wrapper, 'word 1')
    await bottoniImportanza(wrapper)[0].trigger('click')
    await bottone(wrapper, 'Togli').trigger('click')
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Vocaboli')
    const carta = wrapper.get('main .carta.esercizio-vuoto-carta')
    expect(carta.get('h2.esercizio-vuoto-titolo').text()).toBe(
      "Hai tolto tutti i vocaboli dall'allenamento",
    )
    expect(wrapper.text()).not.toContain('Ancora nessun vocabolo su cui allenarti')
    expect(wrapper.text()).not.toContain(
      'I vocaboli compaiono qui quando arriva il materiale di una lezione.',
    )
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('con tutti i vocaboli già tolti la schermata si apre sul messaggio dei vocaboli tolti', async () => {
    const archivio = creaArchivio(null)
    archivio.salvaImportanza('01-a/v1', 0)
    archivio.salvaImportanza('01-a/v2', 0)
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)), undefined, {
      archivio,
      edizione: 'kids',
    })
    await flushPromises()

    expect(wrapper.get('h2').text()).toBe("Hai tolto tutti i vocaboli dall'allenamento")
    expect(wrapper.text()).not.toContain('Ancora nessun vocabolo')
  })
})

describe("schermata Vocaboli: frase d'esempio e trucco nell'esito", () => {
  // Una lezione con un solo vocabolo, che porta i campi facoltativi richiesti.
  function lezioneCon(campi: { example?: string; mnemonic?: string }): Lezione {
    return {
      id: '01-a',
      title: 'Lezione 01-a',
      sentences: [],
      vocabulary: [{ id: 'v1', it: 'luogo', en: ['venue'], ...campi }],
      grammar: [],
    }
  }

  const esempio = 'This venue is perfect for a concert.'
  const trucco = 'venue ricorda "venire": il posto dove la gente viene.'

  it.each([
    ['principale', 'venue'],
    ['principale', 'place'],
    ['kids', 'venue'],
    ['kids', 'place'],
  ] as const)(
    "nell'edizione %s, rispondendo %s, l'esito mostra frase d'esempio e trucco dopo le traduzioni",
    async (edizione, risposta) => {
      const { wrapper } = monta(catalogoDi(lezioneCon({ example: esempio, mnemonic: trucco })), undefined, {
        edizione,
      })
      await conferma(wrapper, risposta)

      const carta = wrapper.get('main .carta')
      const frase = carta.get('.vocabolo-esempio')
      expect(frase.text()).toBe(esempio)
      expect(frase.attributes('lang')).toBe('en')
      const ricordo = carta.get('.vocabolo-trucco')
      expect(ricordo.text()).toBe(trucco)
      expect(ricordo.attributes('lang')).toBeUndefined()
      expect(carta.text()).toContain('Esempio')
      expect(carta.text()).toContain('Trucco per ricordare')
      // Prima le traduzioni, poi la frase d'esempio, poi il trucco.
      const traduzione = carta.get('.vocabolo-traduzione').element
      expect(
        traduzione.compareDocumentPosition(frase.element) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      expect(
        frase.element.compareDocumentPosition(ricordo.element) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    },
  )

  it.each(['principale', 'kids'] as const)(
    "nell'edizione %s un vocabolo senza i due campi li omette, senza blocchi vuoti",
    async (edizione) => {
      const { wrapper } = monta(catalogoDi(lezioneCon({})), undefined, { edizione })
      await conferma(wrapper, 'venue')

      const carta = wrapper.get('main .carta')
      expect(carta.find('.vocabolo-esempio').exists()).toBe(false)
      expect(carta.find('.vocabolo-trucco').exists()).toBe(false)
      expect(carta.text()).not.toContain('Esempio')
      expect(carta.text()).not.toContain('Trucco per ricordare')
      // Restano solo i blocchi della risposta e della traduzione.
      expect(carta.findAll('.vocabolo-risposta')).toHaveLength(2)
    },
  )

  it("con la sola frase d'esempio l'esito omette il trucco", async () => {
    const { wrapper } = monta(catalogoDi(lezioneCon({ example: esempio })))
    await conferma(wrapper, 'x')

    const carta = wrapper.get('main .carta')
    expect(carta.get('.vocabolo-esempio').text()).toBe(esempio)
    expect(carta.find('.vocabolo-trucco').exists()).toBe(false)
    expect(carta.text()).not.toContain('Trucco per ricordare')
    expect(carta.findAll('.vocabolo-risposta')).toHaveLength(3)
  })

  it("con il solo trucco l'esito omette la frase d'esempio", async () => {
    const { wrapper } = monta(catalogoDi(lezioneCon({ mnemonic: trucco })))
    await conferma(wrapper, 'venue')

    const carta = wrapper.get('main .carta')
    expect(carta.get('.vocabolo-trucco').text()).toBe(trucco)
    expect(carta.find('.vocabolo-esempio').exists()).toBe(false)
    expect(carta.text()).not.toContain('Esempio')
    expect(carta.findAll('.vocabolo-risposta')).toHaveLength(3)
  })

  it("la domanda non mostra né la frase d'esempio né il trucco", async () => {
    const { wrapper } = monta(catalogoDi(lezioneCon({ example: esempio, mnemonic: trucco })))
    await flushPromises()

    expect(wrapper.find('.vocabolo-esempio').exists()).toBe(false)
    expect(wrapper.find('.vocabolo-trucco').exists()).toBe(false)
    expect(wrapper.text()).not.toContain(esempio)
  })
})

describe("schermata Vocaboli: la pronuncia nell'esito", () => {
  const esempio = 'This venue is perfect for a concert.'

  function lezioneCon(campi: { example?: string }): Lezione {
    return {
      id: '01-a',
      title: 'Lezione 01-a',
      sentences: [],
      vocabulary: [
        { id: 'v1', it: 'luogo', en: ['venue', 'place'], ...campi },
        { id: 'v2', it: 'parola 2', en: ['word 2'] },
      ],
      grammar: [],
    }
  }

  // Sostituto del modulo di pronuncia: registra le letture e permette di cambiare la disponibilità.
  function pronunciaFinta(disponibile: boolean) {
    const letti: string[] = []
    const ascoltatori: (() => void)[] = []
    let stato = disponibile
    const pronuncia: Pronuncia = {
      disponibile: () => stato,
      leggi: (testo) => {
        letti.push(testo)
      },
      quandoCambia: (ascoltatore) => {
        ascoltatori.push(ascoltatore)
        return () => {
          const i = ascoltatori.indexOf(ascoltatore)
          if (i >= 0) ascoltatori.splice(i, 1)
        }
      },
    }
    const cambia = (nuovo: boolean) => {
      stato = nuovo
      for (const a of [...ascoltatori]) a()
    }
    return { pronuncia, letti, cambia, ascoltatori }
  }

  const ascoltaTraduzione = (wrapper: VueWrapper) =>
    wrapper.find('button[aria-label="Ascolta la traduzione"]')
  const ascoltaEsempio = (wrapper: VueWrapper) =>
    wrapper.find('button[aria-label="Ascolta la frase d\'esempio"]')

  it.each(['venue', 'x'])(
    'rispondendo %s, accanto alla traduzione principale e alla frase d’esempio c’è un pulsante che le legge',
    async (risposta) => {
      const { pronuncia, letti } = pronunciaFinta(true)
      const { wrapper } = monta(catalogoDi(lezioneCon({ example: esempio })), undefined, { pronuncia })
      await conferma(wrapper, risposta)

      const traduzione = ascoltaTraduzione(wrapper)
      const frase = ascoltaEsempio(wrapper)
      expect(traduzione.exists()).toBe(true)
      expect(frase.exists()).toBe(true)
      expect(traduzione.attributes('type')).toBe('button')
      // Ogni pulsante sta nel blocco del testo che legge.
      expect(traduzione.element.closest('.vocabolo-risposta')?.querySelector('.vocabolo-traduzione')).not.toBeNull()
      expect(frase.element.closest('.vocabolo-risposta')?.querySelector('.vocabolo-esempio')).not.toBeNull()

      await traduzione.trigger('click')
      await frase.trigger('click')
      expect(letti).toEqual(['venue', esempio])
      // I testi mostrati restano quelli di prima.
      expect(wrapper.get('.vocabolo-traduzione').text()).toBe('venue')
      expect(wrapper.get('.vocabolo-esempio').text()).toBe(esempio)
    },
  )

  it("le altre traduzioni accettate non hanno pulsante", async () => {
    const { pronuncia } = pronunciaFinta(true)
    const { wrapper } = monta(catalogoDi(lezioneCon({ example: esempio })), undefined, { pronuncia })
    await conferma(wrapper, 'venue')

    expect(wrapper.findAll('button[aria-label^="Ascolta"]')).toHaveLength(2)
  })

  it("senza frase d'esempio manca il suo pulsante, resta quello della traduzione", async () => {
    const { pronuncia } = pronunciaFinta(true)
    const { wrapper } = monta(catalogoDi(lezioneCon({})), undefined, { pronuncia })
    await conferma(wrapper, 'venue')

    expect(ascoltaTraduzione(wrapper).exists()).toBe(true)
    expect(ascoltaEsempio(wrapper).exists()).toBe(false)
  })

  it('senza lettura disponibile i pulsanti non compaiono', async () => {
    const { pronuncia } = pronunciaFinta(false)
    const { wrapper } = monta(catalogoDi(lezioneCon({ example: esempio })), undefined, { pronuncia })
    await conferma(wrapper, 'venue')

    expect(wrapper.find('button[aria-label^="Ascolta"]').exists()).toBe(false)
    expect(wrapper.get('.vocabolo-traduzione').text()).toBe('venue')
    expect(wrapper.get('.vocabolo-esempio').text()).toBe(esempio)
  })

  it('senza sintesi vocale nel browser i pulsanti non compaiono', async () => {
    const { wrapper } = monta(catalogoDi(lezioneCon({ example: esempio })))
    await conferma(wrapper, 'venue')

    expect(wrapper.find('button[aria-label^="Ascolta"]').exists()).toBe(false)
  })

  it('i pulsanti compaiono quando le voci inglesi arrivano dopo, e spariscono se se ne vanno', async () => {
    const { pronuncia, cambia } = pronunciaFinta(false)
    const { wrapper } = monta(catalogoDi(lezioneCon({ example: esempio })), undefined, { pronuncia })
    await conferma(wrapper, 'venue')
    expect(ascoltaTraduzione(wrapper).exists()).toBe(false)

    cambia(true)
    await flushPromises()
    expect(ascoltaTraduzione(wrapper).exists()).toBe(true)
    expect(ascoltaEsempio(wrapper).exists()).toBe(true)

    cambia(false)
    await flushPromises()
    expect(ascoltaTraduzione(wrapper).exists()).toBe(false)
  })

  it('smette di ascoltare i cambi delle voci quando la schermata si chiude', async () => {
    const { pronuncia, ascoltatori } = pronunciaFinta(true)
    const { wrapper } = monta(catalogoDi(lezioneCon({})), undefined, { pronuncia })
    expect(ascoltatori).toHaveLength(1)

    wrapper.unmount()
    montate = montate.filter((w) => w !== wrapper)
    expect(ascoltatori).toHaveLength(0)
  })

  it('una lettura che fallisce non mostra errori', async () => {
    // Il modulo vero, su una sintesi che ha una voce inglese ma fallisce a ogni lettura.
    const pronuncia = creaPronuncia({
      sintesi: {
        getVoices: () => [{ name: 'Daniel', lang: 'en-GB' }],
        cancel: () => {},
        speak: () => {
          throw new Error('rotto')
        },
        addEventListener: () => {},
        removeEventListener: () => {},
      },
      Enunciato: class {
        voice = null
        lang = ''
        onerror = null
        constructor(public text: string) {}
      },
    })
    const { wrapper } = monta(catalogoDi(lezioneCon({ example: esempio })), undefined, { pronuncia })
    await conferma(wrapper, 'venue')
    const prima = wrapper.get('main').text()

    await ascoltaTraduzione(wrapper).trigger('click')
    await flushPromises()
    expect(wrapper.get('main').text()).toBe(prima)
  })

  it('la domanda non mostra i pulsanti della pronuncia', async () => {
    const { pronuncia } = pronunciaFinta(true)
    const { wrapper } = monta(catalogoDi(lezioneCon({ example: esempio })), undefined, { pronuncia })
    await flushPromises()

    expect(wrapper.find('button[aria-label^="Ascolta"]').exists()).toBe(false)
  })

  it('Avanti resta il pulsante con il fuoco dopo la conferma', async () => {
    const { pronuncia } = pronunciaFinta(true)
    const { wrapper } = monta(catalogoDi(lezioneCon({ example: esempio })), undefined, { pronuncia })
    await conferma(wrapper, 'venue')

    expect(document.activeElement).toBe(bottone(wrapper, 'Avanti').element)
  })
})

describe('schermata Vocaboli: la riscrittura dopo una risposta sbagliata', () => {
  const campoRiscrittura = (wrapper: VueWrapper) => wrapper.get('.vocabolo-riscrittura-campo')
  const avviso = (wrapper: VueWrapper) => wrapper.find('.vocabolo-riscrittura-avviso')

  async function controlla(wrapper: VueWrapper, testo: string) {
    await campoRiscrittura(wrapper).setValue(testo)
    await bottone(wrapper, 'Controlla').trigger('click')
    await flushPromises()
  }

  it('sotto le traduzioni corrette chiede di riscrivere la traduzione, con il campo a fuoco e "Controlla"', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'wrd')

    const carta = wrapper.get('main .carta')
    const campo = campoRiscrittura(wrapper)
    expect(carta.element.contains(campo.element)).toBe(true)
    const etichetta = carta.get(`label[for="${campo.attributes('id')}"]`)
    expect(etichetta.text()).toBe('Riscrivi la traduzione')
    expect((campo.element as HTMLInputElement).value).toBe('')
    expect(campo.attributes('lang')).toBe('en')
    expect(campo.attributes('autocomplete')).toBe('off')
    expect(campo.attributes('autocorrect')).toBe('off')
    expect(campo.attributes('autocapitalize')).toBe('off')
    expect(campo.attributes('spellcheck')).toBe('false')
    expect(document.activeElement).toBe(campo.element)
    // Il campo viene dopo la traduzione principale e le altre traduzioni accettate.
    for (const selettore of ['.vocabolo-traduzione', '.vocabolo-alternativa']) {
      expect(
        carta.get(selettore).element.compareDocumentPosition(campo.element) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    }
    // "Controlla" sta fuori dalla carta, al posto di "Avanti".
    const controllaBottone = bottone(wrapper, 'Controlla')
    expect(carta.element.contains(controllaBottone.element)).toBe(false)
    expect(controllaBottone.classes()).toContain('bottone-principale')
    expect(wrapper.text()).not.toContain('Avanti')
    expect(avviso(wrapper).exists()).toBe(false)
  })

  it('una riscrittura giusta lascia il posto ad "Avanti", a fuoco, e l’esito resta sbagliato', async () => {
    const archivio = creaArchivio(null)
    archivio.salvaStato('01-a/v1', serie(1))
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)), undefined, { archivio })
    await conferma(wrapper, 'wrd')
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))

    await controlla(wrapper, ' Term 1. ')

    expect(wrapper.find('.vocabolo-riscrittura-campo').exists()).toBe(false)
    expect(wrapper.findAll('button').map((b) => b.text())).not.toContain('Controlla')
    const avanti = bottone(wrapper, 'Avanti')
    expect(document.activeElement).toBe(avanti.element)
    expect(wrapper.text()).toContain('Sbagliata')
    expect(wrapper.get('main .carta').classes()).toContain('vocabolo-carta-sbagliata')
    expect(testi(wrapper, '.vocabolo-risposta-sara')).toEqual(['wrd'])
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))

    await avanti.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('parola 2')
    expect(document.activeElement).toBe(wrapper.get('input').element)
  })

  it('una riscrittura sbagliata lascia il campo, a fuoco, con un messaggio di riprovare', async () => {
    const { wrapper, archivio } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'wrd')

    await controlla(wrapper, 'wrod 1')

    const campo = campoRiscrittura(wrapper)
    expect((campo.element as HTMLInputElement).value).toBe('wrod 1')
    expect(document.activeElement).toBe(campo.element)
    const messaggio = avviso(wrapper)
    expect(messaggio.exists()).toBe(true)
    expect(messaggio.attributes('role')).toBe('alert')
    expect(messaggio.text()).toBe('Non è ancora giusta: riprova.')
    expect(bottone(wrapper, 'Controlla').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Avanti')
    expect(archivio.leggiStato('01-a/v1')).toEqual(serie(0))

    await controlla(wrapper, 'word 1')
    expect(avviso(wrapper).exists()).toBe(false)
    expect(bottone(wrapper, 'Avanti').exists()).toBe(true)
  })

  it('Invio nel campo controlla come il pulsante; un Invio tenuto premuto no', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'wrd')
    const campo = campoRiscrittura(wrapper)

    await campo.setValue('nope')
    await campo.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(avviso(wrapper).exists()).toBe(true)

    await campo.setValue('word 1')
    await campo.trigger('keydown', { key: 'Enter', repeat: true })
    await flushPromises()
    expect(wrapper.find('.vocabolo-riscrittura-campo').exists()).toBe(true)

    await campo.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.find('.vocabolo-riscrittura-campo').exists()).toBe(false)
    expect(document.activeElement).toBe(bottone(wrapper, 'Avanti').element)
  })

  it('un Invio tenuto premuto dalla conferma non salta la riscrittura', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    const input = wrapper.get('input')
    await input.setValue('wrd')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    await campoRiscrittura(wrapper).trigger('keydown', { key: 'Enter', repeat: true })
    await flushPromises()
    expect(wrapper.find('.vocabolo-riscrittura-campo').exists()).toBe(true)
    expect(avviso(wrapper).exists()).toBe(false)
  })

  it('una risposta giusta non chiede la riscrittura', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'word 1')

    expect(wrapper.find('.vocabolo-riscrittura-campo').exists()).toBe(false)
    expect(wrapper.findAll('button').map((b) => b.text())).not.toContain('Controlla')
  })

  it("in riscrittura si sceglie l'importanza e la riga resta sotto Controlla", async () => {
    const { wrapper, archivio } = monta(catalogoDi(lezione('01-a', 2)), undefined, {
      edizione: 'principale',
    })
    await conferma(wrapper, 'wrd')

    const riga = wrapper.get('.importanza')
    expect(
      bottone(wrapper, 'Controlla').element.compareDocumentPosition(riga.element) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    await bottoniImportanza(wrapper)[3].trigger('click')
    await flushPromises()

    expect(archivio.leggiImportanza('01-a/v1')).toBe(3)
    expect(valoreScelto(wrapper)).toEqual(['3'])
    expect(wrapper.find('.vocabolo-riscrittura-campo').exists()).toBe(true)
  })

  it('in riscrittura Togli registra 0 e passa al vocabolo successivo', async () => {
    const { wrapper, archivio } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'wrd')
    await bottoniImportanza(wrapper)[0].trigger('click')
    await flushPromises()

    await bottone(wrapper, 'Togli').trigger('click')
    await flushPromises()

    expect(archivio.leggiImportanza('01-a/v1')).toBe(0)
    expect(wrapper.text()).toContain('parola 2')
    expect(wrapper.find('.vocabolo-riscrittura-campo').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get('input').element)
  })

  it('a conferma della rimozione aperta Controlla non controlla', async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)))
    await conferma(wrapper, 'wrd')
    await bottoniImportanza(wrapper)[0].trigger('click')
    await flushPromises()

    await controlla(wrapper, 'word 1')

    expect(wrapper.find('.vocabolo-riscrittura-campo').exists()).toBe(true)
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(true)
  })

  it("nell'edizione kids la riscrittura c'è, senza la riga dell'importanza", async () => {
    const { wrapper } = monta(catalogoDi(lezione('01-a', 2)), undefined, { edizione: 'kids' })
    await conferma(wrapper, 'wrd')

    expect(wrapper.find('.vocabolo-riscrittura-campo').exists()).toBe(true)
    expect(wrapper.find('.importanza').exists()).toBe(false)
    expect(wrapper.findAll('button').map((b) => b.text())).toEqual(['Controlla'])
  })
})

// Monta la schermata dietro un router vero, aperta all'indirizzo `indirizzo`.
async function montaA(
  indirizzo: string,
  catalogo: Catalogo,
  { edizione, archivio = creaArchivio(null) }: { edizione?: Edizione; archivio?: ArchivioProgressi } = {},
) {
  const fabbrica = () =>
    creaCiclo({
      catalogo,
      creaSessione: (tipo) => creaSessione(tipo, { catalogo, archivio, casualita: fissa(0) }),
    })
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      {
        path: '/vocaboli',
        component: VocaboliView,
        props: { creaCiclo: fabbrica, ...(edizione ? { edizione } : {}) },
      },
      { path: '/dizionario', component: { template: '<p>Dizionario</p>' } },
    ],
  })
  await router.push('/dizionario')
  await router.isReady()
  const voci = window.history.length
  await router.push(indirizzo)
  const wrapper = mount(RouterView, { global: { plugins: [router] }, attachTo: document.body })
  montate.push(wrapper)
  await flushPromises()
  return { router, wrapper, archivio, vociAggiunte: () => window.history.length - voci }
}

describe('schermata Vocaboli aperta su una parola indicata nell’indirizzo', () => {
  it.each<Edizione>(['principale', 'kids'])(
    'nell’edizione %s la parola indicata è la prima domanda',
    async (edizione) => {
      const { wrapper } = await montaA('/vocaboli?parola=01-a/v3', catalogoDi(lezione('01-a', 3)), {
        edizione,
      })

      expect(wrapper.get('.vocabolo-parola').text()).toBe('parola 3')
      expect(document.activeElement).toBe(wrapper.get('input').element)
    },
  )

  it.each<Edizione>(['principale', 'kids'])(
    'nell’edizione %s il parametro sparisce dall’indirizzo senza una voce in più nella cronologia',
    async (edizione) => {
      const { router, vociAggiunte } = await montaA(
        '/vocaboli?parola=01-a/v3',
        catalogoDi(lezione('01-a', 3)),
        { edizione },
      )

      expect(router.currentRoute.value.path).toBe('/vocaboli')
      expect(router.currentRoute.value.query).toEqual({})
      // La sola voce aggiunta è quella dell'ingresso: togliere il parametro la sostituisce.
      expect(vociAggiunte()).toBe(1)
    },
  )

  it('dopo la parola indicata il ciclo continua come sempre', async () => {
    const { wrapper } = await montaA('/vocaboli?parola=01-a/v3', catalogoDi(lezione('01-a', 3)))

    await conferma(wrapper, 'word 3')
    await bottone(wrapper, 'Avanti').trigger('click')
    await flushPromises()

    expect(wrapper.get('.vocabolo-parola').text()).toBe('parola 1')
  })

  it('una parola sconosciuta apre il prossimo elemento senza messaggi', async () => {
    const { wrapper, router } = await montaA('/vocaboli?parola=09-z/v1', catalogoDi(lezione('01-a', 2)))

    expect(wrapper.get('.vocabolo-parola').text()).toBe('parola 1')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(router.currentRoute.value.query).toEqual({})
  })

  it('una parola tolta dall’allenamento apre il prossimo elemento senza messaggi', async () => {
    const archivio = creaArchivio(null)
    archivio.salvaImportanza('01-a/v2', 0)
    const { wrapper } = await montaA('/vocaboli?parola=01-a/v2', catalogoDi(lezione('01-a', 2)), {
      archivio,
    })

    expect(wrapper.get('.vocabolo-parola').text()).toBe('parola 1')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('senza parametro l’indirizzo resta com’è', async () => {
    const { wrapper, router, vociAggiunte } = await montaA('/vocaboli', catalogoDi(lezione('01-a', 2)))

    expect(wrapper.get('.vocabolo-parola').text()).toBe('parola 1')
    expect(router.currentRoute.value.fullPath).toBe('/vocaboli')
    expect(vociAggiunte()).toBe(1)
  })
})
