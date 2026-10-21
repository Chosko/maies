import { createRouter, createWebHashHistory, type Router } from 'vue-router'
import EserciziView from '../views/EserciziView.vue'
import VocaboliView from '../views/VocaboliView.vue'
import DizionarioView from '../views/DizionarioView.vue'
import GrammaticaView from '../views/GrammaticaView.vue'

export function createAppRouter(): Router {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', redirect: '/esercizi' },
      { path: '/esercizi', name: 'esercizi', component: EserciziView },
      { path: '/vocaboli', name: 'vocaboli', component: VocaboliView },
      { path: '/dizionario', name: 'dizionario', component: DizionarioView },
      { path: '/grammatica', name: 'grammatica', component: GrammaticaView },
      { path: '/:pathMatch(.*)*', redirect: '/esercizi' },
    ],
  })
}
