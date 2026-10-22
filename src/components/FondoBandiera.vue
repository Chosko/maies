<script setup lang="ts">
import { puntiBandiera } from '../fondo/bandiera'

const punti = puntiBandiera()
</script>

<template>
  <div class="fondo">
    <svg
      class="bandiera"
      aria-hidden="true"
      viewBox="0 420 400 400"
      preserveAspectRatio="xMaxYMax meet"
    >
      <path class="bandiera-fondo" :d="punti.fondo" />
      <path class="bandiera-diagonali" :d="punti.diagonali" />
      <path class="bandiera-croce" :d="punti.croce" />
    </svg>
    <slot />
  </div>
</template>
