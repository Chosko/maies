<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { creaCiclo as creaCicloApp } from '../vocaboli/ciclo'
import type { CicloAllenamento } from '../vocaboli/ciclo'
import { creaPronuncia } from '../vocaboli/pronuncia'
import type { Pronuncia } from '../vocaboli/pronuncia'
import { EDIZIONE } from '../edizione'
import type { Edizione } from '../edizione'
import RigaImportanza from '../components/RigaImportanza.vue'

const props = withDefaults(
  defineProps<{ creaCiclo?: () => CicloAllenamento; edizione?: Edizione; pronuncia?: Pronuncia }>(),
  {
    creaCiclo: () => creaCicloApp(),
    edizione: EDIZIONE,
    pronuncia: () => creaPronuncia(),
  },
)

// Un ciclo nuovo a ogni montaggio: uscire e rientrare apre una sessione nuova.
// L'avvio è sincrono, così la schermata non mostra mai il nessun materiale per un attimo.
const ciclo = props.creaCiclo()
ciclo.avvio()
const stato = ciclo.stato

// Il browser può caricare le voci dopo l'apertura: i pulsanti della pronuncia seguono i cambi.
const pronuncia = props.pronuncia
const pronunciaDisponibile = ref(pronuncia.disponibile())
const smettiDiAscoltare = pronuncia.quandoCambia(() => {
  pronunciaDisponibile.value = pronuncia.disponibile()
})
onBeforeUnmount(smettiDiAscoltare)

const idCampo = useId()
const idRiscrittura = useId()
const campo = ref<HTMLInputElement | null>(null)
const campoRiscrittura = ref<HTMLInputElement | null>(null)
const avanti = ref<HTMLButtonElement | null>(null)
const risposta = ref('')
const riscrittura = ref('')

// A ogni nuovo vocabolo il campo torna vuoto e riceve il fuoco, e così il campo della
// riscrittura dopo un errore; all'esito il fuoco va su "Avanti", così l'Invio che passa avanti
// è quello del pulsante e non quello che ha confermato o controllato.
watch(
  () => [stato.fase, stato.vocabolo] as const,
  async ([fase]) => {
    if (fase === 'in-attesa-di-risposta') risposta.value = ''
    if (fase === 'riscrittura') riscrittura.value = ''
    await nextTick()
    if (fase === 'in-attesa-di-risposta') campo.value?.focus()
    else if (fase === 'riscrittura') campoRiscrittura.value?.focus()
    else if (fase === 'esito-mostrato') avanti.value?.focus()
  },
  { immediate: true, flush: 'post' },
)

const ICONA_ALTOPARLANTE = {
  viewBox: '0 0 24 24',
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
} as const

function conferma(): void {
  ciclo.conferma(risposta.value)
}

// Una riscrittura respinta lascia il campo com'è e gli riporta il fuoco, per riprovare subito.
async function controlla(): Promise<void> {
  ciclo.riscrivi(riscrittura.value)
  if (stato.fase !== 'riscrittura' || !stato.riscritturaRespinta) return
  await nextTick()
  campoRiscrittura.value?.focus()
}

// Un Invio tenuto premuto non conferma né passa avanti: conta solo la pressione.
function invio(azione: () => void): (evento: KeyboardEvent) => void {
  return (evento) => {
    if (!evento.repeat) azione()
  }
}
</script>

