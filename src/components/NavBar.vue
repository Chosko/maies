<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

// Le quattro voci, nello stesso ordine su ogni schermo; si mostrano solo quelle
// che hanno una rotta nel router dell'edizione. Le icone sono
// tracciati su griglia di 24px (design/design-system.md, § Icone).
const voci = [
  {
    nome: 'Esercizi',
    rotta: 'esercizi',
    indirizzo: '/esercizi',
    tracciati: ['M4 20h4L19 9l-4-4L4 16v4z', 'M14 6l4 4'],
    rettangoli: [],
  },
  {
    nome: 'Vocaboli',
    rotta: 'vocaboli',
    indirizzo: '/vocaboli',
    tracciati: ['M8 4h11a2 2 0 0 1 2 2v11'],
    rettangoli: [{ x: 3, y: 7, width: 13, height: 13, rx: 2 }],
  },
  {
    nome: 'Dizionario',
    rotta: 'dizionario',
    indirizzo: '/dizionario',
    tracciati: ['M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z', 'M5 17a3 3 0 0 1 3-3h10'],
    rettangoli: [],
  },
  {
    nome: 'Grammatica',
    rotta: 'grammatica',
    indirizzo: '/grammatica',
    tracciati: ['M5 6h14', 'M5 12h14', 'M5 18h9'],
    rettangoli: [],
  },
]

const route = useRoute()
const router = useRouter()
const presenti = voci.filter((voce) => router.hasRoute(voce.rotta))

// Una voce resta corrente anche sulle sottorotte del suo indirizzo.
function corrente(indirizzo: string): boolean {
  return route.path === indirizzo || route.path.startsWith(`${indirizzo}/`)
}
</script>

<template>
  <header class="barra">
    <span class="barra-nome">maies</span>
    <nav class="barra-voci" aria-label="Sezioni">
      <RouterLink
        v-for="voce in presenti"
        :key="voce.indirizzo"
        v-slot="{ href, navigate }"
        :to="voce.indirizzo"
        custom
      >
        <a
          :href="href"
          class="voce"
          :class="{ 'voce-corrente': corrente(voce.indirizzo) }"
          :aria-current="corrente(voce.indirizzo) ? 'page' : undefined"
          @click="navigate"
        >
          <span class="voce-icona">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect v-for="(r, i) in voce.rettangoli" :key="`r${i}`" v-bind="r" />
              <path v-for="(d, i) in voce.tracciati" :key="`p${i}`" :d="d" />
            </svg>
          </span>
          <span>{{ voce.nome }}</span>
        </a>
      </RouterLink>
    </nav>
  </header>
</template>
