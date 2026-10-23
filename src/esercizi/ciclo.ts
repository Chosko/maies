import { computed, reactive, readonly, ref, shallowRef } from 'vue'
import { catalogo as catalogoApp } from '../contenuti/catalogo'
import type { Catalogo, FraseCatalogo } from '../contenuti/catalogo'
import { creaSessione as creaSessioneApp } from '../ripasso/sessione'
import type { SessioneRipasso } from '../ripasso/sessione'
import type { Esito } from '../ripasso/livelli'

export type FaseCiclo = 'in-attesa-di-risposta' | 'soluzione-mostrata' | 'nessun-materiale'

export type Autovalutazione = 'giusta' | 'sbagliata'

export interface StatoCiclo {
  readonly fase: FaseCiclo
  readonly frase: FraseCatalogo | null
  readonly testo: string
  readonly titoloLezione: string | undefined
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
}

const ESITI: Record<Autovalutazione, Esito> = { giusta: 'giusto', sbagliata: 'sbagliato' }

export function creaCiclo(opzioni: OpzioniCiclo = {}): CicloEsercizio {
  const creaSessione: CreaSessioneFrasi = opzioni.creaSessione ?? creaSessioneApp
  const catalogo = opzioni.catalogo ?? catalogoApp

  let sessione: SessioneRipasso<FraseCatalogo> | null = null
  // Prima di avvio non c'è una frase da proporre: le azioni di risposta non hanno effetto.
  const fase = ref<FaseCiclo>('nessun-materiale')
  const frase = shallowRef<FraseCatalogo | null>(null)
  const testo = ref('')
  const titoloLezione = computed(() =>
    frase.value === null ? undefined : catalogo.lezione(frase.value.idLezione)?.title,
  )

  function proponi(): void {
    const proposta = sessione?.prossimoElemento()
    // Nessun materiale e tutti tolti portano entrambi alla fase "nessun materiale".
    frase.value = proposta?.caso === 'elemento' ? proposta.elemento : null
    testo.value = ''
    fase.value = frase.value === null ? 'nessun-materiale' : 'in-attesa-di-risposta'
  }

  return {
    stato: readonly(reactive({ fase, frase, testo, titoloLezione })) as StatoCiclo,
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
      if (fase.value !== 'soluzione-mostrata' || sessione === null || frase.value === null) return
      sessione.registraEsito(frase.value.idGlobale, ESITI[valutazione])
      proponi()
    },
  }
}
