/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// La modalità `kids` compila l'edizione per i kids: servita sotto /kids/,
// dentro dist/kids, con le lezioni di contenuti/kids.
export default defineConfig(({ mode }) => {
  const kids = mode === 'kids'
  return {
    base: kids ? '/kids/' : '/',
    plugins: [vue()],
    resolve: {
      alias: {
        '@lezioni': fileURLToPath(
          new URL(kids ? './contenuti/kids' : './contenuti/lezioni', import.meta.url),
        ),
      },
    },
    build: kids ? { outDir: 'dist/kids' } : {},
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.test.ts'],
      css: true,
    },
  }
})
