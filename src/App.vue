<script setup lang="ts">
import FondoBandiera from './components/FondoBandiera.vue'
import NavBar from './components/NavBar.vue'
</script>

<template>
  <FondoBandiera>
    <NavBar />
    <RouterView />
  </FondoBandiera>
</template>
