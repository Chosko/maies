<script setup lang="ts">
import { nextTick, ref, useId, watch } from 'vue'
import { creaCiclo as creaCicloApp } from '../vocaboli/ciclo'
import type { CicloAllenamento } from '../vocaboli/ciclo'
import { EDIZIONE } from '../edizione'
import type { Edizione } from '../edizione'
import RigaImportanza from '../components/RigaImportanza.vue'

const props = withDefaults(
  defineProps<{ creaCiclo?: () => CicloAllenamento; edizione?: Edizione }>(),
  {
    creaCiclo: () => creaCicloApp(),
    edizione: EDIZIONE,
  },
)

// Un ciclo nuovo a ogni montaggio: uscire e rientrare apre una sessione nuova.
// L'avvio è sincrono, così la schermata non mostra mai il nessun materiale per un attimo.
const ciclo = props.creaCiclo()
ciclo.avvio()
const stato = ciclo.stato

const idCampo = useId()
const campo = ref<HTMLInputElement | null>(null)
const avanti = ref<HTMLButtonElement | null>(null)
const risposta = ref('')

// A ogni nuovo vocabolo il campo torna vuoto e riceve il fuoco; all'esito il fuoco va su
// "Avanti", così l'Invio che passa avanti è quello del pulsante e non quello che ha confermato.
watch(
  () => [stato.fase, stato.vocabolo] as const,
  async ([fase]) => {
    if (fase === 'in-attesa-di-risposta') risposta.value = ''
    await nextTick()
    if (fase === 'in-attesa-di-risposta') campo.value?.focus()
    else if (fase === 'esito-mostrato') avanti.value?.focus()
  },
  { immediate: true, flush: 'post' },
)

function conferma(): void {
  ciclo.conferma(risposta.value)
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
            <p lang="en" class="vocabolo-traduzione">{{ stato.vocabolo.en[0] }}</p>
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
        </article>
      </div>

      <button
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