<template>
  <main class="schermata">
    <h1 class="titolo-schermata">Vocaboli</h1>

    <div v-if="!stato.vocabolo" class="esercizio-vuoto">
      <section class="carta esercizio-vuoto-carta">
        <span class="esercizio-vuoto-icona">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="7" width="13" height="13" rx="2" />
            <path d="M8 4h11a2 2 0 0 1 2 2v11" />
          </svg>
        </span>
        <template v-if="stato.fase === 'tutti-tolti'">
          <h2 class="esercizio-vuoto-titolo">Hai tolto tutti i vocaboli dall'allenamento</h2>
          <p class="esercizio-vuoto-testo">
            I vocaboli nuovi compaiono qui quando arriva il materiale di un'altra lezione.
          </p>
        </template>
        <template v-else>
          <h2 class="esercizio-vuoto-titolo">Ancora nessun vocabolo su cui allenarti</h2>
          <p class="esercizio-vuoto-testo">
            I vocaboli compaiono qui quando arriva il materiale di una lezione.
          </p>
        </template>
      </section>
    </div>

    <template v-else-if="stato.fase === 'in-attesa-di-risposta'">
      <div class="carta-pila">
        <div class="carta-dietro" aria-hidden="true"></div>
        <article class="carta">
          <div class="vocabolo-domanda">
            <span v-if="stato.titoloLezione" class="esercizio-lezione">{{
              stato.titoloLezione
            }}</span>
            <p class="vocabolo-parola">{{ stato.vocabolo.it }}</p>
          </div>
          <div class="esercizio-divisore" aria-hidden="true"></div>
          <div class="esercizio-campo">
            <label :for="idCampo" class="etichetta">Traduzione inglese</label>
            <input
              :id="idCampo"
              ref="campo"
              v-model="risposta"
              class="campo"
              type="text"
              lang="en"
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              placeholder="Scrivi in inglese"
              @keydown.enter.prevent="invio(conferma)($event)"
            />
          </div>
        </article>
      </div>

      <button
        type="button"
        class="bottone bottone-principale esercizio-azione"
        @click="conferma"
      >
        Conferma
      </button>
    </template>

    <template v-else>
      <div class="carta-pila">
        <div class="carta-dietro" aria-hidden="true"></div>
        <article
          class="carta vocabolo-carta-esito"
          :class="{ 'vocabolo-carta-sbagliata': stato.esito === 'sbagliato' }"
        >
          <div
            class="vocabolo-esito"
            :class="stato.esito === 'giusto' ? 'vocabolo-esito-giusto' : 'vocabolo-esito-sbagliato'"
          >
            <span class="vocabolo-esito-icona">
              <svg
                v-if="stato.esito === 'giusto'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              <svg
                v-else
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M7 7l10 10" />
                <path d="M17 7L7 17" />
              </svg>
            </span>
            <span class="vocabolo-esito-parola">{{
              stato.esito === 'giusto' ? 'Giusta' : 'Sbagliata'
            }}</span>
          </div>
          <div class="vocabolo-domanda vocabolo-domanda-esito">
            <span v-if="stato.titoloLezione" class="esercizio-lezione">{{
              stato.titoloLezione
            }}</span>
            <p class="vocabolo-parola vocabolo-parola-esito">{{ stato.vocabolo.it }}</p>
          </div>
          <div class="esercizio-divisore" aria-hidden="true"></div>
          <div class="vocabolo-risposta">
            <div class="etichetta">La tua risposta</div>
            <p lang="en" class="vocabolo-risposta-sara">{{ stato.testo }}</p>
          </div>
          <div class="vocabolo-risposta">
            <div class="etichetta">Traduzione</div>
            <div class="vocabolo-ascoltabile">
              <p lang="en" class="vocabolo-traduzione">{{ stato.vocabolo.en[0] }}</p>
              <button
                v-if="pronunciaDisponibile"
                type="button"
                class="cerchio-icona vocabolo-ascolta"
                aria-label="Ascolta la traduzione"
                @click="pronuncia.leggi(stato.vocabolo.en[0])"
              >
                <svg v-bind="ICONA_ALTOPARLANTE" aria-hidden="true">
                  <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
                  <path d="M15.5 9a4 4 0 0 1 0 6" />
                  <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
                </svg>
              </button>
            </div>
          </div>
          <div v-if="stato.vocabolo.en.length > 1" class="vocabolo-risposta">
            <div class="etichetta">Accettata anche</div>
            <p
              v-for="alternativa in stato.vocabolo.en.slice(1)"
              :key="alternativa"
              lang="en"
              class="vocabolo-alternativa"
            >
              {{ alternativa }}
            </p>
          </div>
          <div v-if="stato.fase === 'riscrittura'" class="esercizio-campo vocabolo-riscrittura">
            <label :for="idRiscrittura" class="etichetta">Riscrivi la traduzione</label>
            <input
              :id="idRiscrittura"
              ref="campoRiscrittura"
              v-model="riscrittura"
              class="campo vocabolo-riscrittura-campo"
              type="text"
              lang="en"
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              @keydown.enter.prevent="invio(controlla)($event)"
            />
            <p v-if="stato.riscritturaRespinta" role="alert" class="vocabolo-riscrittura-avviso">
              Non è ancora giusta: riprova.
            </p>
          </div>
          <div v-if="stato.vocabolo.example" class="vocabolo-risposta">
            <div class="etichetta">Esempio</div>
            <div class="vocabolo-ascoltabile">
              <p lang="en" class="vocabolo-esempio">{{ stato.vocabolo.example }}</p>
              <button
                v-if="pronunciaDisponibile"
                type="button"
                class="cerchio-icona vocabolo-ascolta"
                aria-label="Ascolta la frase d'esempio"
                @click="pronuncia.leggi(stato.vocabolo.example)"
              >
                <svg v-bind="ICONA_ALTOPARLANTE" aria-hidden="true">
                  <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
                  <path d="M15.5 9a4 4 0 0 1 0 6" />
                  <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
                </svg>
              </button>
            </div>
          </div>
          <div v-if="stato.vocabolo.mnemonic" class="vocabolo-risposta">
            <div class="etichetta">Trucco per ricordare</div>
            <p class="vocabolo-trucco">{{ stato.vocabolo.mnemonic }}</p>
          </div>
        </article>
      </div>

      <button
        v-if="stato.fase === 'riscrittura'"
        type="button"
        class="bottone bottone-principale esercizio-azione"
        @click="controlla"
      >
        Controlla
      </button>

      <button
        v-else
        ref="avanti"
        type="button"
        class="bottone bottone-principale esercizio-azione"
        @click="ciclo.avanti()"
        @keydown.enter.prevent="invio(ciclo.avanti)($event)"
      >
        Avanti
      </button>

      <RigaImportanza
        v-if="props.edizione === 'principale' && stato.importanza !== null"
        :importanza="stato.importanza"
        :conferma-aperta="stato.confermaRimozioneAperta"
        messaggio="Togliere il vocabolo dall'allenamento?"
        @scegli="ciclo.impostaImportanza"
        @chiedi-rimozione="ciclo.chiediRimozione"
        @annulla-rimozione="ciclo.annullaRimozione"
        @conferma-rimozione="ciclo.confermaRimozione"
      />
    </template>
  </main>
</template>
