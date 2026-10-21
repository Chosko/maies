import { computed, reactive, readonly, ref, shallowRef } from 'vue'
import { catalogo as catalogoApp } from '../contenuti/catalogo'
import type { Catalogo, VocaboloCatalogo } from '../contenuti/catalogo'
import { creaSessione as creaSessioneApp } from '../ripasso/sessione'
import type { SessioneRipasso } from '../ripasso/sessione'
import type { Esito } from '../ripasso/livelli'
import { verifica } from './verifica'

export type FaseCiclo = 'in-attesa-di-risposta' | 'esito-mostrato' | 'nessun-materiale'

export interface StatoCiclo {
  readonly fase: FaseCiclo
  readonly vocabolo: VocaboloCatalogo | null
  readonly testo: string
  readonly esito: Esito | null
  readonly titoloLezione: string | undefined
}

export type CreaSessioneVocaboli = (tipo: 'vocaboli') => SessioneRipasso<VocaboloCatalogo>

export interface OpzioniCiclo {
  creaSessione?: CreaSessioneVocaboli
  catalogo?: Catalogo
}

export interface CicloAllenamento {
  readonly stato: StatoCiclo
  avvio(): void
  conferma(testo: string): void
  avanti(): void
}

export function creaCiclo(opzioni: OpzioniCiclo = {}): CicloAllenamento {
  const creaSessione: CreaSessioneVocaboli = opzioni.creaSessione ?? creaSessioneApp
  const catalogo = opzioni.catalogo ?? catalogoApp

  let sessione: SessioneRipasso<VocaboloCatalogo> | null = null
  // Prima di avvio non c'è un vocabolo da proporre: le azioni di risposta non hanno effetto.
  const fase = ref<FaseCiclo>('nessun-materiale')
  const vocabolo = shallowRef<VocaboloCatalogo | null>(null)
  const testo = ref('')
  const esito = ref<Esito | null>(null)
  const titoloLezione = computed(() =>
    vocabolo.value === null ? undefined : catalogo.lezione(vocabolo.value.idLezione)?.title,
  )

  function proponi(): void {
    vocabolo.value = sessione?.prossimoElemento() ?? null
    testo.value = ''
    esito.value = null
    fase.value = vocabolo.value === null ? 'nessun-materiale' : 'in-attesa-di-risposta'
  }

  return {
    stato: readonly(reactive({ fase, vocabolo, testo, esito, titoloLezione })) as StatoCiclo,
    avvio() {
      sessione = creaSessione('vocaboli')
      proponi()
    },
    conferma(risposta) {
      if (fase.value !== 'in-attesa-di-risposta' || sessione === null || vocabolo.value === null) return
      const verificato = verifica(risposta, vocabolo.value.en)
      sessione.registraEsito(vocabolo.value.idGlobale, verificato)
      testo.value = risposta
      esito.value = verificato
      fase.value = 'esito-mostrato'
    },
    avanti() {
      if (fase.value !== 'esito-mostrato') return
      proponi()
    },
  }
}
