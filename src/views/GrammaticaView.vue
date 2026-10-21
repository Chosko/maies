<script setup lang="ts">
import { catalogo as catalogoApp } from '../contenuti/catalogo'
import type { Catalogo } from '../contenuti/catalogo'
import { elenco } from '../grammatica/elenco'

const props = withDefaults(defineProps<{ catalogo?: Catalogo }>(), {
  catalogo: () => catalogoApp,
})

// Calcolato a ogni montaggio, dal catalogo: nulla viene salvato.
const voci = elenco(props.catalogo.lezioni)
</script>

<template>
  <main class="schermata">
    <h1 class="titolo-schermata">Grammatica</h1>

    <div v-if="voci.length === 0" class="esercizio-vuoto grammatica-vuota">
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
            <path d="M5 6h14" />
            <path d="M5 12h14" />
            <path d="M5 18h9" />
          </svg>
        </span>
        <h2 class="esercizio-vuoto-titolo">Ancora nessuna scheda di grammatica</h2>
        <p class="esercizio-vuoto-testo">
          Le schede compaiono qui quando arriva il materiale di una lezione.
        </p>
      </section>
    </div>

    <div v-else class="grammatica-elenco">
      <a
        v-for="voce in voci"
        :key="voce.id"
        :href="`#/grammatica/${voce.id}`"
        class="carta grammatica-voce"
      >
        <div class="grammatica-voce-testo">
          <span class="grammatica-voce-titolo">{{ voce.title }}</span>
          <span v-for="(scheda, i) in voce.schede" :key="i" class="grammatica-voce-scheda">{{
            scheda
          }}</span>
        </div>
        <span class="grammatica-voce-apri" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </a>
    </div>
  </main>
</template>
