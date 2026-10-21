import { describe, it, expect } from 'vitest'
import { verifica } from '../src/vocaboli/verifica'

describe('verifica', () => {
  describe('corrispondenza esatta', () => {
    it('è giusta con la prima traduzione', () => {
      expect(verifica('peach', ['peach', 'peach tree'])).toBe('giusto')
    })

    it('è giusta con una traduzione successiva', () => {
      expect(verifica('peach tree', ['peach', 'peach tree'])).toBe('giusto')
    })

    it('è sbagliata quando nessuna traduzione coincide', () => {
      expect(verifica('apple', ['peach', 'peach tree'])).toBe('sbagliato')
    })

    it('è sbagliata senza traduzioni accettate', () => {
      expect(verifica('peach', [])).toBe('sbagliato')
    })
  })

  describe('maiuscole', () => {
    it.each([
      ['Peach', ['peach']],
      ['PEACH', ['peach']],
      ['peach', ['Peach']],
      ['I Am Here', ['i am here']],
    ])('%s con %j è giusta', (risposta, traduzioni) => {
      expect(verifica(risposta, traduzioni)).toBe('giusto')
    })
  })

  describe('spazi', () => {
    it.each([
      ['  peach', ['peach']],
      ['peach   ', ['peach']],
      ['\tpeach\n', ['peach']],
      ['peach    tree', ['peach tree']],
      ['peach tree', ['  peach   tree ']],
      ['  i   am  here  ', ['i am here']],
    ])('%j con %j è giusta', (risposta, traduzioni) => {
      expect(verifica(risposta, traduzioni)).toBe('giusto')
    })

    it('uno spazio interno non si toglie', () => {
      expect(verifica('peachtree', ['peach tree'])).toBe('sbagliato')
    })
  })

  describe('apostrofi tipografici', () => {
    const tipografici = ['’', '‘', 'ʼ']

    it.each(tipografici)('%s nella risposta vale come apostrofo semplice', (apostrofo) => {
      expect(verifica(`I${apostrofo}m here`, ["I'm here"])).toBe('giusto')
    })

    it.each(tipografici)('%s nella traduzione vale come apostrofo semplice', (apostrofo) => {
      expect(verifica("I'm here", [`I${apostrofo}m here`])).toBe('giusto')
    })

    it('apostrofi tipografici diversi nelle due parti coincidono', () => {
      expect(verifica('I’m here', ['Iʼm here'])).toBe('giusto')
    })

    it('un apostrofo mancante fa la differenza', () => {
      expect(verifica('Im here', ["I'm here"])).toBe('sbagliato')
    })
  })

  describe('punteggiatura finale', () => {
    const segni = ['.', '!', '?', ',', ';', ':']

    it.each(segni)('%s finale nella risposta si toglie', (segno) => {
      expect(verifica(`peach${segno}`, ['peach'])).toBe('giusto')
    })

    it.each(segni)('%s finale nella traduzione si toglie', (segno) => {
      expect(verifica('peach', [`peach${segno}`])).toBe('giusto')
    })

    it.each(segni)('%s finale preceduto da spazi si toglie con gli spazi', (segno) => {
      expect(verifica(`peach   ${segno}`, ['peach'])).toBe('giusto')
    })

    it.each([
      ['peach!!'],
      ['peach?!'],
      ['peach ?.'],
      ['peach . ! ?  '],
      ['peach...'],
    ])('%j: la punteggiatura finale ripetuta si toglie tutta', (risposta) => {
      expect(verifica(risposta, ['peach'])).toBe('giusto')
    })

    it('con la punteggiatura finale in entrambe le parti è giusta', () => {
      expect(verifica('Where are you?', ['Where are you!'])).toBe('giusto')
    })
  })

  describe('punteggiatura non finale', () => {
    it.each([
      ['yes, please', ['yes please']],
      ['yes please', ['yes, please']],
      ['well. done', ['well done']],
      ['what? no', ['what no']],
      ['.peach', ['peach']],
    ])('%j con %j è sbagliata', (risposta, traduzioni) => {
      expect(verifica(risposta, traduzioni)).toBe('sbagliato')
    })

    it('resta e deve coincidere', () => {
      expect(verifica('yes, please!', ['Yes, please'])).toBe('giusto')
    })
  })

  describe('nient’altro si normalizza', () => {
    it.each([
      ['articolo in più', 'the peach', ['peach']],
      ['articolo mancante', 'peach', ['the peach']],
      ['accento diverso', 'cafe', ['café']],
      ['accento in più', 'café', ['cafe']],
      ['trattino al posto dello spazio', 'ice-cream', ['ice cream']],
      ['spazio al posto del trattino', 'ice cream', ['ice-cream']],
      ['parola mancante', 'I here', ['I am here']],
      ['parola in più', 'I am here now', ['I am here']],
      ['refuso', 'paech', ['peach']],
    ])('%s: %j con %j è sbagliata', (_caso, risposta, traduzioni) => {
      expect(verifica(risposta, traduzioni)).toBe('sbagliato')
    })
  })

  describe('risposta vuota', () => {
    it.each([[''], ['   '], ['\t\n'], ['.'], ['!?'], [' . ; '], [':']])(
      '%j è sbagliata',
      (risposta) => {
        expect(verifica(risposta, ['peach'])).toBe('sbagliato')
      },
    )

    it.each([[''], ['   '], ['?!']])(
      '%j è sbagliata anche se una traduzione si normalizza a vuoto',
      (risposta) => {
        expect(verifica(risposta, ['peach', '', ' . '])).toBe('sbagliato')
      },
    )
  })
})
