<script setup lang="ts">
import { nextTick, ref, useId, watch } from 'vue'
import { creaCiclo as creaCicloApp } from '../esercizi/ciclo'
import type { CicloEsercizio } from '../esercizi/ciclo'

const props = withDefaults(defineProps<{ creaCiclo?: () => CicloEsercizio }>(), {
  creaCiclo: () => creaCicloApp(),
})

// Un ciclo nuovo a ogni montaggio: uscire e rientrare apre una sessione nuova.
// L'avvio è sincrono, così la schermata non mostra mai il nessun materiale per un attimo.
const ciclo = props.creaCiclo()
ciclo.avvio()
const stato = ciclo.stato

const idCampo = useId()
const campo = ref<HTMLInputElement | null>(null)
const risposta = ref('')

// A ogni nuova frase il campo torna vuoto e riceve il fuoco.
watch(
  () => [stato.fase, stato.frase] as const,
  async ([fase]) => {
    if (fase !== 'in-attesa-di-risposta') return
    risposta.value = ''
    await nextTick()
    campo.value?.focus()
  },
  { immediate: true, flush: 'post' },
)

function conferma(): void {
  ciclo.conferma(risposta.value)
}
</script>

<template>
  <main class="schermata">
    <h1 class="titolo-schermata">Esercizi</h1>

    <div v-if="stato.fase === 'nessun-materiale' || !stato.frase" class="esercizio-vuoto">
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
            <path d="M4 20h4L19 9l-4-4L4 16v4z" />
            <path d="M14 6l4 4" />
          </svg>
        </span>
        <h2 class="esercizio-vuoto-titolo">Ancora nessuna frase da tradurre</h2>
        <p class="esercizio-vuoto-testo">
          Le frasi compaiono qui quando arriva il materiale di una lezione.
        </p>
      </section>
    </div>

    <template v-else>
      <div class="carta-pila">
        <div class="carta-dietro" aria-hidden="true"></div>
        <article class="carta">
          <div class="esercizio-domanda">
            <span v-if="stato.titoloLezione" class="esercizio-lezione">{{
              stato.titoloLezione
            }}</span>
            <p class="esercizio-frase">{{ stato.frase.it }}</p>
          </div>
          <div class="esercizio-divisore" aria-hidden="true"></div>

          <div v-if="stato.fase === 'in-attesa-di-risposta'" class="esercizio-campo">
            <label :for="idCampo" class="etichetta">La tua traduzione</label>
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
              @keydown.enter.prevent="conferma"
            />
          </div>

          <div v-else class="esercizio-risposte">
            <div class="esercizio-risposta">
              <div class="etichetta">La tua risposta</div>
              <p lang="en" class="esercizio-risposta-sara">{{ stato.testo }}</p>
            </div>
            <div class="esercizio-risposta">
              <div class="etichetta">Corretta</div>
              <p lang="en" class="esercizio-corretta">{{ stato.frase.en }}</p>
              <template v-if="stato.frase.alternatives.length > 0">
                <div class="etichetta esercizio-varianti-etichetta">Va bene anche</div>
                <p
                  v-for="variante in stato.frase.alternatives"
                  :key="variante"
                  lang="en"
                  class="esercizio-variante"
                >
                  {{ variante }}
                </p>
              </template>
            </div>
          </div>
        </article>
      </div>

      <button
        v-if="stato.fase === 'in-attesa-di-risposta'"
        type="button"
        class="bottone bottone-principale esercizio-azione"
        @click="conferma"
      >
        Conferma
      </button>

      <div v-else class="esercizio-esito">
        <p class="esercizio-esito-domanda">Com’era la tua risposta?</p>
        <div class="esercizio-esito-bottoni">
          <button type="button" class="bottone bottone-secondario" @click="ciclo.segna('sbagliata')">
            Sbagliata
          </button>
          <button type="button" class="bottone bottone-principale" @click="ciclo.segna('giusta')">
            Giusta
          </button>
        </div>
      </div>
    </template>
  </main>
</template>
