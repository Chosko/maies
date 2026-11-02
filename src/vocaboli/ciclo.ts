import { computed, reactive, readonly, ref, shallowRef } from 'vue'
import { catalogo as catalogoApp } from '../contenuti/catalogo'
import type { Catalogo, VocaboloCatalogo } from '../contenuti/catalogo'
import { creaSessione as creaSessioneApp } from '../ripasso/sessione'
import type { SessioneRipasso } from '../ripasso/sessione'
import type { Esito } from '../ripasso/apprendimento'
import type { Importanza } from '../ripasso/importanza'
import { verifica } from './verifica'

export type FaseCiclo =
  | 'in-attesa-di-risposta'
  | 'riscrittura'
  | 'esito-mostrato'
  | 'nessun-materiale'
  | 'tutti-tolti'

export interface StatoCiclo {
  readonly fase: FaseCiclo
  readonly vocabolo: VocaboloCatalogo | null
  readonly testo: string
  readonly esito: Esito | null
  readonly riscrittura: string
  readonly riscritturaRespinta: boolean
  readonly importanza: Importanza | null
  readonly confermaRimozioneAperta: boolean
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
  riscrivi(testo: string): void
  avanti(): void
  impostaImportanza(importanza: 1 | 2 | 3): void
  chiediRimozione(): void
  annullaRimozione(): void
  confermaRimozione(): void
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
  const riscrittura = ref('')
  const riscritturaRespinta = ref(false)
  const importanza = ref<Importanza | null>(null)
  const confermaRimozioneAperta = ref(false)
  const titoloLezione = computed(() =>
    vocabolo.value === null ? undefined : catalogo.lezione(vocabolo.value.idLezione)?.title,
  )

  function proponi(): void {
    const proposta = sessione?.prossimoElemento() ?? { caso: 'nessun-materiale' }
    testo.value = ''
    esito.value = null
    riscrittura.value = ''
    riscritturaRespinta.value = false
    confermaRimozioneAperta.value = false
    if (proposta.caso === 'elemento') {
      vocabolo.value = proposta.elemento
      importanza.value = proposta.importanza
      fase.value = 'in-attesa-di-risposta'
    } else {
      vocabolo.value = null
      importanza.value = null
      fase.value = proposta.caso
    }
  }

  // La scelta dell'importanza e la rimozione valgono sia nell'esito sia durante la riscrittura.
  const sceltaImportanzaAperta = () =>
    (fase.value === 'esito-mostrato' || fase.value === 'riscrittura') && !confermaRimozioneAperta.value

  return {
    stato: readonly(
      reactive({
        fase,
        vocabolo,
        testo,
        esito,
        riscrittura,
        riscritturaRespinta,
        importanza,
        confermaRimozioneAperta,
        titoloLezione,
      }),
    ) as StatoCiclo,
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
      fase.value = verificato === 'giusto' ? 'esito-mostrato' : 'riscrittura'
    },
    riscrivi(scritto) {
      if (fase.value !== 'riscrittura' || confermaRimozioneAperta.value || vocabolo.value === null) return
      // La riscrittura è un esercizio di memoria: l'esito resta quello registrato alla conferma.
      riscrittura.value = scritto
      const passata = verifica(scritto, vocabolo.value.en) === 'giusto'
      riscritturaRespinta.value = !passata
      if (passata) fase.value = 'esito-mostrato'
    },
    avanti() {
      if (fase.value !== 'esito-mostrato' || confermaRimozioneAperta.value) return
      proponi()
    },
    impostaImportanza(valore) {
      if (!sceltaImportanzaAperta()) return
      if (sessione === null || vocabolo.value === null) return
      sessione.registraImportanza(vocabolo.value.idGlobale, valore)
      importanza.value = valore
    },
    chiediRimozione() {
      if (!sceltaImportanzaAperta()) return
      confermaRimozioneAperta.value = true
    },
    annullaRimozione() {
      confermaRimozioneAperta.value = false
    },
    confermaRimozione() {
      if (!confermaRimozioneAperta.value || sessione === null || vocabolo.value === null) return
      // L'esito della risposta è già registrato dalla conferma: qui si registra solo l'importanza 0.
      sessione.registraImportanza(vocabolo.value.idGlobale, 0)
      proponi()
    },
  }
}
