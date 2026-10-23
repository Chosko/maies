import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RigaImportanza from '../src/components/RigaImportanza.vue'

const messaggio = 'Togliere la frase dagli esercizi?'

function monta(props: { importanza?: number; confermaAperta?: boolean; messaggio?: string } = {}) {
  const confirm = vi.spyOn(window, 'confirm')
  const wrapper = mount(RigaImportanza, {
    props: { importanza: 2, confermaAperta: false, messaggio, ...props },
  })
  return { wrapper, confirm }
}

function bottoniImportanza(wrapper: ReturnType<typeof monta>['wrapper']) {
  return wrapper.get('[role="group"]').findAll('button')
}

describe('riga dell\'importanza', () => {
  it('mostra i pulsanti 0, 1, 2 e 3 in un gruppo con un nome', () => {
    const { wrapper } = monta()
    const gruppo = wrapper.get('[role="group"]')
    expect(gruppo.attributes('aria-label')).toBe('Importanza')
    expect(bottoniImportanza(wrapper).map((b) => b.text())).toEqual(['0', '1', '2', '3'])
    for (const bottone of bottoniImportanza(wrapper)) {
      expect(bottone.attributes('type')).toBe('button')
    }
  })

  it.each([0, 1, 2, 3])('segna come selezionato il valore attuale %i', (importanza) => {
    const { wrapper } = monta({ importanza })
    const bottoni = bottoniImportanza(wrapper)
    bottoni.forEach((bottone, valore) => {
      const selezionato = valore === importanza
      expect(bottone.attributes('aria-pressed')).toBe(String(selezionato))
      expect(bottone.classes('importanza-scelta')).toBe(selezionato)
    })
  })

  it('con la conferma aperta i pulsanti 0–3 sono disabilitati e non emettono nulla', async () => {
    const { wrapper } = monta({ importanza: 2, confermaAperta: true })
    for (const bottone of bottoniImportanza(wrapper)) {
      expect(bottone.attributes('disabled')).toBeDefined()
      await bottone.trigger('click')
    }
    expect(wrapper.emitted('scegli')).toBeUndefined()
    expect(wrapper.emitted('chiediRimozione')).toBeUndefined()
  })

  it('con la conferma chiusa i pulsanti 0–3 sono attivi', () => {
    const { wrapper } = monta({ confermaAperta: false })
    for (const bottone of bottoniImportanza(wrapper)) {
      expect(bottone.attributes('disabled')).toBeUndefined()
    }
  })

  it.each([1, 2, 3])('toccare %i emette la scelta di quel valore', async (valore) => {
    const { wrapper } = monta({ importanza: 2 })
    await bottoniImportanza(wrapper)[valore].trigger('click')
    expect(wrapper.emitted('scegli')).toEqual([[valore]])
    expect(wrapper.emitted('chiediRimozione')).toBeUndefined()
  })

  it('toccare 0 emette la richiesta di rimozione, senza scegliere né confermare', async () => {
    const { wrapper, confirm } = monta({ importanza: 2 })
    await bottoniImportanza(wrapper)[0].trigger('click')
    expect(wrapper.emitted('chiediRimozione')).toEqual([[]])
    expect(wrapper.emitted('scegli')).toBeUndefined()
    expect(wrapper.emitted('confermaRimozione')).toBeUndefined()
    expect(confirm).not.toHaveBeenCalled()
  })

  it('non cambia da sé il valore selezionato: lo decide chi lo usa', async () => {
    const { wrapper } = monta({ importanza: 2 })
    await bottoniImportanza(wrapper)[3].trigger('click')
    expect(bottoniImportanza(wrapper)[2].attributes('aria-pressed')).toBe('true')
    expect(bottoniImportanza(wrapper)[3].attributes('aria-pressed')).toBe('false')
  })

  it('con la conferma chiusa non la mostra', () => {
    const { wrapper } = monta({ confermaAperta: false })
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain(messaggio)
  })

  it('con la conferma aperta la mostra dentro la pagina, con il messaggio ricevuto', () => {
    const { wrapper, confirm } = monta({
      confermaAperta: true,
      messaggio: "Togliere il vocabolo dall'allenamento?",
    })
    const conferma = wrapper.get('[role="alertdialog"]')
    expect(conferma.text()).toContain("Togliere il vocabolo dall'allenamento?")
    const etichetta = conferma.get(`#${conferma.attributes('aria-labelledby')}`)
    expect(etichetta.text()).toBe("Togliere il vocabolo dall'allenamento?")
    expect(conferma.findAll('button').map((b) => b.text())).toEqual(['Togli', 'Annulla'])
    expect(confirm).not.toHaveBeenCalled()
  })

  it('"Togli" emette la conferma della rimozione', async () => {
    const { wrapper } = monta({ confermaAperta: true })
    const togli = wrapper.get('[role="alertdialog"]').findAll('button')[0]
    expect(togli.attributes('type')).toBe('button')
    await togli.trigger('click')
    expect(wrapper.emitted('confermaRimozione')).toEqual([[]])
    expect(wrapper.emitted('annullaRimozione')).toBeUndefined()
  })

  it('"Annulla" emette l\'annullamento della rimozione', async () => {
    const { wrapper } = monta({ confermaAperta: true })
    const annulla = wrapper.get('[role="alertdialog"]').findAll('button')[1]
    expect(annulla.attributes('type')).toBe('button')
    await annulla.trigger('click')
    expect(wrapper.emitted('annullaRimozione')).toEqual([[]])
    expect(wrapper.emitted('confermaRimozione')).toBeUndefined()
  })

  it('usa i bottoni esistenti per la conferma, senza il bottone principale nella riga', () => {
    const { wrapper } = monta({ confermaAperta: true })
    const [togli, annulla] = wrapper.get('[role="alertdialog"]').findAll('button')
    expect(togli.classes()).toContain('bottone')
    expect(annulla.classes()).toContain('bottone')
    expect(wrapper.find('[role="group"] .bottone-principale').exists()).toBe(false)
  })
})
