<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { catalogo as catalogoApp } from '../contenuti/catalogo'
import type { Catalogo } from '../contenuti/catalogo'
import { voci } from '../dizionario/voci'
import { filtra } from '../dizionario/filtro'

const props = withDefaults(defineProps<{ catalogo?: Catalogo }>(), {
  catalogo: () => catalogoApp,
})

// Le voci si calcolano una volta al montaggio; uscire e rientrare riparte con il campo vuoto.
const elenco = voci(props.catalogo.vocaboli)
const cercato = ref('')
const mostrate = computed(() => filtra(elenco, cercato.value))

const idCampo = useId()
</script>

<template>
  <main class="schermata dizionario">
    <h1 class="titolo-schermata">Dizionario</h1>

    <div v-if="elenco.length === 0" class="esercizio-vuoto">
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
            <path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z" />
            <path d="M5 17a3 3 0 0 1 3-3h10" />
          </svg>
        </span>
        <h2 class="esercizio-vuoto-titolo">Ancora nessun vocabolo</h2>
        <p class="esercizio-vuoto-testo">
          I vocaboli compaiono qui quando arriva il materiale di una lezione.
        </p>
      </section>
    </div>

    <template v-else>
      <div class="dizionario-ricerca">
        <label :for="idCampo" class="dizionario-etichetta">Cerca un vocabolo</label>
        <span class="dizionario-lente" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
        </span>
        <input
          :id="idCampo"
          v-model="cercato"
          class="dizionario-campo"
          type="search"
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          placeholder="Cerca in italiano o in inglese"
        />
      </div>

      <section class="carta dizionario-lista" aria-label="Vocaboli">
        <div v-for="voce in mostrate" :key="voce.idGlobale" class="dizionario-voce">
          <span class="dizionario-voce-it">{{ voce.it }}</span>
          <span lang="en" class="dizionario-voce-en"
            ><span class="dizionario-voce-principale">{{ voce.en[0] }}</span
            ><span v-if="voce.en.length > 1" class="dizionario-voce-altre">{{
              ', ' + voce.en.slice(1).join(', ')
            }}</span></span
          >
        </div>

        <div v-if="mostrate.length === 0" class="dizionario-nessun-risultato">
          <span class="dizionario-nessun-risultato-icona">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
          </span>
          <p class="dizionario-nessun-risultato-titolo">Nessun vocabolo contiene “{{ cercato }}”</p>
          <p class="dizionario-nessun-risultato-testo">Controlla come l’hai scritto.</p>
        </div>
      </section>
    </template>
  </main>
</template>
