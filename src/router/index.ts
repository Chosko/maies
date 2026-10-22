import { createRouter, createWebHashHistory, type Router } from 'vue-router'
import { EDIZIONE, type Edizione } from '../edizione'
import EserciziView from '../views/EserciziView.vue'
import VocaboliView from '../views/VocaboliView.vue'
import DizionarioView from '../views/DizionarioView.vue'
import GrammaticaView from '../views/GrammaticaView.vue'
import GrammaticaLezioneView from '../views/GrammaticaLezioneView.vue'

export function createAppRouter(edizione: Edizione = EDIZIONE): Router {
  // L'edizione kids ha solo Vocaboli e Dizionario: ogni altro indirizzo porta ai Vocaboli.
  if (edizione === 'kids') {
    return createRouter({
      history: createWebHashHistory(),
      routes: [
        { path: '/vocaboli', name: 'vocaboli', component: VocaboliView },
        { path: '/dizionario', name: 'dizionario', component: DizionarioView },
        { path: '/:pathMatch(.*)*', redirect: '/vocaboli' },
      ],
    })
  }
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', redirect: '/esercizi' },
      { path: '/esercizi', name: 'esercizi', component: EserciziView },
      { path: '/vocaboli', name: 'vocaboli', component: VocaboliView },
      { path: '/dizionario', name: 'dizionario', component: DizionarioView },
      { path: '/grammatica', name: 'grammatica', component: GrammaticaView },
      { path: '/grammatica/:id', name: 'grammatica-lezione', component: GrammaticaLezioneView },
      { path: '/:pathMatch(.*)*', redirect: '/esercizi' },
    ],
  })
}
