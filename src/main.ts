import { createApp } from 'vue'
import App from './App.vue'
import { createAppRouter } from './router'
import { installTokens } from './styles/tokens'
import './styles/base.css'
import './styles/elements.css'
import './styles/computer.css'

installTokens()
createApp(App).use(createAppRouter()).mount('#app')
