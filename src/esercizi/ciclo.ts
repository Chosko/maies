import { computed, reactive, readonly, ref, shallowRef } from 'vue'
import { catalogo as catalogoApp } from '../contenuti/catalogo'
import type { Catalogo, FraseCatalogo } from '../contenuti/catalogo'
import { creaSessione as creaSessioneApp } from '../ripasso/sessione'
import type { SessioneRipasso } from '../ripasso/sessione'
import type { Importanza } from '../ripasso/importanza'
import type { Esito } from '../ripasso/livelli'

export type FaseCiclo = 'in-attesa-di-risposta' | 'soluzione-mostrata' | 'nessun-materiale' | 'tutti-tolti'

export type ImportanzaScelta = Exclude<Importanza, 0>

export type Autovalutazione = 'giusta' | 'sbagliata'

export interface StatoCiclo {
  readonly fase: FaseCiclo
  readonly frase: FraseCatalogo | null
  readonly testo: string
  readonly titoloLezione: string | undefined
  readonly importanza: Importanza | null
  readonly confermaRimozioneAperta: boolean
}

export type CreaSessioneFrasi = (tipo: 'frasi') => SessioneRipasso<FraseCatalogo>

export interface OpzioniCiclo {
  creaSessione?: CreaSessioneFrasi
  catalogo?: Catalogo
}

export interface CicloEsercizio {
  readonly stato: StatoCiclo
  avvio(): void
  conferma(testo: string): void
  segna(valutazione: Autovalutazione): void
  impostaImportanza(importanza: ImportanzaScelta): void
  chiediRimozione(): void
  annullaRimozione(): void
  confermaRimozione(): void
}

const ESITI: Record<Autovalutazione, Esito> = { giusta: 'giusto', sbagliata: 'sbagliato' }

const IMPORTANZE_SCELTE: readonly unknown[] = [1, 2, 3] satisfies ImportanzaScelta[]

export function creaCiclo(opzioni: OpzioniCiclo = {}): CicloEsercizio {
  const creaSessione: CreaSessioneFrasi = opzioni.creaSessione ?? creaSessioneApp
  const catalogo = opzioni.catalogo ?? catalogoApp

  let sessione: SessioneRipasso<FraseCatalogo> | null = null
  // Prima di avvio non c'è una frase da proporre: le azioni di risposta non hanno effetto.
  const fase = ref<FaseCiclo>('nessun-materiale')
  const frase = shallowRef<FraseCatalogo | null>(null)
  const testo = ref('')
  const importanza = ref<Importanza | null>(null)
  const confermaRimozioneAperta = ref(false)
  const titoloLezione = computed(() =>
    frase.value === null ? undefined : catalogo.lezione(frase.value.idLezione)?.title,
  )

  function proponi(): void {
    const proposta = sessione?.prossimoElemento() ?? { caso: 'nessun-materiale' as const }
    testo.value = ''
    confermaRimozioneAperta.value = false
    if (proposta.caso === 'elemento') {
      frase.value = proposta.elemento
      importanza.value = proposta.importanza
      fase.value = 'in-attesa-di-risposta'
    } else {
      frase.value = null
      importanza.value = null
      fase.value = proposta.caso
    }
  }

  // La sessione e la frase su cui agiscono le azioni della soluzione, solo mentre la soluzione è mostrata.
  function soluzione(): { sessione: SessioneRipasso<FraseCatalogo>; idGlobale: string } | null {
    if (fase.value !== 'soluzione-mostrata' || sessione === null || frase.value === null) return null
    return { sessione, idGlobale: frase.value.idGlobale }
  }

  return {
    stato: readonly(
      reactive({ fase, frase, testo, titoloLezione, importanza, confermaRimozioneAperta }),
    ) as StatoCiclo,
    avvio() {
      sessione = creaSessione('frasi')
      proponi()
    },
    conferma(risposta) {
      if (fase.value !== 'in-attesa-di-risposta') return
      testo.value = risposta
      fase.value = 'soluzione-mostrata'
    },
    segna(valutazione) {
      const attuale = soluzione()
      if (attuale === null || confermaRimozioneAperta.value) return
      attuale.sessione.registraEsito(attuale.idGlobale, ESITI[valutazione])
      proponi()
    },
    impostaImportanza(scelta) {
      const attuale = soluzione()
      if (attuale === null || confermaRimozioneAperta.value || !IMPORTANZE_SCELTE.includes(scelta)) return
      attuale.sessione.registraImportanza(attuale.idGlobale, scelta)
      importanza.value = scelta
    },
    chiediRimozione() {
      if (soluzione() === null || confermaRimozioneAperta.value) return
      confermaRimozioneAperta.value = true
    },
    annullaRimozione() {
      confermaRimozioneAperta.value = false
    },
    confermaRimozione() {
      const attuale = soluzione()
      if (attuale === null || !confermaRimozioneAperta.value) return
      attuale.sessione.registraImportanza(attuale.idGlobale, 0)
      proponi()
    },
  }
}
