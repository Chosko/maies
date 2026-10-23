<script setup lang="ts">
import { useId } from 'vue'

// La riga dell'importanza e la conferma della rimozione, condivise da
// Esercizi e Vocaboli. Il componente mostra ed emette soltanto: l'importanza
// e la conferma aperta le tiene il ciclo della schermata.
defineProps<{
  importanza: number
  confermaAperta: boolean
  messaggio: string
}>()

const emit = defineEmits<{
  scegli: [valore: 1 | 2 | 3]
  chiediRimozione: []
  confermaRimozione: []
  annullaRimozione: []
}>()

const valori = [0, 1, 2, 3] as const
const idMessaggio = useId()

function tocca(valore: (typeof valori)[number]) {
  if (valore === 0) emit('chiediRimozione')
  else emit('scegli', valore)
}
</script>

<template>
  <div class="importanza">
    <div class="importanza-riga">
      <span class="importanza-etichetta" aria-hidden="true">Importanza</span>
      <div class="importanza-valori" role="group" aria-label="Importanza">
        <button
          v-for="valore in valori"
          :key="valore"
          type="button"
          class="importanza-valore"
          :class="{ 'importanza-scelta': valore === importanza }"
          :aria-pressed="valore === importanza ? 'true' : 'false'"
          :disabled="confermaAperta"
          @click="tocca(valore)"
        >
          {{ valore }}
        </button>
      </div>
    </div>
    <div
      v-if="confermaAperta"
      class="importanza-conferma"
      role="alertdialog"
      :aria-labelledby="idMessaggio"
    >
      <p :id="idMessaggio" class="importanza-conferma-testo">{{ messaggio }}</p>
      <div class="importanza-conferma-bottoni">
        <button type="button" class="bottone bottone-secondario" @click="emit('confermaRimozione')">
          Togli
        </button>
        <button type="button" class="bottone bottone-secondario" @click="emit('annullaRimozione')">
          Annulla
        </button>
      </div>
    </div>
  </div>
</template>
