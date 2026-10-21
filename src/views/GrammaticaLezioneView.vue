<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { catalogo as catalogoApp } from '../contenuti/catalogo'
import type { Catalogo } from '../contenuti/catalogo'
import { html } from '../grammatica/markdown'

const props = withDefaults(defineProps<{ catalogo?: Catalogo }>(), {
  catalogo: () => catalogoApp,
})

const route = useRoute()

// L'id della lezione vive nell'indirizzo: la pagina segue i suoi cambi.
const id = computed(() => String(route.params.id))
const lezione = computed(() => props.catalogo.lezione(id.value))
const schede = computed(() =>
  [...(lezione.value?.grammar ?? [])]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((scheda) => ({ id: scheda.id, title: scheda.title, html: html(scheda.body) })),
)

// All'ingresso e a ogni cambio di lezione la pagina parte dall'inizio.
watch(id, () => window.scrollTo(0, 0), { immediate: true })
</script>

<template>
  <main class="schermata grammatica-lezione">
    <header class="grammatica-lezione-testata">
      <RouterLink
        to="/grammatica"
        class="cerchio-icona"
        aria-label="Torna all’elenco della grammatica"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </RouterLink>
      <h1 class="titolo-schermata">{{ lezione ? lezione.title : 'Grammatica' }}</h1>
      <span aria-hidden="true"></span>
    </header>

    <div v-if="!lezione || schede.length === 0" class="esercizio-vuoto">
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
        <template v-if="!lezione">
          <h2 class="esercizio-vuoto-titolo">Questa lezione non esiste</h2>
          <p class="esercizio-vuoto-testo">
            Torna all’elenco della grammatica e scegli una delle lezioni.
          </p>
        </template>
        <template v-else>
          <h2 class="esercizio-vuoto-titolo">Questa lezione non ha schede</h2>
          <p class="esercizio-vuoto-testo">
            Le schede compaiono qui quando arriva il materiale di grammatica della lezione.
          </p>
        </template>
      </section>
    </div>

    <template v-else>
      <article v-for="scheda in schede" :key="scheda.id" class="carta scheda">
        <h2 class="scheda-titolo">{{ scheda.title }}</h2>
        <!-- L'unico HTML inserito nella pagina: viene da html(), che non interpreta l'HTML grezzo. -->
        <div class="scheda-testo" v-html="scheda.html"></div>
      </article>
    </template>
  </main>
</template>
